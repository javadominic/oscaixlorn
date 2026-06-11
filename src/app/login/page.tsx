'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';

export default function LoginPage() {
    const router = useRouter();

    const portals = [
        { id: 'receptionist', title: 'Reception & Intake', icon: '📝', path: '/login/receptionist', desc: 'Patient registration and queue management.', color: '#3b82f6' },
        { id: 'doctor', title: 'Doctor Portal', icon: '🩺', path: '/login/doctor', desc: 'Live AI Scribe and EMR review workspace.', color: '#10b981' },
        { id: 'pharmacist', title: 'Pharmacy Dispatch', icon: '💊', path: '/login/pharmacist', desc: 'Secure prescription and patient handover.', color: '#f59e0b' },
        { id: 'admin', title: 'Super Admin', icon: '📊', path: '/login/admin', desc: 'Clinic oversight and system configuration.', color: '#8b5cf6' },
    ];

    return (
        <main className={styles.loginPage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-workspace-bg)' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div className={styles.brandHeader} style={{ justifyContent: 'center', marginBottom: '16px' }}>
                    <span className={styles.logoIcon} style={{ fontSize: '32px' }}>☤</span>
                    <h1 className={styles.logoText} style={{ fontSize: '32px' }}>MediScribe <span style={{ color: 'var(--color-accent-green)' }}>AI</span></h1>
                </div>
                <h2 style={{ fontSize: '20px', color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>Select your designated access portal</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '800px', width: '100%', padding: '0 24px' }}>
                {portals.map(portal => (
                    <button
                        key={portal.id}
                        onClick={() => router.push(portal.path)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '24px',
                            background: 'var(--color-sidebar-bg)', border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = `0 10px 20px ${portal.color}20`;
                            e.currentTarget.style.borderColor = `${portal.color}50`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                        }}
                    >
                        <div style={{ fontSize: '32px', marginBottom: '16px', background: `${portal.color}15`, width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                            {portal.icon}
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-text-primary)', margin: '0 0 8px 0' }}>{portal.title}</h3>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.5' }}>{portal.desc}</p>
                    </button>
                ))}
            </div>

            <div style={{ marginTop: '48px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '12px', color: '#64748b', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <span className={styles.lockIcon}>🔒</span> Secure, ABDM Compliant System Access
            </div>
        </main>
    );
}
