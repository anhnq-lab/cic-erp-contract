-- Create RPC to fetch customers with their aggregated contract stats
-- Eliminates N+1 query problem in CustomerList

CREATE OR REPLACE FUNCTION get_customers_with_stats(
    p_search TEXT DEFAULT NULL,
    p_type TEXT DEFAULT NULL,
    p_industry TEXT DEFAULT NULL,
    p_limit INT DEFAULT NULL,
    p_offset INT DEFAULT NULL
)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    short_name TEXT,
    tax_code TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    type TEXT,
    industry TEXT,
    contact_person TEXT,
    bank_account TEXT,
    bank_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ,
    contract_count BIGINT,
    total_value NUMERIC,
    total_revenue NUMERIC,
    active_contracts_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH customer_stats AS (
        -- Aggregate stats from contracts table
        SELECT 
            c.customer_id,
            COUNT(c.id) as contract_count,
            COALESCE(SUM(c.value), 0) as total_value,
            COALESCE(SUM(c.actual_revenue), 0) as total_revenue,
            COUNT(CASE WHEN c.status = 'Active' THEN 1 END) as active_contracts_count
        FROM 
            contracts c
        GROUP BY 
            c.customer_id
    )
    SELECT 
        c.id,
        c.name,
        c.short_name,
        c.tax_code,
        c.address,
        c.phone,
        c.email,
        c.website,
        c.type,
        c.industry,
        c.contact_person,
        c.bank_account,
        c.bank_name,
        c.notes,
        c.created_at,
        
        -- Join stats or default to 0
        COALESCE(s.contract_count, 0) as contract_count,
        COALESCE(s.total_value, 0) as total_value,
        COALESCE(s.total_revenue, 0) as total_revenue,
        COALESCE(s.active_contracts_count, 0) as active_contracts_count
    FROM 
        customers c
    LEFT JOIN 
        customer_stats s ON c.id = s.customer_id
    WHERE 
        (p_search IS NULL OR 
         c.name ILIKE '%' || p_search || '%' OR 
         c.short_name ILIKE '%' || p_search || '%' OR 
         c.contact_person ILIKE '%' || p_search || '%')
        AND
        (p_type IS NULL OR 
         p_type = 'all' OR
         (p_type = 'Customer' AND c.type IN ('Customer', 'Both', 'Customer,Supplier')) OR
         (p_type = 'Supplier' AND c.type IN ('Supplier', 'Both', 'Customer,Supplier')) OR
         c.type = p_type)
        AND
        (p_industry IS NULL OR p_industry = 'all' OR c.industry = p_industry)
    ORDER BY 
        c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Also create a function to get total count for pagination with same filters
CREATE OR REPLACE FUNCTION get_customers_count(
    p_search TEXT DEFAULT NULL,
    p_type TEXT DEFAULT NULL,
    p_industry TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM customers c
    WHERE 
        (p_search IS NULL OR 
         c.name ILIKE '%' || p_search || '%' OR 
         c.short_name ILIKE '%' || p_search || '%' OR 
         c.contact_person ILIKE '%' || p_search || '%')
        AND
        (p_type IS NULL OR 
         p_type = 'all' OR
         (p_type = 'Customer' AND c.type IN ('Customer', 'Both', 'Customer,Supplier')) OR
         (p_type = 'Supplier' AND c.type IN ('Supplier', 'Both', 'Customer,Supplier')) OR
         c.type = p_type)
        AND
        (p_industry IS NULL OR p_industry = 'all' OR c.industry = p_industry);
        
    RETURN v_count;
END;
$$;
