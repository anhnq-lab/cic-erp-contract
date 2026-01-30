import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
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
        // Global safety timeout
        const safetyTimeout = setTimeout(() => {
            console.warn("Auth initialization timed out, forcing release...");
            setIsLoading(false);
        }, 5000);

        // Initialize session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                // If we have a user, fetch profile. Profile fetch has its own timeout logic effectively.
                // But we should ensure we don't clear the safety timeout prematurely if we are still fetching.
                fetchProfile(session.user.id, session.user.email);
            } else {
                setIsLoading(false);
            }
        }).catch((err) => {
            console.error("Session init error:", err);
            setIsLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                if (session.user.id !== user?.id) {
                    await fetchProfile(session.user.id, session.user.email);
                }
            } else {
                setProfile(null);
                setIsLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const fetchProfile = async (userId: string, email?: string) => {
        // Safety timeout to prevent infinite loading
        const timeoutId = setTimeout(() => setIsLoading(false), 5000);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            clearTimeout(timeoutId);

            if (error) {
                console.error("Error fetching profile:", error);
                // If profile missing, maybe try to create one or set default?
                // For now, leave null so UI knows it's an incomplete user
            } else {


                let userRole: UserRole = data.role as UserRole;
                const userEmail = email || data.email || '';

                setProfile({
                    id: data.id,
                    email: userEmail,
                    fullName: data.full_name,
                    role: userRole,
                    unitId: data.unit_id,
                    avatarUrl: data.avatar_url
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            clearTimeout(timeoutId);
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
        if (profile.role === 'Admin') return true;
        // God Mode for specific user
        if (user?.email === 'anhnq@cic.com.vn') return true;

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
        if (profile.role === 'Admin') return true;
        // God Mode
        if (user?.email === 'anhnq@cic.com.vn') return true;

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
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
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
