import { dataClient as supabase } from '../lib/dataClient';

// Helper to sanitize filename for S3 storage
const sanitizeFileName = (fileName: string): string => {
    // 1. Separate extension
    const parts = fileName.split('.');
    const ext = parts.length > 1 ? parts.pop() : '';
    const name = parts.join('.');

    // 2. Transliterate Vietnamese & Remove special chars
    const safeName = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9_-]/g, '_'); // Replace non-alphanumeric with underscore

    // 3. Truncate to avoid "Invalid Key" (max 100 chars, safe limit)
    const truncatedName = safeName.slice(0, 100);

    return ext ? `${truncatedName}.${ext}` : truncatedName;
};

export const DocumentService = {
    getByContractId: async (contractId: string) => {
        const { data, error } = await supabase.from('contract_documents').select('*').eq('contract_id', contractId);
        if (error) throw error;
        return data.map((d: any) => ({
            id: d.id,
            contractId: d.contract_id,
            name: d.name,
            url: d.url,
            filePath: d.file_path,
            type: d.type,
            size: d.size,
            uploadedAt: d.uploaded_at
        }));
    },

    upload: async (contractId: string, file: File) => {
        // 1. Upload to Storage
        const safeName = sanitizeFileName(file.name);
        // Ensure unique path with timestamp
        const filePath = `${contractId}/${Date.now()}_${safeName}`;
        const { error: storageError } = await supabase.storage
            .from('contract_docs')
            .upload(filePath, file);

        if (storageError) throw storageError;

        // 2. Insert into DB
        const { data: dbData, error: dbError } = await supabase.from('contract_documents').insert({
            contract_id: contractId,
            name: file.name,
            file_path: filePath,
            url: filePath,
            type: file.type,
            size: file.size
        }).select().single();

        if (dbError) throw dbError;

        return {
            id: dbData.id,
            contractId: dbData.contract_id,
            name: dbData.name,
            url: dbData.url,
            filePath: dbData.file_path,
            type: dbData.type,
            size: dbData.size,
            uploadedAt: dbData.uploaded_at
        };
    },

    delete: async (id: string, filePath: string) => {
        // 1. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from('contract_docs')
            .remove([filePath]);

        if (storageError) console.error("Storage delete error", storageError);

        // 2. Delete from DB
        const { error: dbError } = await supabase.from('contract_documents').delete().eq('id', id);
        if (dbError) throw dbError;
        return true;
    },

    download: async (filePath: string) => {
        const { data, error } = await supabase.storage.from('contract_docs').download(filePath);
        if (error) throw error;
        return data;
    }
};
