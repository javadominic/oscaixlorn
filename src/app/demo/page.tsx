'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const roles = [
    {
        id: 'receptionist',
        title: 'Reception & Intake',
        subtitle: 'Front Desk Staff',
        icon: '📋',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
        redirect: '/dashboard/patients',
        roleKey: 'Receptionist',
        nameKey: 'Front Desk (Demo)',
        features: [
            'Register new patients with ABHA ID',
            'OTP verification workflow',
            'View & manage today\'s patient queue',
        ],
        demo: 'Start by registering a demo patient to see the intake flow.',
    },
    {
        id: 'doctor',
        title: 'Doctor Portal',
        subtitle: 'Attending Physician',
        icon: '🩺',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        redirect: '/dashboard/scribe',
        roleKey: 'Doctor',
        nameKey: 'Dr. Rajesh Sharma (Demo)',
        features: [
            'Live AI Scribe — real-time voice transcription',
            'Auto-generated SOAP notes via Gemini AI',
            'Safety flag detection & drug alerts',
        ],
        demo: 'Click "Start Transcription" to see the live AI scribe in action.',
    },
    {
        id: 'pharmacist',
        title: 'Pharmacy Dispatch',
        subtitle: 'Clinical Pharmacist',
        icon: '💊',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
        redirect: '/dashboard/handover',
        roleKey: 'Pharmacist',
        nameKey: 'Pharmacy Dept. (Demo)',
        features: [
            'View AI-generated prescription handover',
            'Inventory low-stock alerts',
            'Patient medication review queue',
        ],
        demo: 'See prescription handover cards generated from doctor\'s notes.',
    },
    {
        id: 'admin',
        title: 'Super Admin',
        subtitle: 'Clinic Administrator',
        icon: '📊',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
        redirect: '/dashboard',
        roleKey: 'Admin',
        nameKey: 'Super Admin (Demo)',
        features: [
            'Full clinic analytics dashboard',
            'Manage staff & user accounts',
            'Clinic settings & configuration',
        ],
        demo: 'Explore clinic-wide reports and user management.',
    },
];

export default function DemoPage() {
    const router = useRouter();
    const [entering, setEntering] = useState<string | null>(null);

    const handleEnter = (role: typeof roles[0]) => {
        setEntering(role.id);
        // We just redirect and rely on Firebase context for demo bypassing now, or let preview mode handle it.
        setTimeout(() => router.push(role.redirect), 600);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-workspace-bg)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        }}>
            {/* Header */}
            <div style={{
                background: 'var(--color-sidebar-bg)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '16px 40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>☤</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                        MediScribe <span style={{ color: '#10b981' }}>AI</span>
                    </span>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16,185,129,0.3)',
                    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', color: '#10b981', fontWeight: '600',
                }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                    Hackathon Demo Mode
                </div>
            </div>

            {/* Hero */}
            <div style={{ textAlign: 'center', padding: '60px 20px 40px' }}>
                <div style={{
                    display: 'inline-block', background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139,92,246,0.3)', borderRadius: '20px',
                    padding: '6px 16px', fontSize: '13px', color: '#a78bfa',
                    fontWeight: '600', marginBottom: '24px', letterSpacing: '0.05em',
                }}>
                    🏆 JUDGE ACCESS — ONE CLICK DEMO
                </div>
                <h1 style={{ fontSize: '42px', fontWeight: '800', margin: '0 0 16px', lineHeight: 1.2 }}>
                    Explore MediScribe as Any Role
                </h1>
                <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
                    No login required. Click any role below to instantly enter that portal with pre-loaded demo data.
                </p>
            </div>

            {/* Role Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                maxWidth: '1100px',
                margin: '0 auto',
                padding: '0 24px 80px',
            }}>
                {roles.map((role) => (
                    <div
                        key={role.id}
                        style={{
                            background: 'var(--color-sidebar-bg)',
                            border: `1px solid ${role.color}30`,
                            borderRadius: '16px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: `0 4px 24px ${role.color}10`,
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                            (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${role.color}25`;
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                            (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${role.color}10`;
                        }}
                    >
                        {/* Card Header */}
                        <div style={{ background: role.gradient, padding: '28px 24px 24px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{role.icon}</div>
                            <h2 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px', color: '#fff' }}>{role.title}</h2>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>{role.subtitle}</p>
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Features */}
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                                    What you can do
                                </p>
                                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {role.features.map((f, i) => (
                                        <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--color-text-secondary)', alignItems: 'flex-start' }}>
                                            <span style={{ color: role.color, marginTop: '2px', flexShrink: 0 }}>✓</span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Demo tip */}
                            <div style={{
                                background: `${role.color}08`,
                                border: `1px solid ${role.color}20`,
                                borderRadius: '8px',
                                padding: '10px 12px',
                                fontSize: '13px',
                                color: 'var(--color-text-secondary)',
                                lineHeight: '1.5',
                                flex: 1,
                            }}>
                                💡 <span style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>Try this:</span> {role.demo}
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={() => handleEnter(role)}
                                disabled={entering !== null}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: entering === role.id ? `${role.color}80` : role.gradient,
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: entering !== null ? 'not-allowed' : 'pointer',
                                    transition: 'opacity 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    opacity: entering !== null && entering !== role.id ? 0.5 : 1,
                                }}
                            >
                                {entering === role.id ? (
                                    <>⏳ Entering {role.title}...</>
                                ) : (
                                    <>Enter as {role.subtitle} →</>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer note */}
            <div style={{
                textAlign: 'center',
                padding: '24px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                fontSize: '13px',
                color: '#475569',
            }}>
                🔒 Demo data is pre-seeded from Firestore · Switch roles anytime by returning to this page
                <br />
                <span style={{ marginTop: '8px', display: 'inline-block' }}>
                    Want to test real Firebase Auth?{' '}
                    <a href="/login" style={{ color: '#10b981', textDecoration: 'underline' }}>Go to full login →</a>
                </span>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}
