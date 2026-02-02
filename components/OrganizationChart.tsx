import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Users, ChevronDown, ChevronRight, Crown, User, Target, TrendingUp, Edit2 } from 'lucide-react';
import { Unit, Employee } from '../types';
import { UnitService, EmployeeService } from '../services';
import { formatVND } from '../lib/utils';

interface OrgNode extends Unit {
    children: OrgNode[];
    manager?: Employee;
    employeeCount?: number;
    contractCount?: number;
}

interface OrganizationChartProps {
    onSelectUnit?: (unit: Unit) => void;
    onEditUnit?: (unit: Unit) => void;
}

const OrganizationChart: React.FC<OrganizationChartProps> = ({ onSelectUnit, onEditUnit }) => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [unitsData, employeesData] = await Promise.all([
                    UnitService.getAll(),
                    EmployeeService.list({ page: 1, pageSize: 200 })
                ]);
                setUnits(unitsData);
                const empList = Array.isArray(employeesData) ? employeesData : (employeesData as any).data || [];
                setEmployees(empList);
                // Expand root nodes by default
                const rootIds = unitsData.filter(u => !u.parentId || u.parentId === 'all').map(u => u.id);
                setExpandedNodes(new Set(rootIds));
            } catch (error) {
                console.error('Error fetching org data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Build tree structure from flat units list
    const orgTree = useMemo(() => {
        const unitMap = new Map<string, OrgNode>();

        // First pass: create nodes with enriched data
        units.forEach(unit => {
            const manager = employees.find(e => e.id === unit.managerId);
            const employeeCount = employees.filter(e => e.unitId === unit.id).length;

            unitMap.set(unit.id, {
                ...unit,
                children: [],
                manager,
                employeeCount
            });
        });

        // Second pass: build parent-child relationships
        const rootNodes: OrgNode[] = [];
        units.forEach(unit => {
            const node = unitMap.get(unit.id)!;
            if (unit.parentId && unit.parentId !== 'all' && unitMap.has(unit.parentId)) {
                unitMap.get(unit.parentId)!.children.push(node);
            } else {
                rootNodes.push(node);
            }
        });

        // Sort children by sortOrder
        const sortChildren = (nodes: OrgNode[]) => {
            nodes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            nodes.forEach(node => sortChildren(node.children));
        };
        sortChildren(rootNodes);

        return rootNodes;
    }, [units, employees]);

    const toggleExpand = (id: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const expandAll = () => {
        setExpandedNodes(new Set(units.map(u => u.id)));
    };

    const collapseAll = () => {
        setExpandedNodes(new Set());
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'Company':
                return {
                    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
                    border: 'border-amber-400',
                    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                };
            case 'Branch':
                return {
                    bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
                    border: 'border-blue-400',
                    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                };
            default:
                return {
                    bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
                    border: 'border-emerald-400',
                    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                };
        }
    };

    const renderNode = (node: OrgNode, level: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children.length > 0;
        const styles = getTypeStyles(node.type);
        const signingProgress = node.target?.signing ? Math.min(100, Math.round((node.employeeCount || 0) * 10)) : 0;

        return (
            <div key={node.id} className="relative">
                {/* Connection lines */}
                {level > 0 && (
                    <div className="absolute left-[-20px] top-0 w-5 h-8 border-l-2 border-b-2 border-slate-300 dark:border-slate-600 rounded-bl-lg" />
                )}

                {/* Node card */}
                <div
                    className={`relative group mb-3 ml-${level > 0 ? '8' : '0'}`}
                    style={{ marginLeft: level > 0 ? `${level * 32}px` : 0 }}
                >
                    <div className={`p-4 rounded-xl bg-white dark:bg-slate-800 border-2 ${styles.border} shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer`}
                        onClick={() => onSelectUnit?.(node)}>
                        <div className="flex items-start gap-3">
                            {/* Expand/Collapse button */}
                            {hasChildren && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
                                    className="mt-1 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="w-5 h-5 text-slate-500" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-slate-500" />
                                    )}
                                </button>
                            )}
                            {!hasChildren && <div className="w-7" />}

                            {/* Icon */}
                            <div className={`p-3 rounded-xl ${styles.bg} shadow-lg`}>
                                <Building2 className="w-6 h-6 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-slate-800 dark:text-white truncate">{node.name}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
                                        {node.type === 'Company' ? 'CTY' : node.type === 'Branch' ? 'CN' : 'TT'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                        {node.code}
                                    </span>
                                </div>

                                {/* Manager info */}
                                {node.manager && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                                        <Crown className="w-4 h-4 text-amber-500" />
                                        <span className="font-medium">{node.manager.name}</span>
                                        <span className="text-slate-400">({node.manager.position || 'Trưởng ĐV'})</span>
                                    </div>
                                )}

                                {/* Stats row */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                        <Users className="w-4 h-4" />
                                        <span>{node.employeeCount || 0} NV</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                        <Target className="w-4 h-4" />
                                        <span>{formatVND(node.target?.signing || 0)}</span>
                                    </div>
                                    {hasChildren && (
                                        <div className="flex items-center gap-1 text-indigo-500">
                                            <Building2 className="w-4 h-4" />
                                            <span>{node.children.length} ĐV con</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                {onEditUnit && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEditUnit(node); }}
                                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div className="relative">
                        {node.children.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
                    <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Sơ đồ Tổ chức</h2>
                        <p className="text-sm text-slate-500">{units.length} đơn vị · {employees.length} nhân viên</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={expandAll}
                        className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Mở tất cả
                    </button>
                    <button
                        onClick={collapseAll}
                        className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Thu gọn
                    </button>
                </div>
            </div>

            {/* Tree view */}
            <div className="space-y-2">
                {orgTree.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Chưa có dữ liệu sơ đồ tổ chức</p>
                        <p className="text-sm">Hãy thiết lập parent_id cho các đơn vị</p>
                    </div>
                ) : (
                    orgTree.map(node => renderNode(node, 0))
                )}
            </div>
        </div>
    );
};

export default OrganizationChart;
