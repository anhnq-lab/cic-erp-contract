import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PermissionService } from '../services';
import { PermissionAction, PermissionResource, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Query keys
const permissionKeys = {
    all: ['permissions'] as const,
    byUser: (userId: string) => ['permissions', 'user', userId] as const,
};

/**
 * Get permissions for a specific user
 */
export function useUserPermissions(userId: string) {
    return useQuery({
        queryKey: permissionKeys.byUser(userId),
        queryFn: () => PermissionService.getByUserId(userId),
        enabled: !!userId,
        staleTime: 10 * 60 * 1000, // 10 minutes - permissions don't change often
    });
}

/**
 * Get all permissions (admin view)
 */
export function useAllPermissions() {
    return useQuery({
        queryKey: permissionKeys.all,
        queryFn: () => PermissionService.getAll(),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Update permission mutation
 */
export function useUpdatePermission() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, resource, actions }: {
            userId: string;
            resource: PermissionResource;
            actions: PermissionAction[]
        }) => PermissionService.upsert(userId, resource, actions),
        onSuccess: (_, variables) => {
            // Invalidate both specific user and all permissions
            queryClient.invalidateQueries({ queryKey: permissionKeys.byUser(variables.userId) });
            queryClient.invalidateQueries({ queryKey: permissionKeys.all });
        },
    });
}

/**
 * Initialize permissions for new user
 */
export function useInitializePermissions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
            PermissionService.initializeForUser(userId, role),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.byUser(variables.userId) });
            queryClient.invalidateQueries({ queryKey: permissionKeys.all });
        },
    });
}

/**
 * Check if current user has specific permission
 * Returns cached default permissions based on role if no DB permissions exist
 */
export function useCheckPermission(resource: PermissionResource, action: PermissionAction) {
    const { profile } = useAuth();
    const userId = profile?.id || '';
    const role = profile?.role;

    const { data: permissions, isLoading } = useUserPermissions(userId);

    // Find permission for this resource
    const resourcePerm = permissions?.find(p => p.resource === resource);

    if (resourcePerm) {
        // Use DB permission
        return {
            hasPermission: resourcePerm.actions.includes(action),
            isLoading,
        };
    }

    // Fallback to default role permissions
    if (role) {
        const defaultPerms = PermissionService.getDefaultPermissions(role);
        const defaultActions = defaultPerms[resource] || [];
        return {
            hasPermission: defaultActions.includes(action),
            isLoading,
        };
    }

    return { hasPermission: false, isLoading };
}
