const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Supabase config
const supabaseUrl = 'https://jyohocjsnsyfgfsmjfqx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5b2hvY2pzbnN5Zmdmc21qZnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1MzQ3MzgsImV4cCI6MjA1MzExMDczOH0.geU7wqhNwO3eBmf_QLnLxoS5bGBxJRqotXw6qz5l6dA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Unit mapping
const UNIT_MAP = {
    'hđqt': 'hdqt',
    'hdqt': 'hdqt',
    'bgđ': 'bgd',
    'bgd': 'bgd',
    'hcm': 'hcm',
    'bim': 'bim',
    'css': 'css',
    'dcs': 'dcs',
    'pmxd': 'pmxd',
    'stc': 'stc',
    'tvda': 'tvda',
    'tvtk': 'tvtk',
    'hcns': 'hcns',
    'tckt': 'tckt',
    'th': 'hcns',
};

function normalizeUnit(unit) {
    if (!unit) return null;
    const normalized = String(unit).toLowerCase().trim();
    return UNIT_MAP[normalized] || null;
}

function parseDate(dateValue) {
    if (!dateValue) return null;

    // Handle Excel serial date
    if (typeof dateValue === 'number') {
        const date = new Date((dateValue - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
    }

    const str = String(dateValue).trim();

    // DD/MM/YYYY or DD.MM.YYYY
    const match = str.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})$/);
    if (match) {
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // MM/YYYY
    const match2 = str.match(/^(\d{1,2})[\/\.\-](\d{4})$/);
    if (match2) {
        const [, month, year] = match2;
        return `${year}-${month.padStart(2, '0')}-01`;
    }

    return null;
}

async function importEmployees() {
    console.log('Reading Excel file...');
    const wb = XLSX.readFile('d:/QuocAnh/cic-erp-contract/employeeImportTemplate.xlsx');
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    console.log(`Found ${data.length - 1} rows`);

    let success = 0;
    let failed = 0;

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0] || !row[1] || !row[2]) continue; // Skip empty rows

        const employee = {
            employee_code: String(row[0] || '').trim(),
            name: String(row[1] || '').trim(),
            email: String(row[2] || '').trim().toLowerCase(),
            phone: row[3] ? String(row[3]).trim() : null,
            telegram: row[4] ? String(row[4]).trim() : null,
            unit_id: normalizeUnit(row[5]),
            position: row[6] ? String(row[6]).trim() : null,
            role_code: null, // Set later
            date_of_birth: parseDate(row[8]),
            gender: row[9] ? String(row[9]).trim() : null,
            id_number: row[10] ? String(row[10]).trim() : null,
            address: row[11] ? String(row[11]).trim() : null,
            education: row[12] ? String(row[12]).trim() : null,
            specialization: row[13] ? String(row[13]).trim() : null,
            certificates: row[14] ? String(row[14]).trim() : null,
            date_joined: parseDate(row[15]),
            contract_type: row[16] ? String(row[16]).trim() : null,
            bank_account: row[17] ? String(row[17]).toString() : null,
            bank_name: row[18] ? String(row[18]).trim() : null,
        };

        if (i <= 3) {
            console.log(`Row ${i + 1}:`, {
                name: employee.name,
                unit_id: employee.unit_id,
                date_of_birth: employee.date_of_birth,
            });
        }

        const { error } = await supabase.from('employees').insert(employee);

        if (error) {
            console.error(`Failed row ${i + 1}:`, employee.name, error.message);
            failed++;
        } else {
            success++;
        }
    }

    console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
}

importEmployees().catch(console.error);
