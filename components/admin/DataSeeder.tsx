
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MOCK_UNITS } from '../../constants';

const DataSeeder: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');

    const seedUnits = async () => {
        setLoading(true);
        setStatus('Seeding Units...');
        try {
            const { error } = await supabase.from('units').upsert(
                MOCK_UNITS.map(unit => ({
                    id: unit.id,
                    name: unit.name,
                    type: unit.type,
                    code: unit.code,
                    target: unit.target,
                    last_year_actual: unit.lastYearActual
                }))
            );

            if (error) throw error;
            setStatus('✅ Units seeded successfully!');
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
            <div className="flex gap-4">
                <button
                    onClick={seedUnits}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? 'Seeding...' : 'Seed Units to Supabase'}
                </button>
            </div>
            {status && <div className="mt-4 text-sm font-medium">{status}</div>}
        </div>
    );
};

export default DataSeeder;
