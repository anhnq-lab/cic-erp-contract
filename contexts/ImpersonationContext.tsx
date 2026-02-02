import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';

interface ImpersonationContextType {
    impersonatedUser: UserProfile | null;
    isImpersonating: boolean;
    startImpersonation: (user: UserProfile) => void;
    stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const ImpersonationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [impersonatedUser, setImpersonatedUser] = useState<UserProfile | null>(null);

    const startImpersonation = (user: UserProfile) => {
        setImpersonatedUser(user);
        console.log('[Impersonation] Started as:', user.fullName, user.role);
    };

    const stopImpersonation = () => {
        console.log('[Impersonation] Stopped');
        setImpersonatedUser(null);
    };

    return (
        <ImpersonationContext.Provider
            value={{
                impersonatedUser,
                isImpersonating: !!impersonatedUser,
                startImpersonation,
                stopImpersonation,
            }}
        >
            {children}
        </ImpersonationContext.Provider>
    );
};

export const useImpersonation = () => {
    const context = useContext(ImpersonationContext);
    if (!context) {
        throw new Error('useImpersonation must be used within ImpersonationProvider');
    }
    return context;
};

/**
 * Hook to get effective profile (impersonated or real)
 * Use this instead of useAuth().profile when checking permissions
 */
export const useEffectiveProfile = () => {
    // Import useAuth inline to avoid circular dependency
    const { useAuth } = require('./AuthContext');
    const { profile: realProfile } = useAuth();
    const { impersonatedUser, isImpersonating } = useImpersonation();

    return {
        profile: isImpersonating ? impersonatedUser : realProfile,
        realProfile,
        isImpersonating,
    };
};
