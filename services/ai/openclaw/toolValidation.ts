/**
 * services/ai/openclaw/toolValidation.ts
 *
 * Zod-based input/output validation for OpenClaw tools (Phase 5 Task 5.3).
 *
 * Usage:
 * ```ts
 * import { validateToolInput, wrapWithValidation } from './toolValidation';
 * import { z } from 'zod';
 *
 * const MyInputSchema = z.object({ contractId: z.string().uuid() });
 *
 * export const myTool: OpenClawTool = {
 *   name: 'my_tool',
 *   execute: wrapWithValidation(MyInputSchema, async (args, ctx) => {
 *     // args is fully typed here
 *     return await ContractService.getById(args.contractId);
 *   }),
 * };
 * ```
 */

import { z, ZodTypeAny } from 'zod';
import type { UserContext } from './types';

// ── Common reusable schemas ───────────────────────────────────────────────────

/** Trống hoặc YYYY-MM-DD */
export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải theo định dạng YYYY-MM-DD')
  .optional();

/** Năm dạng string hoặc number */
export const YearSchema = z
  .union([z.string().regex(/^\d{4}$/, 'Năm phải là 4 chữ số'), z.number().int().min(2000).max(2100)])
  .optional();

/** Trạng thái hợp đồng */
export const ContractStatusSchema = z
  .enum(['Processing', 'Completed', 'Suspended', 'Cancelled', 'All'])
  .optional();

/** Phân trang */
export const PaginationSchema = z.object({
  page:  z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
});

// ── Core schemas by domain ────────────────────────────────────────────────────

export const SearchContractsInputSchema = z.object({
  search:   z.string().max(500).optional(),
  status:   ContractStatusSchema,
  unitId:   z.string().optional(),
  year:     z.union([z.string(), z.number()]).optional(),
  dateFrom: DateStringSchema,
  dateTo:   DateStringSchema,
  page:     z.number().int().min(1).optional(),
  limit:    z.number().int().min(1).max(50).optional(),
});

export const GetContractDetailInputSchema = z.object({
  contractId: z.string().min(1, 'contractId là bắt buộc'),
});

export const SearchCustomersInputSchema = z.object({
  search: z.string().max(500).optional(),
  type:   z.enum(['Customer', 'Supplier', 'Both', 'all']).optional(),
  page:   z.number().int().min(1).optional(),
  limit:  z.number().int().min(1).max(50).optional(),
});

export const GetCustomer360InputSchema = z.object({
  customerId: z.string().min(1, 'customerId là bắt buộc'),
});

export const SearchEmployeesInputSchema = z.object({
  search: z.string().max(500).optional(),
  unitId: z.string().optional(),
  page:   z.number().int().min(1).optional(),
  limit:  z.number().int().min(1).max(50).optional(),
});

export const GetDashboardKpiInputSchema = z.object({
  year:    YearSchema,
  unitId:  z.string().optional(),
  quarter: z.number().int().min(1).max(4).optional(),
});

export const SearchPaymentsInputSchema = z.object({
  contractId: z.string().optional(),
  dateFrom:   DateStringSchema,
  dateTo:     DateStringSchema,
  status:     z.string().optional(),
  page:       z.number().int().min(1).optional(),
  limit:      z.number().int().min(1).max(50).optional(),
});

export const CreateTaskInputSchema = z.object({
  title:       z.string().min(1, 'Tiêu đề task là bắt buộc').max(500),
  description: z.string().max(5000).optional(),
  assigneeId:  z.string().optional(),
  contractId:  z.string().optional(),
  dueDate:     DateStringSchema,
  priority:    z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

// ── Validation helpers ────────────────────────────────────────────────────────

/**
 * Validate tool input against a Zod schema.
 * Returns `{ success: true, data }` or `{ success: false, error }`.
 */
export function validateToolInput<T extends ZodTypeAny>(
  schema: T,
  input: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Zod v4 uses .issues (was .errors in v3)
  const issues = (result.error as any).issues ?? (result.error as any).errors ?? [];
  const messages = issues
    .map((e: any) => `${(e.path ?? []).join('.')}: ${e.message}`)
    .join('; ');
  return { success: false, error: `Tool input không hợp lệ: ${messages}` };
}

/**
 * Wraps a tool execute function with Zod input validation.
 * If input fails validation, the tool returns a structured error string
 * rather than crashing or calling the DB with bad data.
 *
 * @param schema   Zod schema for the tool's input args
 * @param handler  The actual execute function
 */
export function wrapWithValidation<T extends ZodTypeAny>(
  schema: T,
  handler: (args: z.infer<T>, context: UserContext) => Promise<unknown>
): (args: unknown, context: UserContext) => Promise<string | object> {
  return async (args: unknown, context: UserContext): Promise<string | object> => {
    const result = validateToolInput(schema, args);
    if (!result.success) {
      console.error('[ToolValidation] Input validation failed:', result.error);
      return `Lỗi: ${result.error}`;
    }
    return (await handler(result.data, context)) as string | object;
  };
}
