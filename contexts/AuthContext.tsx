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
    hasRole: (roles: UserRole[]) => boolean;
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
                // TEMPORARY: Override role for testing
                let userRole: UserRole = data.role as UserRole;
                const userEmail = email || data.email || '';

                if (userEmail === 'anhnq@cic.com.vn') {
                    userRole = 'Leadership';
                }

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
    const hasRole = (allowedRoles: UserRole[]) => {
        if (!profile) return false;
        // Leadership has all access essentially, but specific checks might apply
        if (profile.role === 'Leadership') return true;
        return allowedRoles.includes(profile.role);
    };

    const value = {
        session,
        user,
        profile,
        isLoading,
        signOut,
        hasRole
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
