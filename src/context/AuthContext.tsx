'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

type AuthContextType = {
    user: User | null;
    role: string | null;
    userName: string | null;
    loading: boolean;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                // Fetch user role and name from Firestore
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                try {
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setRole(data.role || 'Receptionist');
                        setUserName(data.name || firebaseUser.displayName || 'Staff Member');
                        setRole(data.role || 'Receptionist');
                        setUserName(data.name || firebaseUser.displayName || 'Staff Member');
                    } else {
                        // Default profile if not found
                        const defaultRole = 'Receptionist';
                        const defaultName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Staff Member';
                        await setDoc(userDocRef, {
                            role: defaultRole,
                            name: defaultName,
                            email: firebaseUser.email,
                            createdAt: new Date().toISOString()
                        });
                        setRole(defaultRole);
                        setUserName(defaultName);
                    }
                } catch (e) {
                    console.error("Error loading user profile", e);
                }
            } else {
                setRole(null);
                setUserName(null);
                // Clear localStorage on logout if needed (optional)
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, role, userName, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
