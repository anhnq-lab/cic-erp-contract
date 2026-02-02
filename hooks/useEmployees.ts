import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeService } from '../services';
import { Employee } from '../types';
import { queryKeys } from '../lib/queryClient';

// Get all employees
export function useEmployees(unitId?: string) {
    return useQuery({
        queryKey: unitId ? queryKeys.employees.byUnit(unitId) : queryKeys.employees.all,
        queryFn: () => EmployeeService.getAll(),
        select: (data) => unitId ? data.filter(e => e.unitId === unitId) : data,
    });
}

// Get single employee
export function useEmployee(id: string) {
    return useQuery({
        queryKey: queryKeys.employees.detail(id),
        queryFn: () => EmployeeService.getById(id),
        enabled: !!id,
    });
}

// Create employee mutation
export function useCreateEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<Employee, 'id'>) => EmployeeService.create(data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
        },
    });
}

// Update employee mutation
export function useUpdateEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Employee) => EmployeeService.update(data.id, data as any),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(variables.id) });
        },
    });
}

// Delete employee mutation
export function useDeleteEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => EmployeeService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
        },
    });
}
