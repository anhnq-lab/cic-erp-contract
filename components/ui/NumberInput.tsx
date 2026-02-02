import React from 'react';
import { formatNumber, parseFormattedNumber } from '../../lib/utils';

interface NumberInputProps {
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    className?: string;
    min?: number;
    max?: number;
    disabled?: boolean;
    id?: string;
    name?: string;
    required?: boolean;
    suffix?: string;
    showFormattedHint?: boolean;
}

/**
 * Input component cho số với định dạng dấu chấm phân tách hàng nghìn
 * Hiển thị: 1.000.000
 * Lưu trữ: 1000000
 */
const NumberInput: React.FC<NumberInputProps> = ({
    value,
    onChange,
    placeholder = '0',
    className = '',
    min,
    max,
    disabled = false,
    id,
    name,
    required = false,
    suffix,
    showFormattedHint = false,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Cho phép nhập số và dấu chấm
        // Loại bỏ tất cả ký tự không phải số
        const numericValue = parseFormattedNumber(inputValue);

        // Validate min/max
        if (min !== undefined && numericValue < min) return;
        if (max !== undefined && numericValue > max) return;

        onChange(numericValue);
    };

    const displayValue = value ? formatNumber(value) : '';

    return (
        <div className="relative">
            <input
                type="text"
                inputMode="numeric"
                id={id}
                name={name}
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={`${className}`}
            />
            {suffix && displayValue && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                    {suffix}
                </span>
            )}
            {showFormattedHint && value > 0 && (
                <p className="text-xs text-slate-400 mt-1">{formatNumber(value)} VNĐ</p>
            )}
        </div>
    );
};

export default NumberInput;
