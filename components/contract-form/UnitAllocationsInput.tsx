import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Percent, User } from 'lucide-react';
import { Unit, Employee, UnitAllocation } from '../../types';

interface Props {
    units: Unit[];
    employees: Employee[];
    leadUnitId: string;           // Đơn vị thực hiện chính
    leadEmployeeId: string;       // Nhân viên chính
    allocations: UnitAllocation[];
    onChange: (allocations: UnitAllocation[]) => void;
}

/**
 * Component for managing unit allocations with percentage distribution
 * Per QĐ 09.2024 - Quy chế Phối hợp kinh doanh
 */
export default function UnitAllocationsInput({
    units,
    employees,
    leadUnitId,
    leadEmployeeId,
    allocations,
    onChange
}: Props) {
    // Calculate remaining percentage
    const leadPercent = allocations.find(a => a.role === 'lead')?.percent || 100;
    const supportTotalPercent = allocations
        .filter(a => a.role === 'support')
        .reduce((sum, a) => sum + a.percent, 0);
    const totalPercent = leadPercent + supportTotalPercent;
    const isValid = totalPercent === 100;

    // Initialize lead allocation if not exists
    useEffect(() => {
        if (leadUnitId && leadEmployeeId) {
            const existingLead = allocations.find(a => a.role === 'lead');
            if (!existingLead) {
                onChange([{
                    unitId: leadUnitId,
                    employeeId: leadEmployeeId,
                    percent: 100,
                    role: 'lead'
                }]);
            } else if (existingLead.unitId !== leadUnitId || existingLead.employeeId !== leadEmployeeId) {
                // Update lead if unit/employee changed
                onChange(allocations.map(a =>
                    a.role === 'lead'
                        ? { ...a, unitId: leadUnitId, employeeId: leadEmployeeId }
                        : a
                ));
            }
        }
    }, [leadUnitId, leadEmployeeId]);

    const handleLeadPercentChange = (newPercent: number) => {
        const clampedPercent = Math.max(0, Math.min(100, newPercent));
        onChange(allocations.map(a =>
            a.role === 'lead' ? { ...a, percent: clampedPercent } : a
        ));
    };

    const addSupportUnit = () => {
        // Find first unit not already used
        const usedUnitIds = allocations.map(a => a.unitId);
        const availableUnit = units.find(u => u.id !== 'all' && !usedUnitIds.includes(u.id));
        if (!availableUnit) return;

        onChange([...allocations, {
            unitId: availableUnit.id,
            employeeId: '',
            percent: 0,
            role: 'support'
        }]);
    };

    const removeSupportUnit = (unitId: string) => {
        onChange(allocations.filter(a => a.unitId !== unitId || a.role === 'lead'));
    };

    const updateSupportUnit = (index: number, field: keyof UnitAllocation, value: string | number) => {
        const newAllocations = [...allocations];
        const supportAllocations = newAllocations.filter(a => a.role === 'support');
        if (supportAllocations[index]) {
            (supportAllocations[index] as any)[field] = value;
            onChange(newAllocations);
        }
    };

    const getFilteredEmployees = (unitId: string) => {
        return employees.filter(e => e.unitId === unitId);
    };

    const getUnitName = (unitId: string) => {
        return units.find(u => u.id === unitId)?.name || 'Unknown';
    };

    const supportAllocations = allocations.filter(a => a.role === 'support');
    const canAddMore = supportAllocations.length < 2 && units.filter(u =>
        u.id !== 'all' && !allocations.some(a => a.unitId === u.id)
    ).length > 0;

    return (
        <div className="space-y-4">
            {/* Lead Unit - Always shown, % editable */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4 border-2 border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
                            <Users size={16} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Đơn vị thực hiện</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white">{getUnitName(leadUnitId)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={leadPercent}
                            onChange={(e) => handleLeadPercentChange(parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-center bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl text-sm font-bold text-indigo-700 dark:text-indigo-300"
                        />
                        <Percent size={14} className="text-indigo-500" />
                    </div>
                </div>
            </div>

            {/* Support Units */}
            {supportAllocations.map((allocation, index) => (
                <div
                    key={`support-${allocation.unitId}-${index}`}
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border-2 border-slate-200 dark:border-slate-700"
                >
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase flex items-center gap-1">
                            <Users size={12} /> Đơn vị phối hợp {index + 1}
                        </p>
                        <button
                            type="button"
                            onClick={() => removeSupportUnit(allocation.unitId)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Unit Select */}
                        <select
                            value={allocation.unitId}
                            onChange={(e) => {
                                const newAllocations = [...allocations];
                                const supportIndex = allocations.findIndex(a => a === allocation);
                                newAllocations[supportIndex] = { ...allocation, unitId: e.target.value, employeeId: '' };
                                onChange(newAllocations);
                            }}
                            className="px-3 py-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium"
                        >
                            {units.filter(u => u.id !== 'all' && (u.id === allocation.unitId || !allocations.some(a => a.unitId === u.id))).map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>

                        {/* Employee Select */}
                        <select
                            value={allocation.employeeId}
                            onChange={(e) => {
                                const newAllocations = [...allocations];
                                const supportIndex = allocations.findIndex(a => a === allocation);
                                newAllocations[supportIndex] = { ...allocation, employeeId: e.target.value };
                                onChange(newAllocations);
                            }}
                            className="px-3 py-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium"
                        >
                            <option value="">-- Chọn NV --</option>
                            {getFilteredEmployees(allocation.unitId).map(e => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>

                        {/* Percent Input */}
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={0}
                                max={100 - leadPercent - supportAllocations.filter(a => a !== allocation).reduce((s, a) => s + a.percent, 0)}
                                value={allocation.percent}
                                onChange={(e) => {
                                    const newAllocations = [...allocations];
                                    const supportIndex = allocations.findIndex(a => a === allocation);
                                    newAllocations[supportIndex] = { ...allocation, percent: parseInt(e.target.value) || 0 };
                                    onChange(newAllocations);
                                }}
                                className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-center"
                            />
                            <Percent size={14} className="text-slate-400" />
                        </div>
                    </div>
                </div>
            ))}

            {/* Add Button */}
            {canAddMore && (
                <button
                    type="button"
                    onClick={addSupportUnit}
                    className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:border-orange-400 hover:text-orange-500 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Thêm đơn vị phối hợp
                </button>
            )}

            {/* Validation Message */}
            {!isValid && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-xl">
                    <span>⚠️ Tổng phần trăm: {totalPercent}% (cần = 100%)</span>
                </div>
            )}
        </div>
    );
}
