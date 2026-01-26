
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MOCK_UNITS, MOCK_CUSTOMERS, MOCK_SALESPEOPLE, MOCK_PRODUCTS, MOCK_CONTRACTS, MOCK_PAYMENTS } from '../../constants';

const DataSeeder: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');

    const seedAll = async () => {
        setLoading(true);
        setStatus('Starting full seed...');

        try {
            // 1. Units
            setStatus('Seeding Units...');
            const { error: errUnits } = await supabase.from('units').upsert(
                MOCK_UNITS.map(unit => ({
                    id: unit.id,
                    name: unit.name,
                    type: unit.type,
                    code: unit.code,
                    target: unit.target,
                    last_year_actual: unit.lastYearActual
                }))
            );
            if (errUnits) throw new Error(`Units Error: ${errUnits.message}`);

            // 2. Customers
            setStatus('Seeding Customers...');
            const { error: errCustomers } = await supabase.from('customers').upsert(
                MOCK_CUSTOMERS.map(c => ({
                    id: c.id,
                    name: c.name,
                    short_name: c.shortName,
                    industry: c.industry,
                    contact_person: c.contactPerson,
                    phone: c.phone,
                    email: c.email,
                    address: c.address,
                    tax_code: c.taxCode,
                    website: c.website,
                    notes: c.notes,
                    bank_name: c.bankName,
                    bank_branch: c.bankBranch,
                    bank_account: c.bankAccount
                }))
            );
            if (errCustomers) throw new Error(`Customers Error: ${errCustomers.message}`);

            // 3. Sales People
            setStatus('Seeding Sales People...');
            const { error: errSales } = await supabase.from('sales_people').upsert(
                MOCK_SALESPEOPLE.map(s => ({
                    id: s.id,
                    name: s.name,
                    unit_id: s.unitId,
                    employee_code: s.employeeCode,
                    email: s.email,
                    phone: s.phone,
                    position: s.position,
                    date_joined: s.dateJoined,
                    target: s.target
                }))
            );
            if (errSales) throw new Error(`SalesPeople Error: ${errSales.message}`);

            // 4. Products
            setStatus('Seeding Products...');
            const { error: errProducts } = await supabase.from('products').upsert(
                MOCK_PRODUCTS.map(p => ({
                    id: p.id,
                    code: p.code,
                    name: p.name,
                    category: p.category,
                    description: p.description,
                    unit: p.unit,
                    base_price: p.basePrice,
                    cost_price: p.costPrice,
                    is_active: p.isActive,
                    unit_id: p.unitId
                }))
            );
            if (errProducts) throw new Error(`Products Error: ${errProducts.message}`);

            // 5. Contracts
            setStatus('Seeding Contracts...');
            // Process in chunks to avoid payload too large if many contracts
            const chunks = [];
            const chunkSize = 50;
            for (let i = 0; i < MOCK_CONTRACTS.length; i += chunkSize) {
                chunks.push(MOCK_CONTRACTS.slice(i, i + chunkSize));
            }

            for (const chunk of chunks) {
                const { error: errContracts } = await supabase.from('contracts').upsert(
                    chunk.map(c => ({
                        id: c.id,
                        title: c.title,
                        contract_type: c.contractType,
                        party_a: c.partyA,
                        party_b: c.partyB,
                        client_initials: c.clientInitials,
                        customer_id: c.customerId,
                        unit_id: c.unitId,
                        salesperson_id: c.salespersonId,
                        value: c.value,
                        estimated_cost: c.estimatedCost,
                        actual_revenue: c.actualRevenue,
                        actual_cost: c.actualCost,
                        status: c.status,
                        stage: c.stage,
                        category: c.category,
                        signed_date: c.signedDate,
                        start_date: c.startDate,
                        end_date: c.endDate,
                        content: c.content,
                        contacts: c.contacts || [],
                        milestones: c.milestones || [],
                        payment_phases: c.paymentPhases || []
                    }))
                );
                if (errContracts) throw new Error(`Contracts Error: ${errContracts.message}`);
            }

            // 6. Payments
            setStatus('Seeding Payments...');
            const { error: errPayments } = await supabase.from('payments').upsert(
                MOCK_PAYMENTS.map(p => ({
                    id: p.id,
                    contract_id: p.contractId,
                    customer_id: p.customerId,
                    amount: p.amount,
                    paid_amount: p.paidAmount || 0,
                    status: p.status,
                    method: p.method,
                    due_date: p.dueDate,
                    payment_date: p.paymentDate || null,
                    invoice_number: p.invoiceNumber,
                    reference: p.reference,
                    notes: p.notes
                }))
            );
            if (errPayments) throw new Error(`Payments Error: ${errPayments.message}`);

            setStatus('✅ All data seeded successfully!');
        } catch (err: any) {
            console.error(err);
            setStatus(`❌ Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 my-4">
            <h3 className="text-lg font-bold mb-4">Database Seeding Tool</h3>
            <p className="mb-4 text-sm text-slate-500">
                Click below to wipe existing data (if collision) and repopulate from constants.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={seedAll}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 font-medium"
                >
                    {loading ? 'Seeding...' : 'Seed All Data'}
                </button>
            </div>
            {status && (
                <div className={`mt-4 text-sm font-medium ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                    {status}
                </div>
            )}
        </div>
    );
};

export default DataSeeder;
