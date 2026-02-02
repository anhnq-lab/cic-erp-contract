import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Users, ChevronDown, ChevronUp, Crown, Edit2, Plus, Minus } from 'lucide-react';
import { Unit, Employee } from '../types';
import { UnitService, EmployeeService } from '../services';

interface OrgNode extends Unit {
    children: OrgNode[];
    manager?: Employee;
    employeeCount?: number;
}

interface OrganizationChartProps {
    onSelectUnit?: (unit: Unit) => void;
    onEditUnit?: (unit: Unit) => void;
}

const OrganizationChart: React.FC<OrganizationChartProps> = ({ onSelectUnit, onEditUnit }) => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(100);

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

    const toggleCollapse = (id: string) => {
        setCollapsedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Company':
                return 'from-amber-500 to-orange-600 border-amber-400';
            case 'Branch':
                return 'from-blue-500 to-indigo-600 border-blue-400';
            default:
                return 'from-emerald-500 to-teal-600 border-emerald-400';
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'Company':
                return { text: 'CTY', bg: 'bg-amber-100 text-amber-800' };
            case 'Branch':
                return { text: 'CN', bg: 'bg-blue-100 text-blue-800' };
            default:
                return { text: 'TT', bg: 'bg-emerald-100 text-emerald-800' };
        }
    };

    // Render a single node box
    const renderNodeBox = (node: OrgNode) => {
        const hasChildren = node.children.length > 0;
        const isCollapsed = collapsedNodes.has(node.id);
        const badge = getTypeBadge(node.type);
        const colorClass = getTypeColor(node.type);

        return (
            <div
                className={`relative bg-gradient-to-br ${colorClass} text-white rounded-xl shadow-lg min-w-[160px] max-w-[200px] cursor-pointer hover:scale-105 transition-transform group`}
                onClick={() => onSelectUnit?.(node)}
            >
                {/* Main content */}
                <div className="px-4 py-3 text-center">
                    <div className="font-bold text-sm leading-tight mb-1 line-clamp-2">{node.name}</div>
                    <div className="flex items-center justify-center gap-1 text-xs opacity-90">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${badge.bg}`}>
                            {badge.text}
                        </span>
                        <span className="opacity-75">{node.code}</span>
                    </div>
                    {node.manager && (
                        <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-90 flex items-center justify-center gap-1">
                            <Crown size={12} />
                            <span className="truncate">{node.manager.name}</span>
                        </div>
                    )}
                    <div className="text-[10px] opacity-75 mt-1">
                        <Users size={10} className="inline mr-1" />
                        {node.employeeCount || 0} NV
                    </div>
                </div>

                {/* Collapse/Expand button */}
                {hasChildren && (
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleCollapse(node.id); }}
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-100 z-10"
                    >
                        {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                )}

                {/* Edit button (on hover) */}
                {onEditUnit && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onEditUnit(node); }}
                        className="absolute top-1 right-1 p-1 rounded bg-white/20 hover:bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Edit2 size={12} />
                    </button>
                )}
            </div>
        );
    };

    // Recursively render tree with connecting lines
    const renderTree = (nodes: OrgNode[]) => {
        if (nodes.length === 0) return null;

        return (
            <div className="flex flex-col items-center">
                {/* Horizontal row of sibling nodes */}
                <div className="flex gap-8 relative">
                    {nodes.map((node, index) => {
                        const hasChildren = node.children.length > 0;
                        const isCollapsed = collapsedNodes.has(node.id);
                        const showChildren = hasChildren && !isCollapsed;

                        return (
                            <div key={node.id} className="flex flex-col items-center">
                                {/* Vertical line from parent (for non-root nodes) */}
                                {nodes.length > 1 && (
                                    <div className="absolute top-0 left-0 right-0 h-0 flex justify-center">
                                        {/* Horizontal connector line */}
                                    </div>
                                )}

                                {/* The node box */}
                                {renderNodeBox(node)}

                                {/* Children section */}
                                {showChildren && (
                                    <div className="flex flex-col items-center mt-8">
                                        {/* Vertical line down to children */}
                                        <div className="w-0.5 h-6 bg-slate-300"></div>

                                        {/* Horizontal line connecting children */}
                                        {node.children.length > 1 && (
                                            <div className="relative w-full flex justify-center">
                                                <div
                                                    className="absolute h-0.5 bg-slate-300"
                                                    style={{
                                                        left: `calc(50% - ${(node.children.length - 1) * 104}px)`,
                                                        right: `calc(50% - ${(node.children.length - 1) * 104}px)`,
                                                    }}
                                                ></div>
                                            </div>
                                        )}

                                        {/* Render children */}
                                        <div className="flex gap-8 mt-0">
                                            {node.children.map((child, childIndex) => (
                                                <div key={child.id} className="flex flex-col items-center">
                                                    {/* Vertical line from horizontal connector */}
                                                    <div className="w-0.5 h-6 bg-slate-300"></div>
                                                    {renderTree([child])}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-32 h-20 rounded-xl bg-slate-200 dark:bg-slate-700" />
                    <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex gap-4">
                        <div className="w-24 h-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
                        <div className="w-24 h-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
                        <div className="w-24 h-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Sơ đồ Tổ chức</h2>
                        <p className="text-xs text-slate-500">{units.length} đơn vị · {employees.length} nhân viên</p>
                    </div>
                </div>

                {/* Zoom controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setZoom(Math.max(50, zoom - 10))}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                    >
                        <Minus size={16} />
                    </button>
                    <span className="text-sm font-medium text-slate-600 w-12 text-center">{zoom}%</span>
                    <button
                        onClick={() => setZoom(Math.min(150, zoom + 10))}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {/* Chart area with scroll */}
            <div className="overflow-auto p-8 min-h-[500px]" style={{ maxHeight: '70vh' }}>
                <div
                    className="inline-block min-w-full"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                >
                    {orgTree.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">Chưa có dữ liệu sơ đồ tổ chức</p>
                            <p className="text-sm">Thiết lập parent_id cho các đơn vị để hiển thị cây tổ chức</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-8">
                            {orgTree.map(node => (
                                <div key={node.id} className="flex flex-col items-center">
                                    {renderNodeBox(node)}

                                    {node.children.length > 0 && !collapsedNodes.has(node.id) && (
                                        <div className="flex flex-col items-center mt-6">
                                            {/* Vertical line down */}
                                            <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-600"></div>

                                            {/* Horizontal connector for multiple children */}
                                            {node.children.length > 1 && (
                                                <div className="flex items-start">
                                                    <div className="h-0.5 bg-slate-300 dark:bg-slate-600"
                                                        style={{ width: `${(node.children.length - 1) * 200 + 100}px` }}></div>
                                                </div>
                                            )}

                                            {/* Children row */}
                                            <div className="flex gap-4">
                                                {node.children.map(child => (
                                                    <div key={child.id} className="flex flex-col items-center">
                                                        <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-600"></div>
                                                        {renderNodeBox(child)}

                                                        {/* Grandchildren */}
                                                        {child.children.length > 0 && !collapsedNodes.has(child.id) && (
                                                            <div className="flex flex-col items-center mt-6">
                                                                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-600"></div>
                                                                {child.children.length > 1 && (
                                                                    <div className="h-0.5 bg-slate-300 dark:bg-slate-600"
                                                                        style={{ width: `${(child.children.length - 1) * 180 + 80}px` }}></div>
                                                                )}
                                                                <div className="flex gap-3">
                                                                    {child.children.map(grandchild => (
                                                                        <div key={grandchild.id} className="flex flex-col items-center">
                                                                            <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-600"></div>
                                                                            {renderNodeBox(grandchild)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizationChart;
