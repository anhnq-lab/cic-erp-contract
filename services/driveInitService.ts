/**
 * Drive Initialization Service — CIC ERP
 * 
 * Handles:
 * 1. Initializing the full CIC-Document folder structure on Google Drive
 * 2. Creating per-contract folders automatically
 * 3. Storing folder mappings in Supabase for quick lookup
 */

import { supabase } from '../lib/supabase';
import {
    GoogleDriveService,
    ROOT_FOLDER_NAME,
    UNIT_FOLDER_MAP,
    BUSINESS_UNIT_SUBFOLDERS,
    GLOBAL_FOLDERS,
    DriveFile,
    getUnitSubfolders,
    ADMIN_UNIT_SUBFOLDERS
} from './googleDriveService';

// ============================================
// Types
// ============================================

export interface FolderMappingRow {
    id: string;
    entity_type: string;
    entity_id: string | null;
    folder_type: string | null;
    drive_folder_id: string;
    drive_folder_url: string | null;
    drive_folder_name: string | null;
    parent_mapping_id: string | null;
    created_by: string | null;
    created_at: string;
}

export interface InitProgress {
    total: number;
    current: number;
    currentItem: string;
    status: 'idle' | 'running' | 'done' | 'error';
    error?: string;
}

// ============================================
// DB Operations
// ============================================

async function saveFolderMapping(mapping: {
    entityType: string;
    entityId?: string;
    folderType?: string;
    driveFolderId: string;
    driveFolderUrl?: string;
    driveFolderName?: string;
    parentMappingId?: string;
    createdBy?: string;
}): Promise<FolderMappingRow> {
    // First try to find existing mapping by entity composite key
    const existing = await getFolderMapping(mapping.entityType, mapping.entityId, mapping.folderType);

    if (existing) {
        // Update existing mapping with new drive folder ID
        const { data, error } = await supabase
            .from('drive_folder_mappings')
            .update({
                drive_folder_id: mapping.driveFolderId,
                drive_folder_url: mapping.driveFolderUrl || GoogleDriveService.getFolderUrl(mapping.driveFolderId),
                drive_folder_name: mapping.driveFolderName || null,
                parent_mapping_id: mapping.parentMappingId || null,
            })
            .eq('id', existing.id)
            .select()
            .single();
        if (error) {
            console.error('[DriveInit] Error updating mapping:', error);
            throw error;
        }
        return data;
    }

    // Insert new mapping
    const { data, error } = await supabase
        .from('drive_folder_mappings')
        .insert({
            entity_type: mapping.entityType,
            entity_id: mapping.entityId || null,
            folder_type: mapping.folderType || null,
            drive_folder_id: mapping.driveFolderId,
            drive_folder_url: mapping.driveFolderUrl || GoogleDriveService.getFolderUrl(mapping.driveFolderId),
            drive_folder_name: mapping.driveFolderName || null,
            parent_mapping_id: mapping.parentMappingId || null,
            created_by: mapping.createdBy || null,
        })
        .select()
        .single();

    if (error) {
        console.error('[DriveInit] Error saving mapping:', error);
        throw error;
    }
    return data;
}

async function getFolderMapping(
    entityType: string,
    entityId?: string,
    folderType?: string
): Promise<FolderMappingRow | null> {
    let query = supabase
        .from('drive_folder_mappings')
        .select('*')
        .eq('entity_type', entityType);

    if (entityId) {
        query = query.eq('entity_id', entityId);
    } else {
        query = query.is('entity_id', null);
    }
    if (folderType) {
        query = query.eq('folder_type', folderType);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1);
    if (error) {
        console.error('[DriveInit] Error getting mapping:', error);
        return null;
    }
    return data && data.length > 0 ? data[0] : null;
}

// ============================================
// Initialization Functions
// ============================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const DriveInitService = {
    /**
     * Initialize the entire CIC-Document folder structure.
     * Creates: root → unit folders → subfolders (PAKD, HopDong, HoaDon, BaoCao, Templates)
     *          root → global folders (_KhachHang, _NhanSu, etc.)
     * 
     * @param onProgress callback for progress updates
     * @param userId current user ID for audit
     */
    async initializeFullStructure(
        onProgress?: (progress: InitProgress) => void,
        userId?: string
    ): Promise<{ rootFolderId: string; totalCreated: number }> {
        const units = Object.entries(UNIT_FOLDER_MAP);
        // root + (units * subfolders) + global folders + year folders
        const currentYear = new Date().getFullYear();

        // Calculate total items to track progress
        let total = 1 + units.length + GLOBAL_FOLDERS.length; // root + unit folders + global folders

        // Add subfolders and year folders for each unit
        for (const [unitId] of units) {
            const subfolders = getUnitSubfolders(unitId);
            total += subfolders.length; // subfolders
            total += subfolders.length; // year folders inside subfolders
        }

        let current = 0;
        let totalCreated = 0;

        const reportProgress = (item: string) => {
            current++;
            onProgress?.({
                total,
                current,
                currentItem: item,
                status: 'running',
            });
        };

        try {
            // 1. Create root folder: CIC-Document
            reportProgress(`Tạo thư mục gốc: ${ROOT_FOLDER_NAME}`);
            const rootFolder = await GoogleDriveService.getOrCreateFolder(ROOT_FOLDER_NAME);
            const rootMapping = await saveFolderMapping({
                entityType: 'root',
                driveFolderId: rootFolder.id,
                driveFolderName: ROOT_FOLDER_NAME,
                createdBy: userId,
            });
            totalCreated++;
            await delay(800); // Rate limit delay

            // 2. Create unit folders
            for (const [unitId, unitPrefix] of units) {
                reportProgress(`Tạo thư mục đơn vị: ${unitPrefix}`);
                const unitFolder = await GoogleDriveService.getOrCreateFolder(unitPrefix, rootFolder.id);
                const unitMapping = await saveFolderMapping({
                    entityType: 'unit',
                    entityId: unitId,
                    driveFolderId: unitFolder.id,
                    driveFolderName: unitPrefix,
                    parentMappingId: rootMapping.id,
                    createdBy: userId,
                });
                totalCreated++;
                await delay(800); // Rate limit delay

                // 3. Create subfolders for each unit
                const subfolders = getUnitSubfolders(unitId);
                for (const subName of subfolders) {
                    reportProgress(`${unitPrefix}/${subName}`);
                    const subFolder = await GoogleDriveService.getOrCreateFolder(subName, unitFolder.id);
                    const subMapping = await saveFolderMapping({
                        entityType: 'doctype',
                        entityId: unitId,
                        folderType: subName,
                        driveFolderId: subFolder.id,
                        driveFolderName: subName,
                        parentMappingId: unitMapping.id,
                        createdBy: userId,
                    });
                    totalCreated++;
                    await delay(800); // Rate limit delay

                    // 4. Create year folder inside each subfolder
                    reportProgress(`${unitPrefix}/${subName}/${currentYear}`);
                    const yearFolder = await GoogleDriveService.getOrCreateFolder(String(currentYear), subFolder.id);
                    await saveFolderMapping({
                        entityType: 'year',
                        entityId: unitId,
                        folderType: `${subName}_${currentYear}`,
                        driveFolderId: yearFolder.id,
                        driveFolderName: String(currentYear),
                        parentMappingId: subMapping.id,
                        createdBy: userId,
                    });
                    totalCreated++;
                    await delay(800); // Rate limit delay
                }
            }

            // 5. Create global folders
            for (const globalName of GLOBAL_FOLDERS) {
                reportProgress(`Tạo thư mục chung: ${globalName}`);
                const globalFolder = await GoogleDriveService.getOrCreateFolder(globalName, rootFolder.id);
                await saveFolderMapping({
                    entityType: 'root',
                    entityId: globalName,
                    driveFolderId: globalFolder.id,
                    driveFolderName: globalName,
                    parentMappingId: rootMapping.id,
                    createdBy: userId,
                });
                totalCreated++;
                await delay(800); // Rate limit delay
            }

            onProgress?.({
                total,
                current: total,
                currentItem: 'Hoàn thành!',
                status: 'done',
            });

            return { rootFolderId: rootFolder.id, totalCreated };
        } catch (error: any) {
            onProgress?.({
                total,
                current,
                currentItem: error.message,
                status: 'error',
                error: error.message,
            });
            throw error;
        }
    },

    /**
     * Create a folder for a specific contract.
     * Path: CIC-Document/{UnitPrefix}/HopDong/{Year}/{ContractID}_{ProjectName}
     * 
     * Returns the Drive folder ID for the contract.
     */
    async createContractFolder(
        contractId: string,
        unitId: string,
        projectName: string,
        year?: number,
        userId?: string
    ): Promise<{ folderId: string; folderUrl: string }> {
        // Check if already exists
        const existing = await getFolderMapping('contract', contractId);
        if (existing) {
            return {
                folderId: existing.drive_folder_id,
                folderUrl: existing.drive_folder_url || GoogleDriveService.getFolderUrl(existing.drive_folder_id),
            };
        }

        // Build and create path
        const pathSegments = GoogleDriveService.buildContractFolderPath(unitId, contractId, projectName, year);
        const folder = await GoogleDriveService.getOrCreatePath(pathSegments);

        // Save mapping
        await saveFolderMapping({
            entityType: 'contract',
            entityId: contractId,
            folderType: 'HopDong',
            driveFolderId: folder.id,
            driveFolderName: pathSegments[pathSegments.length - 1],
            createdBy: userId,
        });

        // All files (PAKD, HoaDon, etc.) go directly into the contract folder
        // No subfolders needed

        return {
            folderId: folder.id,
            folderUrl: GoogleDriveService.getFolderUrl(folder.id),
        };
    },

    /**
     * Create a PAKD folder for a contract (Nested).
     * Path: .../HopDong/{Year}/{Contract}/PAKD
     */
    async createPAKDFolder(
        contractId: string,
        unitId: string,
        contractName: string,
        year?: number,
        userId?: string
    ): Promise<{ folderId: string; folderUrl: string }> {
        const existing = await getFolderMapping('contract', contractId, 'PAKD');
        if (existing) {
            return {
                folderId: existing.drive_folder_id,
                folderUrl: existing.drive_folder_url || GoogleDriveService.getFolderUrl(existing.drive_folder_id),
            };
        }

        // Get contract folder first to ensure parent exists (or build full path)
        const pathSegments = GoogleDriveService.buildPAKDFolderPath(unitId, contractId, contractName, year);
        const folder = await GoogleDriveService.getOrCreatePath(pathSegments);

        await saveFolderMapping({
            entityType: 'contract',
            entityId: contractId,
            folderType: 'PAKD',
            driveFolderId: folder.id,
            driveFolderName: pathSegments[pathSegments.length - 1],
            createdBy: userId,
        });

        return {
            folderId: folder.id,
            folderUrl: GoogleDriveService.getFolderUrl(folder.id),
        };
    },

    /**
     * Create an Invoice (HoaDon) folder for a contract (Nested).
     * Path: .../HopDong/{Year}/{Contract}/HoaDon
     */
    async createInvoiceFolder(
        contractId: string,
        unitId: string,
        contractName: string,
        year?: number,
        userId?: string
    ): Promise<{ folderId: string; folderUrl: string }> {
        const existing = await getFolderMapping('contract', contractId, 'HoaDon');
        if (existing) {
            return {
                folderId: existing.drive_folder_id,
                folderUrl: existing.drive_folder_url || GoogleDriveService.getFolderUrl(existing.drive_folder_id),
            };
        }

        const pathSegments = GoogleDriveService.buildInvoiceFolderPath(unitId, contractId, contractName, year);
        const folder = await GoogleDriveService.getOrCreatePath(pathSegments);

        await saveFolderMapping({
            entityType: 'contract',
            entityId: contractId,
            folderType: 'HoaDon',
            driveFolderId: folder.id,
            driveFolderName: pathSegments[pathSegments.length - 1],
            createdBy: userId,
        });

        return {
            folderId: folder.id,
            folderUrl: GoogleDriveService.getFolderUrl(folder.id),
        };
    },

    // ============================================
    // Lookup Functions
    // ============================================

    /** Get the Drive folder ID for an entity */
    async getContractFolderId(contractId: string): Promise<string | null> {
        const mapping = await getFolderMapping('contract', contractId, 'HopDong');
        return mapping?.drive_folder_id || null;
    },

    /** Get the Drive folder ID for a unit's doctype */
    async getUnitDoctypeFolderId(unitId: string, folderType: string): Promise<string | null> {
        const mapping = await getFolderMapping('doctype', unitId, folderType);
        return mapping?.drive_folder_id || null;
    },

    /** Get the root folder ID */
    async getRootFolderId(): Promise<string | null> {
        const mapping = await getFolderMapping('root');
        return mapping?.drive_folder_id || null;
    },

    /** Get all folder mappings for display */
    async getAllMappings(): Promise<FolderMappingRow[]> {
        const { data, error } = await supabase
            .from('drive_folder_mappings')
            .select('*')
            .order('entity_type')
            .order('entity_id')
            .order('folder_type');

        if (error) throw error;
        return data || [];
    },

    /** Check if the folder structure has been initialized */
    async isInitialized(): Promise<boolean> {
        const root = await getFolderMapping('root');
        return !!root;
    },

    /** Clear all folder mappings (for re-initialization) */
    async clearMappings(): Promise<void> {
        const { error } = await supabase
            .from('drive_folder_mappings')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        if (error) throw error;
    },
};

export default DriveInitService;
