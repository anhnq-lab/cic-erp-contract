-- Add payment_type column to payments table
ALTER TABLE payments 
ADD COLUMN payment_type text DEFAULT 'Revenue';

-- Add check constraint to ensure valid values
ALTER TABLE payments
ADD CONSTRAINT check_payment_type CHECK (payment_type IN ('Revenue', 'Expense'));

-- Update comment
COMMENT ON COLUMN payments.payment_type IS 'Loại thanh toán: Revenue (Thu từ khách hàng) hoặc Expense (Chi cho nhà cung cấp)';
