import { dataClient as supabase } from '../lib/dataClient';

export interface ExecutionCostType {
    id: string;
    name: string;
    created_at: string;
}

export const ExecutionCostService = {
    /**
     * Get all execution cost types sorted by name
     */
    getAll: async (): Promise<ExecutionCostType[]> => {
        const { data, error } = await supabase
            .from('execution_cost_types')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Find a cost type by name or create a new one
     */
    findOrCreate: async (name: string): Promise<ExecutionCostType | null> => {
        if (!name || name.trim() === '') return null;

        const trimmedName = name.trim();

        // Try to get existing
        const { data: existing, error: fetchError } = await supabase
            .from('execution_cost_types')
            .select('*')
            .ilike('name', trimmedName)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (existing) return existing;

        // Create new
        const { data: created, error: insertError } = await supabase
            .from('execution_cost_types')
            .insert({ name: trimmedName })
            .select()
            .single();

        if (insertError) throw insertError;
        return created;
    },

    /**
     * Bulk add many names (used during PAKD import)
     * Ignores duplicates automatically via DB unique constraint
     */
    bulkAdd: async (names: string[]): Promise<void> => {
        const uniqueNames = [...new Set(names.filter(n => n && n.trim() !== '').map(n => n.trim()))];
        if (uniqueNames.length === 0) return;

        const payload = uniqueNames.map(name => ({ name }));

        const { error } = await supabase
            .from('execution_cost_types')
            .upsert(payload, { onConflict: 'name' });

        if (error) {
            console.error('[ExecutionCostService] bulkAdd error:', error);
            // We don't throw here to avoid blocking the main import flow
        }
    }
};
