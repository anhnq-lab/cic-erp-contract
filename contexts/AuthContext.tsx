import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase'; // Auth operations only
import { dataClient } from '../lib/dataClient'; // Data operations
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    signOut: () => Promise<void>;

    // Permission helpers
    hasRole: (role: UserRole | UserRole[]) => boolean;
    canEdit: (resource: 'contract' | 'pakd', resourceUnitId?: string, status?: string) => boolean;
    canApprove: (resource: 'pakd', curStatus: string) => boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        console.log('[AuthContext] Starting auth initialization...');

        // Global safety timeout - shorter for faster fallback
        const safetyTimeout = setTimeout(() => {
            console.warn("[AuthContext] Safety timeout triggered - forcing release...");
            if (isMounted) setIsLoading(false);
        }, 5000); // Reduced to 5s

        // Initialize session
        console.log('[AuthContext] Calling getSession...');
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('[AuthContext] getSession result:', { hasSession: !!session, userId: session?.user?.id });
            if (!isMounted) return;

            setSession(session);
            setUser(session?.user ?? null);

            // Persist Google provider_token for Google Sheets API access
            if (session?.provider_token) {
                sessionStorage.setItem('google_provider_token', session.provider_token);
                console.log('[AuthContext] Google provider_token saved (getSession)');
            }

            if (session?.user) {
                console.log('[AuthContext] User found, fetching profile...');
                fetchProfile(session.user.id, session.user.email);
            } else {
                console.log('[AuthContext] No session, setting loading false');
                clearTimeout(safetyTimeout);
                setIsLoading(false);
            }
        }).catch((err) => {
            console.error("[AuthContext] Session init error:", err);
            if (isMounted) {
                clearTimeout(safetyTimeout);
                setIsLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('[AuthContext] Auth state changed:', _event, { hasSession: !!session });
            if (!isMounted) return;

            setSession(session);
            setUser(session?.user ?? null);

            // Persist Google provider_token for Google Sheets API access
            if (session?.provider_token) {
                sessionStorage.setItem('google_provider_token', session.provider_token);
                console.log('[AuthContext] Google provider_token saved to sessionStorage');
            }

            if (session?.user) {
                await fetchProfile(session.user.id, session.user.email);
            } else {
                setProfile(null);
                sessionStorage.removeItem('google_provider_token');
                setIsLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const fetchProfile = async (userId: string, email?: string) => {
        console.log('[AuthContext.fetchProfile] Starting for userId:', userId);
        // Safety timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            console.warn('[AuthContext.fetchProfile] Timeout - forcing loading false');
            setIsLoading(false);
        }, 3000); // Reduced to 3s

        try {
            console.log('[AuthContext.fetchProfile] Querying profiles table...');
            // Use dataClient for data operations (isolated from auth state)
            const { data: profiles, error } = await dataClient
                .from('profiles')
                .select('*')
                .eq('id', userId);

            console.log('[AuthContext.fetchProfile] Result:', { profiles, error });
            clearTimeout(timeoutId);

            if (error) {
                console.error("[AuthContext.fetchProfile] Error fetching profile:", error);
                // If profile missing, maybe try to create one or set default?
                // For now, leave null so UI knows it's an incomplete user
            } else if (profiles && profiles.length > 0) {
                const data = profiles[0];
                console.log('[AuthContext.fetchProfile] Raw data:', JSON.stringify(data));
                console.log('[AuthContext.fetchProfile] data.role:', data.role, 'typeof:', typeof data.role);

                let userRole: UserRole = data.role as UserRole;
                const userEmail = email || data.email || '';

                setProfile({
                    id: data.id,
                    email: userEmail,
                    fullName: data.full_name,
                    role: userRole,
                    unitId: data.unit_id,
                    avatarUrl: data.avatar_url,
                    employeeId: data.employee_id
                });
                console.log('[AuthContext.fetchProfile] Profile set successfully');
            }
        } catch (e) {
            console.error('[AuthContext.fetchProfile] Exception:', e);
        } finally {
            clearTimeout(timeoutId);
            console.log('[AuthContext.fetchProfile] Setting loading to false');
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
    };

    // Helper to check permissions
    const hasRole = (role: UserRole | UserRole[]) => {
        if (!profile) return false;
        const roles = Array.isArray(role) ? role : [role];
        return roles.includes(profile.role);
    };

    const canEdit = (resource: 'contract' | 'pakd', resourceUnitId?: string, status?: string) => {
        if (!profile) return false;
        // Admin role (from database) has full access
        if (profile.role === 'Admin' || profile.role === 'Leadership') return true;

        // If no status is passed, assume editable unless specific restrictions apply based on role/unit
        if (!status) return true;

        // Most resources are editable only in Draft or early stages
        // Contracts typically editable until signed/active, but here we simplify
        if (['Draft', 'New', 'Pending'].includes(status)) {
            // If resourceUnitId provided, check if user belongs to that unit or is global
            if (resourceUnitId && profile.unitId) {
                if (profile.unitId === 'all') return true;
                if (resourceUnitId !== profile.unitId) return false;
            }
            return true;
        }

        // Once approved/active, editing is restricted
        return false;
    };

    const canApprove = (resource: 'pakd', curStatus: string) => {
        if (!profile) return false;
        // Admin/Leadership role (from database) has full access
        if (profile.role === 'Admin' || profile.role === 'Leadership') return true;

        switch (curStatus) {
            case 'Pending_Unit':
                return profile.role === 'UnitLeader' || profile.role === 'Leadership' || profile.role === 'AdminUnit';
            case 'Pending_Finance':
                return profile.role === 'Accountant' || profile.role === 'ChiefAccountant' || profile.role === 'Leadership';
            case 'Pending_Board':
                return profile.role === 'Leadership';
            default:
                return false;
        }
    };

    const refreshProfile = async () => {
        if (!user) return;
        // Use dataClient for data operations
        const { data: profiles } = await dataClient.from('profiles').select('*').eq('id', user.id);
        if (profiles && profiles.length > 0) {
            setProfile({
                id: profiles[0].id,
                email: profiles[0].email || user.email || '',
                fullName: profiles[0].full_name,
                role: profiles[0].role as UserRole,
                unitId: profiles[0].unit_id,
                avatarUrl: profiles[0].avatar_url,
                employeeId: profiles[0].employee_id
            });
        }
    };


    const value = {
        session,
        user,
        profile,
        isLoading,
        signOut,
        hasRole,
        canEdit,
        canApprove,
        refreshProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Get Google OAuth access token from sessionStorage.
 * Available after user signs in with Google (with spreadsheets scope).
 * Used to fetch private Google Sheets without requiring public sharing.
 */
export function getGoogleAccessToken(): string | null {
    return sessionStorage.getItem('google_provider_token');
}
