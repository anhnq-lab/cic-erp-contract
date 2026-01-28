import React, { useState } from 'react';
import { toast } from 'sonner';
import { ContractsAPI, PaymentsAPI, UnitsAPI, CustomersAPI, ProductsAPI } from '../../services/api';
import { Contract, Payment } from '../../types';

const PilotRunner = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);

    const log = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const runPilot = async () => {
        setIsRunning(true);
        setLogs([]);
        setProgress(0);
        log("🚀 Bắt đầu quá trình Chạy thử nghiệm (Pilot Phase)...");

        try {
            // STEP 1: PREPARE DATA
            log("📦 Bước 1: Chuẩn bị dữ liệu...");
            // Get a unit
            const units = await UnitsAPI.getAll();
            const unit = units.find(u => u.id !== 'all') || units[0];
            if (!unit) throw new Error("Không tìm thấy Đơn vị nào.");
            log(`- Đơn vị: ${unit.name}`);

            // Get a customer
            let customers = await CustomersAPI.getAll();
            if (customers.length === 0) {
                log("- Chưa có khách hàng. Đang tạo mới...");
                await CustomersAPI.create({
                    name: "Khách hàng Pilot Test",
                    shortName: "Client Pilot",
                    industry: "Công nghệ",
                    contactPerson: "Mr. Test",
                    phone: "0909000111",
                    email: "test@pilot.com",
                    address: "Hanoi",
                    type: "Customer"
                });
                customers = await CustomersAPI.getAll();
            }
            const customer = customers[0];
            log(`- Khách hàng: ${customer.name}`);
            setProgress(20);

            // STEP 2: CREATE CONTRACT (WIZARD SIMULATION)
            log("📝 Bước 2: Tạo Hợp đồng mới (Wizard Flow)...");

            // Generate Proper ID
            const year = new Date().getFullYear();
            const unitCode = unit.code || 'UNIT';
            const nextNum = await ContractsAPI.getNextContractNumber(unit.id, year);
            const stt = nextNum.toString().padStart(3, '0');
            const clientInitial = customer.shortName ? customer.shortName.toUpperCase().slice(0, 5) : 'TEST';
            const contractId = `HĐ_${stt}/${unitCode}_${clientInitial}_${year}`;

            const contractPayload: any = {
                id: contractId,
                title: `Hợp đồng Kiểm thử ${new Date().getTime()}`,
                contractType: 'Software',
                customerId: customer.id,
                unitId: unit.id,
                value: 50000000,
                status: 'New', // Initially New
                signedDate: new Date().toISOString().split('T')[0],
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                lineItems: [
                    { id: '1', name: "Dịch vụ Tư vấn Pilot", quantity: 1, inputPrice: 0, outputPrice: 50000000, vat: 10 }
                ],
                paymentPhases: [], // Will add later
                adminCosts: { bankFee: 0, exchangeLoss: 0, loanInterest: 0, other: 0 }
            };

            const createdContract = await ContractsAPI.create(contractPayload);
            log(`✅ Đã tạo Hợp đồng: ${createdContract.title} (ID: ${createdContract.id})`);
            setProgress(40);

            // Simulate Wizard Step 2 & 3: Updating details
            log("🔄 Cập nhật chi tiết Hợp đồng...");
            await ContractsAPI.update(createdContract.id, {
                status: 'Active',
                paymentPhases: [
                    { id: 'p1', name: "Đợt 1: Tạm ứng", percentage: 50, amount: 25000000, dueDate: new Date().toISOString(), status: 'Pending' },
                    { id: 'p2', name: "Đợt 2: Nghiệm thu", percentage: 50, amount: 25000000, dueDate: new Date().toISOString(), status: 'Pending' }
                ]
            });
            log("✅ Đã cập nhật Đợt thanh toán.");
            setProgress(60);

            // STEP 3: FINANCIAL TRANSACTION
            log("💰 Bước 3: Ghi nhận Doanh thu (Phiếu thu)...");
            // Fetch updated contract to get phase ID properly if we were strict, but here we construct payment
            // We assume backend or reliable store.
            // Actually, we inserted phases above as JSON. We should create a Payment record.
            const paymentPayload = {
                contractId: createdContract.id,
                customerId: customer.id,
                amount: 25000000,
                status: 'Paid', // Immediately paid
                method: 'Bank Transfer',
                paymentDate: new Date().toISOString().split('T')[0],
                paymentType: 'Revenue',
                notes: 'Thanh toán đợt 1 Pilot'
            };
            // Note: In real app, we link to phaseId. Since phaseId 'p1' is in JSON, we can use it.
            // But Payments table link to Phase? 
            // Let's verify Payment Phase interaction. In ContractDetail, status is derived from Payment records linked to contract?
            // Or Contract.paymentPhases.status is updated manually?
            // The system logic currently updates contract phase status when Payment is confirmed? 
            // Or simple linking. Let's just create the payment.
            await PaymentsAPI.create({ ...paymentPayload, phaseId: 'p1' } as any);
            log(`✅ Đã tạo Phiếu thu: 25,000,000 VND`);
            setProgress(80);

            // STEP 4: VERIFICATION
            log("📊 Bước 4: Kiểm tra Thống kê...");
            const stats = await ContractsAPI.getStats({ unitId: unit.id });
            log(`- Tổng Hợp đồng của đơn vị: ${stats.totalContracts}`);
            log(`- Tổng Giá trị: ${new Intl.NumberFormat('vi-VN').format(stats.totalValue)} VND`);

            log("🎉 KẾT THÚC: QUÁ TRÌNH KIỂM THỬ THÀNH CÔNG!");
            toast.success("Chạy Pilot thành công!");
            setProgress(100);

        } catch (error: any) {
            console.error(error);
            log(`❌ LỖI: ${error.message}`);
            toast.error("Có lỗi xảy ra: " + error.message);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Pilot Test Runner</h3>
                    <p className="text-sm text-slate-500">Chạy kịch bản kiểm thử tự động trên môi trường thật.</p>
                </div>
                <button
                    onClick={runPilot}
                    disabled={isRunning}
                    className={`px-4 py-2 rounded-xl font-bold text-white transition-all ${isRunning ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30'
                        }`}
                >
                    {isRunning ? 'Đang chạy...' : '▶ Chạy Test'}
                </button>
            </div>

            {/* Progress Bar */}
            {isRunning && (
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mb-4 overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            {/* Logs Console */}
            <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-xl h-64 overflow-y-auto border border-slate-700 shadow-inner">
                {logs.length === 0 ? (
                    <span className="text-slate-600 opacity-50">Sẵn sàng để chạy...</span>
                ) : (
                    logs.map((line, idx) => (
                        <div key={idx} className="mb-1 border-b border-green-900/20 pb-0.5 last:border-0">{line}</div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PilotRunner;
