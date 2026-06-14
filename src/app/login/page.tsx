'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import styles from './Login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [selectedRole, setSelectedRole] = useState('Doctor');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const portals = [
        { id: 'receptionist', title: 'Reception & Intake', icon: '📝', path: '/login/receptionist', desc: 'Patient registration and queue management.', color: '#3b82f6' },
        { id: 'doctor', title: 'Doctor Portal', icon: '🩺', path: '/login/doctor', desc: 'Live AI Scribe and EMR review workspace.', color: '#10b981' },
        { id: 'pharmacist', title: 'Pharmacy Dispatch', icon: '💊', path: '/login/pharmacist', desc: 'Secure prescription and patient handover.', color: '#f59e0b' },
        { id: 'admin', title: 'Super Admin', icon: '📊', path: '/login/admin', desc: 'Clinic oversight and system configuration.', color: '#8b5cf6' },
    ];

    const getRedirectPath = (role: string) => {
        switch (role) {
            case 'Receptionist': return '/dashboard/patients';
            case 'Doctor': return '/dashboard/scribe';
            case 'Pharmacist': return '/dashboard/handover';
            case 'Admin': return '/dashboard';         // Admin overview is at /dashboard
            default: return '/dashboard/scribe';
        }
    };

    const handleFirebaseLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                // Sign Up flow
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const userDocRef = doc(db, 'users', user.uid);
                const name = fullName.trim() || email.split('@')[0];

                await setDoc(userDocRef, {
                    uid: user.uid,
                    email: user.email,
                    name: name,
                    role: selectedRole,
                    createdAt: new Date().toISOString()
                });

                router.push(getRedirectPath(selectedRole));
            } else {
                // Sign In flow — always use the role the user selected on this page
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                const name = userDoc.exists() ? (userDoc.data().name || email.split('@')[0]) : email.split('@')[0];

                // Update role in Firestore to match what they selected
                await setDoc(userDocRef, {
                    uid: user.uid,
                    email: user.email,
                    name: name,
                    role: selectedRole,
                }, { merge: true });

                router.push(getRedirectPath(selectedRole));
            }
        } catch (err: any) {
            const code = (err as any).code;
            const msg = code === 'auth/invalid-credential' || code === 'auth/wrong-password'
                ? 'Invalid email or password. Please try again.'
                : code === 'auth/email-already-in-use'
                ? 'This email is already registered. Please sign in instead.'
                : err.message || 'Authentication failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const userDocRef = doc(db, 'users', user.uid);
            const name = user.displayName || user.email?.split('@')[0] || 'Staff Member';

            // Update Firestore with the selected role
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                name: name,
                role: selectedRole,
            }, { merge: true });

            router.push(getRedirectPath(selectedRole));
        } catch (err: any) {
            const msg = (err as any).code === 'auth/popup-closed-by-user'
                ? 'Sign-in cancelled.'
                : err.message || 'Google Sign-In failed.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.loginPage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-workspace-bg)', padding: '40px 20px' }}>
            {/* Hackathon Judge Banner */}
            <div style={{ width: '100%', maxWidth: '1000px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(16,185,129,0.1))', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>🏆</span>
                    <div>
                        <p style={{ margin: 0, fontWeight: '700', color: 'var(--color-text-primary)', fontSize: '15px' }}>Hackathon Judge? Skip the login!</p>
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '13px' }}>Use our one-click demo to explore all 4 roles instantly — no account needed.</p>
                    </div>
                </div>
                <a href="/demo" style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap', flexShrink: 0 }}>Open Demo Access →</a>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div className={styles.brandHeader} style={{ justifyContent: 'center', marginBottom: '16px' }}>
                    <span className={styles.logoIcon} style={{ fontSize: '32px' }}>☤</span>
                    <h1 className={styles.logoText} style={{ fontSize: '32px' }}>MediScribe <span style={{ color: 'var(--color-accent-green)' }}>AI</span></h1>
                </div>
                <h2 style={{ fontSize: '18px', color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>ABDM-Compliant Secure Workspace Access</h2>
            </div>

            <div style={{ display: 'flex', gap: '40px', maxWidth: '1000px', width: '100%', alignItems: 'stretch' }}>
                {/* Column 1: Firebase Auth Form */}
                <div style={{ flex: 1, backgroundColor: 'var(--color-sidebar-bg)', padding: '32px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                        {isSignUp ? 'Create Staff Account' : 'Staff Login'}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                        Authenticate securely via Firebase Authentication
                    </p>

                    {error && (
                        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '16px' }}>
                            {error}
                        </div>
                    )}

                    {/* Role Selector — always visible */}
                    <div style={{ marginBottom: '4px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
                            {isSignUp ? 'Designated Role' : 'Sign in as'}
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[
                                { value: 'Doctor', icon: '🩺', color: '#10b981' },
                                { value: 'Receptionist', icon: '📋', color: '#3b82f6' },
                                { value: 'Pharmacist', icon: '💊', color: '#f59e0b' },
                                { value: 'Admin', icon: '📊', color: '#8b5cf6' },
                            ].map(r => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setSelectedRole(r.value)}
                                    style={{
                                        padding: '10px 8px',
                                        background: selectedRole === r.value ? `${r.color}20` : 'var(--color-workspace-bg)',
                                        border: `2px solid ${selectedRole === r.value ? r.color : 'rgba(255,255,255,0.08)'}`,
                                        borderRadius: '8px',
                                        color: selectedRole === r.value ? r.color : 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: selectedRole === r.value ? '700' : '500',
                                        transition: 'all 0.15s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <span>{r.icon}</span>
                                    {r.value === 'Admin' ? 'Super Admin' : r.value}
                                    {selectedRole === r.value && <span style={{ fontSize: '10px' }}>✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleFirebaseLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {isSignUp && (
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Full Name</label>
                                <input
                                    required
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="e.g. Dr. Rajesh Sharma"
                                    style={{ width: '100%', padding: '10px 14px', background: 'var(--color-workspace-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--color-text-primary)', outline: 'none' }}
                                />
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="name@clinic.com"
                                style={{ width: '100%', padding: '10px 14px', background: 'var(--color-workspace-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--color-text-primary)', outline: 'none' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '10px 14px', background: 'var(--color-workspace-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--color-text-primary)', outline: 'none' }}
                            />
                        </div>

                        <button type="submit" disabled={loading} style={{ background: 'var(--color-accent-green)', color: '#fff', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Authenticating...' : isSignUp ? `Create Account as ${selectedRole}` : `Sign In as ${selectedRole}`}
                        </button>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 12px' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    </div>

                    <button onClick={handleGoogleSignIn} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'transparent', color: 'var(--color-text-primary)', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.8 2.71v2.24h2.91c1.7-1.56 2.69-3.86 2.69-6.58z"/>
                            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.35 0-4.33-1.59-5.05-3.73H.95v2.3C2.43 15.89 5.5 18 9 18z"/>
                            <path fill="#FBBC05" d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V5H.95a9 9 0 0 0 0 8l3-2.3z"/>
                            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.3A9 9 0 0 0 .95 5l3 2.3C4.67 5.17 6.65 3.58 9 3.58z"/>
                        </svg>
                        Sign in with Google
                    </button>

                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                        <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: 'var(--color-accent-green)', cursor: 'pointer', textDecoration: 'underline' }}>
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </div>

                {/* Column 2: Demo/Portal Access Quicklinks */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Quick Demo Access</h3>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>One click — no password needed. Explore any role instantly.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {portals.map(portal => (
                            <button
                                key={portal.id}
                                onClick={() => router.push('/demo')}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px',
                                    background: 'var(--color-sidebar-bg)', border: `1px solid ${portal.color}25`,
                                    borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = `0 6px 12px ${portal.color}25`;
                                    e.currentTarget.style.borderColor = `${portal.color}50`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                    e.currentTarget.style.borderColor = `${portal.color}25`;
                                }}
                            >
                                <div style={{ fontSize: '24px', marginBottom: '12px', background: `${portal.color}15`, width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                                    {portal.icon}
                                </div>
                                <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text-primary)', margin: '0 0 4px 0' }}>{portal.title}</h4>
                                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.4' }}>{portal.desc}</p>
                                <span style={{ marginTop: '10px', fontSize: '11px', color: portal.color, fontWeight: '600' }}>Enter Demo →</span>
                            </button>
                        ))}
                    </div>

                    <a href="/demo" style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', color: '#10b981', fontWeight: '700', textDecoration: 'none', fontSize: '14px' }}>
                        🏆 Open Full Demo Access Page →
                    </a>
                </div>
            </div>

            <div style={{ marginTop: '40px', padding: '12px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '12px', color: '#64748b', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔒</span> ABDM & ISO 27001 Compliant Healthcare Standards
            </div>
        </main>
    );
}
