'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReceptionistLogin() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // Mock Auth specific to Receptionist
        if (userId === 'lorn1' && password === 'Dom341@#') {
            localStorage.setItem('userRole', 'Receptionist');
            localStorage.setItem('userName', 'Front Desk (Lorn1)');
            router.push('/dashboard/patients');
        } else {
            setError('Invalid credentials for Receptionist Portal. (Hint: lorn1)');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-workspace-bg)', color: 'var(--color-text-primary)' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--color-sidebar-bg)', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>MediScribe <span style={{ color: 'var(--color-accent-green)' }}>AI</span></div>
                        <h2 style={{ fontSize: '20px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>Reception & Intake</h2>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {error && (
                            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                {error}
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Staff ID / Username</label>
                            <input
                                autoFocus
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                style={{ width: '100%', padding: '12px 16px', background: 'var(--color-workspace-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--color-text-primary)', outline: 'none' }}
                                placeholder="Enter Receptionist ID"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '12px 16px', background: 'var(--color-workspace-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--color-text-primary)', outline: 'none' }}
                                placeholder="••••••••"
                            />
                        </div>

                        <button type="submit" style={{ width: '100%', padding: '14px', background: 'var(--color-accent-green)', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
                            Open Patient Queue
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                        Testing Credentials: ID: <b>lorn1</b> | Pass: <b>Dom341@#</b>
                    </div>
                </div>
            </div>
        </div>
    );
}
