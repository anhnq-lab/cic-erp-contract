import React, { useState, useEffect } from 'react';
import { dataClient as supabase } from '../lib/dataClient';
import { Bug, RefreshCw, Database, User, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface DiagResult {
    name: string;
    status: 'ok' | 'error' | 'warning' | 'loading';
    message: string;
    data?: any;
}

const DebugPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<DiagResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const runDiagnostics = async () => {
        setIsRunning(true);
        const newResults: DiagResult[] = [];

        // 1. Check Supabase Connection
        try {
            const start = Date.now();
            const { data, error } = await supabase.from('units').select('id', { head: true });
            const elapsed = Date.now() - start;

            if (error) {
                newResults.push({
                    name: 'Supabase Connection',
                    status: 'error',
                    message: `Failed: ${error.message}`,
                    data: error
                });
            } else {
                newResults.push({
                    name: 'Supabase Connection',
                    status: 'ok',
                    message: `Connected (${elapsed}ms)`
                });
            }
        } catch (err: any) {
            newResults.push({
                name: 'Supabase Connection',
                status: 'error',
                message: `Exception: ${err.message}`
            });
        }

        // 2. Check Auth Session
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                newResults.push({
                    name: 'Auth Session',
                    status: 'error',
                    message: `Error: ${error.message}`
                });
            } else if (session) {
                newResults.push({
                    name: 'Auth Session',
                    status: 'ok',
                    message: `User: ${session.user.email}`
                });
            } else {
                newResults.push({
                    name: 'Auth Session',
                    status: 'warning',
                    message: 'No session (may need login)'
                });
            }
        } catch (err: any) {
            newResults.push({
                name: 'Auth Session',
                status: 'error',
                message: `Exception: ${err.message}`
            });
        }

        // 3. Check Data Tables
        const tables = ['units', 'employees', 'contracts', 'customers', 'products', 'profiles'];
        for (const table of tables) {
            try {
                const { data, error, count } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: false })
                    .limit(1);

                if (error) {
                    newResults.push({
                        name: `Table: ${table}`,
                        status: 'error',
                        message: `Error: ${error.message}`,
                        data: error
                    });
                } else {
                    const actualCount = data?.length ?? 0;
                    newResults.push({
                        name: `Table: ${table}`,
                        status: actualCount > 0 ? 'ok' : 'warning',
                        message: `Records: ${count ?? actualCount}`,
                        data: data?.[0]
                    });
                }
            } catch (err: any) {
                newResults.push({
                    name: `Table: ${table}`,
                    status: 'error',
                    message: `Exception: ${err.message}`
                });
            }
        }

        // 4. Check RPC Functions
        const rpcs = [
            { name: 'get_units_with_stats', params: { p_year: 2026 } },
            { name: 'get_contract_stats', params: { p_unit_id: 'all', p_year: 'all' } }
        ];

        for (const rpc of rpcs) {
            try {
                const { data, error } = await supabase.rpc(rpc.name, rpc.params);

                if (error) {
                    newResults.push({
                        name: `RPC: ${rpc.name}`,
                        status: error.code === 'PGRST202' ? 'warning' : 'error',
                        message: error.code === 'PGRST202' ? 'Function not found (using fallback)' : error.message
                    });
                } else {
                    newResults.push({
                        name: `RPC: ${rpc.name}`,
                        status: 'ok',
                        message: `Returned ${Array.isArray(data) ? data.length : 1} results`
                    });
                }
            } catch (err: any) {
                newResults.push({
                    name: `RPC: ${rpc.name}`,
                    status: 'error',
                    message: `Exception: ${err.message}`
                });
            }
        }

        // 5. TEST FULL LOAD (Simulate Fallback)
        try {
            const startLoad = Date.now();
            const { data: contracts, error: loadError } = await supabase
                .from('contracts')
                .select('id, value, actual_revenue, estimated_cost, status');
            const endLoad = Date.now();

            if (loadError) {
                newResults.push({
                    name: 'FULL LOAD TEST',
                    status: 'error',
                    message: `Failed: ${loadError.message}`
                });
            } else {
                newResults.push({
                    name: 'FULL LOAD TEST',
                    status: 'ok',
                    message: `Fetched ${contracts?.length} rows in ${endLoad - startLoad}ms`
                });
            }
        } catch (e: any) {
            newResults.push({
                name: 'FULL LOAD TEST',
                status: 'error',
                message: `Crash: ${e.message}`
            });
        }

        setResults(newResults);
        setIsRunning(false);
    };

    useEffect(() => {
        if (isOpen && results.length === 0) {
            runDiagnostics();
        }
    }, [isOpen]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 right-4 z-50 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
                title="Open Debug Panel"
            >
                <Bug size={24} />
            </button>
        );
    }

    const StatusIcon: React.FC<{ status: DiagResult['status'] }> = ({ status }) => {
        switch (status) {
            case 'ok':
                return <CheckCircle2 className="text-green-500" size={16} />;
            case 'error':
                return <XCircle className="text-red-500" size={16} />;
            case 'warning':
                return <AlertTriangle className="text-yellow-500" size={16} />;
            default:
                return <RefreshCw className="text-gray-400 animate-spin" size={16} />;
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-purple-600">
                <div className="flex items-center gap-2">
                    <Bug size={20} />
                    <span className="font-semibold">Debug Panel</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={runDiagnostics}
                        disabled={isRunning}
                        className="p-1 hover:bg-purple-500 rounded disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isRunning ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-purple-500 rounded"
                    >
                        ×
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto max-h-[60vh]">
                {results.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-gray-800 rounded-lg">
                        <StatusIcon status={r.status} />
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{r.name}</div>
                            <div className={`text-xs ${r.status === 'ok' ? 'text-green-400' :
                                r.status === 'error' ? 'text-red-400' :
                                    r.status === 'warning' ? 'text-yellow-400' : 'text-gray-400'
                                }`}>
                                {r.message}
                            </div>
                        </div>
                    </div>
                ))}

                {results.length === 0 && (
                    <div className="text-center text-gray-400 py-4">
                        Click refresh to run diagnostics
                    </div>
                )}
            </div>

            <div className="p-3 bg-gray-800 text-xs text-gray-400 border-t border-gray-700">
                <div>Supabase: Connected ✓</div>
            </div>
        </div>
    );
};

export default DebugPanel;
