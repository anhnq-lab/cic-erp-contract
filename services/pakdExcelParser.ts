/**
 * PAKD Excel Parser Service
 * Parse and generate Excel files for PAKD (Phương án Kinh doanh)
 */
import * as XLSX from 'xlsx';

export interface PAKDLineItem {
    id: string;
    stt: number;
    name: string;
    supplier: string;
    quantity: number;
    unit: string;
    unitCost: number;      // Đơn giá đầu vào
    totalCost: number;     // Thành tiền đầu vào
    unitPrice: number;     // Đơn giá đầu ra
    totalPrice: number;    // Thành tiền đầu ra
    importFee: number;     // Chi phí nhập khẩu
    contractorTax: number; // Thuế nhà thầu
    transferFee: number;   // Phí chuyển tiền
    margin: number;        // Chênh lệch
}

export interface PAKDAdminCosts {
    bankFee: number;       // Phí chuyển tiền/ngân hàng
    subcontractorFee: number; // Thuê nhà thầu
    importLogistics: number;  // Phí nhập khẩu/logistics
    expertFee: number;     // Phí thuê chuyên gia
    documentFee: number;   // Phí xử lý chứng từ
    supplierDiscount: number; // Chiết khấu thêm từ NCC (Bentley, etc)
}

// Dynamic execution cost item parsed from summary section
export interface PAKDExecutionCost {
    id: string;
    name: string;
    amount: number;
}

export interface PAKDFinancials {
    revenue: number;       // Doanh thu (sản lượng)
    costs: number;         // Tổng chi phí
    profit: number;        // Lợi nhuận
    margin: number;        // Hệ số LN/SL (%)
}

export interface ParsedPAKD {
    lineItems: PAKDLineItem[];
    adminCosts: PAKDAdminCosts;
    executionCosts: PAKDExecutionCost[];  // Dynamic execution costs (Chi phí khác, Phí chuyên gia, etc.)
    financials: PAKDFinancials;
}

// Excel column mapping (0-indexed)
const COL = {
    STT: 0,           // A
    NAME: 1,          // B
    SUPPLIER: 2,      // C
    QUANTITY: 3,      // D
    UNIT: 4,          // E
    UNIT_COST: 5,     // F
    TOTAL_COST: 6,    // G
    UNIT_PRICE: 7,    // H
    TOTAL_PRICE: 8,   // I
    IMPORT_FEE: 9,    // J
    CONTRACTOR_TAX: 10, // K
    TRANSFER_FEE: 11,   // L
    MARGIN: 12        // M
};

const HEADER_ROW = 3;  // Row 4 (0-indexed = 3)
const DATA_START_ROW = 4; // Row 5 (0-indexed = 4)

/**
 * Parse Excel file to PAKD data
 * Supports merged cells for shared costs (e.g., transfer fee shared across multiple products)
 */
export function parsePAKDExcel(file: File): Promise<ParsedPAKD> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Get merged cells info
                const merges = worksheet['!merges'] || [];

                // Build a map of merged cell ranges for fee columns (J=9, K=10, L=11)
                // Key: "startRow-endRow-col" -> value
                const mergedFees: Map<string, { startRow: number; endRow: number; col: number; value: number }> = new Map();

                for (const merge of merges) {
                    const col = merge.s.c;
                    // Only care about fee columns (Import=9, Tax=10, Transfer=11) and vertical merges
                    if ((col === COL.IMPORT_FEE || col === COL.CONTRACTOR_TAX || col === COL.TRANSFER_FEE)
                        && merge.s.r !== merge.e.r) {
                        // Get the value from the start cell
                        const cellAddr = XLSX.utils.encode_cell({ r: merge.s.r, c: col });
                        const cell = worksheet[cellAddr];
                        const value = cell ? Number(cell.v) || 0 : 0;

                        if (value > 0) {
                            const key = `${merge.s.r}-${merge.e.r}-${col}`;
                            mergedFees.set(key, {
                                startRow: merge.s.r,
                                endRow: merge.e.r,
                                col,
                                value
                            });
                            console.log(`[PAKD Parser] Found merged fee: col=${col}, rows=${merge.s.r + 1}-${merge.e.r + 1}, value=${value}`);
                        }
                    }
                }

                // Convert to JSON array
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                // Parse line items (from row 5 onwards, until empty STT)
                const lineItems: PAKDLineItem[] = [];
                let totalCostSum = 0;
                let totalPriceSum = 0;
                let totalMarginSum = 0;

                // First pass: collect all line item rows
                const lineItemRows: { rowIndex: number; row: any[] }[] = [];
                for (let i = DATA_START_ROW; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || !row[COL.STT] || typeof row[COL.STT] !== 'number') {
                        // Check if it's a "TỔNG CỘNG" row
                        if (row && String(row[COL.NAME] || '').toLowerCase().includes('tổng')) {
                            break;
                        }
                        continue;
                    }
                    lineItemRows.push({ rowIndex: i, row });
                }

                // Helper function to get fee value considering merged cells
                const getFeeValue = (rowIndex: number, col: number, defaultValue: number): { value: number; isShared: boolean; sharedCount: number } => {
                    for (const [, mergeInfo] of mergedFees.entries()) {
                        if (mergeInfo.col === col && rowIndex >= mergeInfo.startRow && rowIndex <= mergeInfo.endRow) {
                            // This row is part of a merged cell
                            const rowsInMerge = mergeInfo.endRow - mergeInfo.startRow + 1;
                            // Split the value evenly across all rows in the merge
                            return {
                                value: Math.round(mergeInfo.value / rowsInMerge),
                                isShared: true,
                                sharedCount: rowsInMerge
                            };
                        }
                    }
                    return { value: defaultValue, isShared: false, sharedCount: 1 };
                };

                // Second pass: parse line items with merged cell handling
                for (const { rowIndex, row } of lineItemRows) {
                    const importFeeInfo = getFeeValue(rowIndex, COL.IMPORT_FEE, Number(row[COL.IMPORT_FEE]) || 0);
                    const contractorTaxInfo = getFeeValue(rowIndex, COL.CONTRACTOR_TAX, Number(row[COL.CONTRACTOR_TAX]) || 0);
                    const transferFeeInfo = getFeeValue(rowIndex, COL.TRANSFER_FEE, Number(row[COL.TRANSFER_FEE]) || 0);

                    const item: PAKDLineItem = {
                        id: `item-${Date.now()}-${rowIndex}`,
                        stt: Number(row[COL.STT]) || lineItems.length + 1,
                        name: String(row[COL.NAME] || ''),
                        supplier: String(row[COL.SUPPLIER] || ''),
                        quantity: Number(row[COL.QUANTITY]) || 0,
                        unit: String(row[COL.UNIT] || 'VNĐ'),
                        unitCost: Number(row[COL.UNIT_COST]) || 0,
                        totalCost: Number(row[COL.TOTAL_COST]) || 0,
                        unitPrice: Number(row[COL.UNIT_PRICE]) || 0,
                        totalPrice: Number(row[COL.TOTAL_PRICE]) || 0,
                        importFee: importFeeInfo.value,
                        contractorTax: contractorTaxInfo.value,
                        transferFee: transferFeeInfo.value,
                        margin: Number(row[COL.MARGIN]) || 0,
                    };

                    lineItems.push(item);
                    totalCostSum += item.totalCost;
                    totalPriceSum += item.totalPrice;
                    totalMarginSum += item.margin;
                }

                // Calculate admin costs from line items
                const adminCosts: PAKDAdminCosts = {
                    bankFee: lineItems.reduce((sum, item) => sum + item.transferFee, 0),
                    subcontractorFee: lineItems.reduce((sum, item) => sum + item.contractorTax, 0),
                    importLogistics: lineItems.reduce((sum, item) => sum + item.importFee, 0),
                    expertFee: 0, // Will be parsed from summary section if available
                    documentFee: 0,
                    supplierDiscount: 0, // Chiết khấu thêm từ NCC
                };

                // Parse execution costs from summary section (dynamic items)
                const executionCosts: PAKDExecutionCost[] = [];

                // Try to find execution costs from summary section
                for (let i = DATA_START_ROW; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row) continue;

                    const labelCol0 = String(row[0] || '').trim();
                    const labelCol1 = String(row[1] || '').trim();
                    const label = (labelCol0 || labelCol1).toLowerCase();

                    // Extract value from column B (index 2) or C (index 3)
                    const valueStr = String(row[2] || row[3] || '0');
                    const value = Number(valueStr.replace(/[,\.]/g, '')) || 0;

                    // Chi phí khác
                    if (label.includes('chi phí khác') || label === 'chi phí khác') {
                        if (value > 0) {
                            executionCosts.push({
                                id: `pakd-chiphi-khac-${Date.now()}`,
                                name: 'Chi phí khác',
                                amount: value
                            });
                        }
                    }

                    // Phí thuê chuyên gia
                    if (label.includes('phí thuê chuyên gia') || label.includes('chuyên gia')) {
                        adminCosts.expertFee = value;
                        if (value > 0) {
                            executionCosts.push({
                                id: `pakd-expert-${Date.now()}`,
                                name: 'Phí thuê chuyên gia (net)',
                                amount: value
                            });
                        }
                    }

                    // Phí thanh toán chứng từ
                    if (label.includes('phí thanh toán') || label.includes('chứng từ')) {
                        adminCosts.documentFee = value;
                        if (value > 0) {
                            executionCosts.push({
                                id: `pakd-document-${Date.now()}`,
                                name: 'Phí thanh toán chứng từ',
                                amount: value
                            });
                        }
                    }

                    // Parse supplier discount (Chiết khấu thêm của Bentley, etc)
                    if (label.includes('chiết khấu') || label.includes('chiet khau')) {
                        adminCosts.supplierDiscount = value;
                    }
                }

                console.log('[PAKD Parser] Found execution costs:', executionCosts);

                // Calculate financials
                const totalAdminCosts = adminCosts.bankFee + adminCosts.subcontractorFee +
                    adminCosts.importLogistics + adminCosts.expertFee + adminCosts.documentFee;

                // Add execution costs to total (only those not already in adminCosts)
                const otherExecutionCosts = executionCosts
                    .filter(c => !c.name.includes('chuyên gia') && !c.name.includes('chứng từ'))
                    .reduce((sum, c) => sum + c.amount, 0);

                const financials: PAKDFinancials = {
                    revenue: totalPriceSum,
                    costs: totalCostSum + totalAdminCosts + otherExecutionCosts,
                    profit: totalPriceSum - totalCostSum - totalAdminCosts - otherExecutionCosts,
                    margin: totalPriceSum > 0
                        ? Math.round(((totalPriceSum - totalCostSum - totalAdminCosts - otherExecutionCosts) / totalPriceSum) * 100 * 100) / 100
                        : 0,
                };

                resolve({
                    lineItems,
                    adminCosts,
                    executionCosts,
                    financials,
                });
            } catch (error) {
                console.error('[PAKD Parser] Error parsing Excel:', error);
                reject(new Error('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Lỗi đọc file'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Generate PAKD Excel template
 */
export function generatePAKDTemplate(): void {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Template data
    const templateData = [
        // Row 1: Title
        ['', 'BẢNG PHƯƠNG ÁN KINH DOANH (PAKD)'],
        // Row 2: Subtitle
        ['', 'Hợp đồng số: [Mã hợp đồng] - [Tên khách hàng]'],
        // Row 3: Empty
        [],
        // Row 4: Header
        [
            'STT',
            'Tên sản phẩm/Dịch vụ',
            'Nhà cung cấp',
            'Số lượng',
            'ĐVT',
            'Đơn giá (Đầu vào)',
            'Thành tiền (Đầu vào)',
            'Đơn giá (Đầu ra)',
            'Thành tiền (Đầu ra)',
            'Nhập khẩu',
            'Thuế nhà thầu',
            'Chuyển tiền',
            'Chênh lệch'
        ],
        // Row 5: Sample data 1
        [1, 'Phần mềm ABC', 'NCC A', 1, 'VNĐ', 10000000, 10000000, 15000000, 15000000, 0, 0, 50000, 4950000],
        // Row 6: Sample data 2
        [2, 'Dịch vụ tư vấn', 'NCC B', 2, 'VNĐ', 5000000, 10000000, 7500000, 15000000, 0, 250000, 0, 4750000],
        // Row 7: Empty for more items
        [],
        // Row 8: Total row
        ['', 'TỔNG CỘNG', '', '', '', '', 20000000, '', 30000000, 0, 250000, 50000, 9700000],
        // Row 9: Empty
        [],
        // Row 10: Summary section header
        ['', 'TỔNG HỢP TÀI CHÍNH:'],
        // Row 11-17: Summary items
        ['', 'Đầu vào', 20000000],
        ['', 'Sản lượng (Đầu ra)', 30000000],
        ['', 'Chi phí khác', 300000],
        ['', 'Phí thuê chuyên gia (net)', 0],
        ['', 'Phí thanh toán chứng từ', 0],
        ['', 'Tổng chi phí', 20300000],
        ['', 'Lợi nhuận', 9700000],
        ['', 'Hệ số LN/ SL', '32.33%'],
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    ws['!cols'] = [
        { wch: 5 },   // A: STT
        { wch: 30 },  // B: Tên sản phẩm
        { wch: 15 },  // C: NCC
        { wch: 10 },  // D: SL
        { wch: 8 },   // E: ĐVT
        { wch: 18 },  // F: Đơn giá vào
        { wch: 18 },  // G: Thành tiền vào
        { wch: 18 },  // H: Đơn giá ra
        { wch: 18 },  // I: Thành tiền ra
        { wch: 12 },  // J: Nhập khẩu
        { wch: 14 },  // K: Thuế nhà thầu
        { wch: 12 },  // L: Chuyển tiền
        { wch: 14 },  // M: Chênh lệch
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'PAKD');

    // Generate and download file
    XLSX.writeFile(wb, 'PAKD_Template.xlsx');
}

/**
 * Convert parsed PAKD to form-compatible format
 */
export function convertToFormData(parsed: ParsedPAKD) {
    return {
        lineItems: parsed.lineItems.map(item => ({
            id: item.id,
            name: item.name,
            supplierId: '', // Will need to match with existing suppliers
            supplierName: item.supplier,
            quantity: item.quantity,
            unit: item.unit,
            inputPrice: item.unitCost,
            outputPrice: item.unitPrice,
            directCosts: {
                importFee: item.importFee,
                contractorTax: item.contractorTax,
                transferFee: item.transferFee,
            },
        })),
        adminCosts: {
            bankFee: parsed.adminCosts.bankFee,
            bankFeePercent: 0,
            subcontractorFee: parsed.adminCosts.subcontractorFee,
            subcontractorPercent: 0,
            importLogistics: parsed.adminCosts.importLogistics,
            importLogisticsPercent: 0,
            expertFee: parsed.adminCosts.expertFee,
            expertFeePercent: 0,
            documentFee: parsed.adminCosts.documentFee,
            documentFeePercent: 0,
        },
        financials: parsed.financials,
    };
}
