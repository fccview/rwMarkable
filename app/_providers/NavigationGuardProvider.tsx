"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface NavigationGuardContextType {
    hasUnsavedChanges: boolean;
    setHasUnsavedChanges: (hasChanges: boolean) => void;
    registerNavigationGuard: (guard: () => boolean) => void;
    unregisterNavigationGuard: () => void;
    checkNavigation: (action: () => void) => void;
    setPendingNavigation: (action: () => void) => void;
    executePendingNavigation: () => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType | undefined>(undefined);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [navigationGuard, setNavigationGuard] = useState<(() => boolean) | null>(null);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

    const registerNavigationGuard = useCallback((guard: () => boolean) => {
        setNavigationGuard(() => guard);
    }, []);

    const unregisterNavigationGuard = useCallback(() => {
        setNavigationGuard(null);
    }, []);

    const checkNavigation = useCallback((action: () => void) => {
        if (navigationGuard && !navigationGuard()) {
            setPendingNavigation(() => action);
            return;
        }
        action();
    }, [navigationGuard]);

    const executePendingNavigation = useCallback(() => {
        if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
        }
    }, [pendingNavigation]);

    return (
        <NavigationGuardContext.Provider
            value={{
                hasUnsavedChanges,
                setHasUnsavedChanges,
                registerNavigationGuard,
                unregisterNavigationGuard,
                checkNavigation,
                setPendingNavigation,
                executePendingNavigation,
            }}
        >
            {children}
        </NavigationGuardContext.Provider>
    );
}

export function useNavigationGuard() {
    const context = useContext(NavigationGuardContext);
    if (context === undefined) {
        throw new Error("useNavigationGuard must be used within a NavigationGuardProvider");
    }
    return context;
}
