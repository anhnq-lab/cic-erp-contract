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
    UNIT_SUBFOLDERS,
    GLOBAL_FOLDERS,
    DriveFile,
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
    const { data, error } = await supabase
        .from('drive_folder_mappings')
        .upsert(
            {
                entity_type: mapping.entityType,
                entity_id: mapping.entityId || null,
                folder_type: mapping.folderType || null,
                drive_folder_id: mapping.driveFolderId,
                drive_folder_url: mapping.driveFolderUrl || GoogleDriveService.getFolderUrl(mapping.driveFolderId),
                drive_folder_name: mapping.driveFolderName || null,
                parent_mapping_id: mapping.parentMappingId || null,
                created_by: mapping.createdBy || null,
            },
            { onConflict: 'drive_folder_id' }
        )
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
    }
    if (folderType) {
        query = query.eq('folder_type', folderType);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
        console.error('[DriveInit] Error getting mapping:', error);
        return null;
    }
    return data;
}

// ============================================
// Initialization Functions
// ============================================

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
        const total = 1 + (units.length * (UNIT_SUBFOLDERS.length + 1)) + GLOBAL_FOLDERS.length + (units.length * UNIT_SUBFOLDERS.length); // year folders
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

                // 3. Create subfolders for each unit
                for (const subName of UNIT_SUBFOLDERS) {
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

        return {
            folderId: folder.id,
            folderUrl: GoogleDriveService.getFolderUrl(folder.id),
        };
    },

    /**
     * Create a PAKD folder for a contract.
     * Path: CIC-Document/{UnitPrefix}/PAKD/{Year}/PAKD-{ContractID}_{CustomerName}
     */
    async createPAKDFolder(
        contractId: string,
        unitId: string,
        customerName: string,
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

        const pathSegments = GoogleDriveService.buildPAKDFolderPath(unitId, contractId, customerName, year);
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
