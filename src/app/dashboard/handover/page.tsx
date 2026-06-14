'use client';
import React from 'react';
import styles from '../Dashboard.module.css';
import { useGlobalState } from '../GlobalStateContext';
import { useRouter } from 'next/navigation';

export default function HandoverPage() {
    const { patients, activePatientId, setActivePatientId, setPatients, clinicDetails, pharmacyAlerts, setPharmacyAlerts } = useGlobalState();

    const activePatient = patients.find((p: any) => p.id === activePatientId) || patients[0];

    const handlePrintAndClose = () => {
        // Update patient status globally to Completed
        setPatients(prev => prev.map(p => p.id === activePatientId ? { ...p, status: 'Completed' } : p));

        // In a real app, this would trigger window.print()
        window.print();

        // Auto-select next pharmacy patient if any
        const nextPatient = patients.find((p: any) => p.status === 'Pharmacy' && p.id !== activePatientId);
        if (nextPatient) setActivePatientId(nextPatient.id);
    };

    return (
        <div className={styles.dashboardContent} style={{ padding: '24px 32px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.topHeader} style={{ marginBottom: '24px' }}>
                <h1 className={styles.pageTitle}>Pharmacy & Patient Handover</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(350px, 1fr) minmax(300px, 400px)', gap: '24px', flex: 1, alignItems: 'stretch', minHeight: 0 }}>

                {/* Column 1: Pharmacist Queue Sidebar */}
                <div className={styles.workflowCard} style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <h3 className={styles.sectionHeader} style={{ margin: 0, fontSize: '16px' }}>Pharmacy Queue</h3>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <div style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)' }}>Pending Dispense</div>
                        {patients.filter((p: any) => p.status === 'Pharmacy').map((p: any) => (
                            <div key={p.id} onClick={() => setActivePatientId(p.id)} style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: activePatientId === p.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent', borderLeft: activePatientId === p.id ? '3px solid var(--color-accent-green)' : '3px solid transparent' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{p.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{p.id}</div>
                            </div>
                        ))}
                        {patients.filter((p: any) => p.status === 'Pharmacy').length === 0 && (
                            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>No pending prescriptions.</div>
                        )}

                        <div style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>Dispensed (History)</div>
                        {patients.filter((p: any) => p.status === 'Completed').map((p: any) => (
                            <div key={p.id} onClick={() => setActivePatientId(p.id)} style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: activePatientId === p.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent', borderLeft: activePatientId === p.id ? '3px solid var(--color-accent-green)' : '3px solid transparent' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{p.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Done</div>
                            </div>
                        ))}
                        {patients.filter((p: any) => p.status === 'Completed').length === 0 && (
                            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>No history yet.</div>
                        )}
                    </div>
                </div>

                {/* Column 2: Clinical Summary (PDF Preview) */}
                <div style={{ background: '#ffffff', borderRadius: '4px', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', display: 'flex', flexDirection: 'column', color: '#0f172a', borderTop: '8px solid var(--color-navy-blue)', height: '100%', minHeight: '600px', overflowY: 'auto' }}>
                    <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold', color: 'var(--color-navy-blue)' }}>{clinicDetails.name}</h2>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{clinicDetails.doctor}<br />{clinicDetails.registration}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{clinicDetails.address}<br />Mobile: {clinicDetails.mobile}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>Date: {new Date().toLocaleDateString()}</p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Patient Name</span>
                            <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{activePatient?.name || 'Priya Sharma'}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Age/Sex</span>
                            <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{activePatient?.age || '34F'}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Vitals</span>
                            <div style={{ fontSize: '14px' }}>BP: {activePatient?.vitals?.bp || '120/80'} | HR: {activePatient?.vitals?.hr || '72'} | Temp: {activePatient?.vitals?.temp || '98.6°F'}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>ABHA ID</span>
                            <div style={{ fontSize: '14px' }}>{activePatient?.id || '14-3829-1928-33'}</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>Chief Complaint & HPI</h4>
                        <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{activePatient?.hpi || 'No patient history recorded.'}</p>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>Clinical Diagnosis</h4>
                        <p style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>{activePatient?.diagnosis || 'Diagnosis pending'}</p>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <h4 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>Treatment Plan & Investigations</h4>
                        <ul style={{ fontSize: '14px', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
                            {activePatient?.assessment && activePatient.assessment.length > 0 ? (
                                activePatient.assessment.map((item: string, idx: number) => (
                                    <li key={idx} style={{ whiteSpace: 'pre-line' }}>{item}</li>
                                ))
                            ) : (
                                <li>No specific plan or investigations recorded.</li>
                            )}
                        </ul>
                    </div>

                    {/* Highlighted Final Prescription */}
                    <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', padding: '20px', borderRadius: '8px', marginTop: 'auto' }}>
                        <h3 style={{ fontSize: '18px', color: '#166534', margin: '0 0 16px 0', borderBottom: '1px solid #bbf7d0', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '24px' }}>℞</span> Final Prescription
                        </h3>
                        <div style={{ fontSize: '16px', lineHeight: '1.8', margin: 0, fontWeight: '600', color: '#0f172a' }}>
                            {activePatient?.assessment && activePatient.assessment.length > 0 ? (
                                <ul style={{ paddingLeft: '24px', margin: 0 }}>
                                    {activePatient.assessment.map((item: string, idx: number) => (
                                        <li key={idx} style={{ marginBottom: '8px', whiteSpace: 'pre-line' }}>{item}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ margin: 0, fontStyle: 'italic', fontWeight: 'normal' }}>Awaiting prescription details...</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Patient Discharge Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div className={styles.workflowCard} style={{ padding: '32px', borderTop: '6px solid var(--color-accent-green)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <span style={{ fontSize: '48px' }}>🩺</span>
                            <h2 style={{ fontSize: '22px', color: 'var(--color-text-primary)', margin: '12px 0 4px 0' }}>Patient Discharge Summary</h2>
                            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>Simplified Instructions for You</p>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' }}>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Diagnosis</span>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{activePatient?.diagnosis || 'Pending Diagnosis'}</div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '15px', color: 'var(--color-text-primary)', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Treatment Instructions:</h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {activePatient?.assessment && activePatient.assessment.length > 0 ? (
                                    activePatient.assessment.map((item: string, idx: number) => (
                                        <div key={idx} style={{ background: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--color-accent-green)', padding: '16px', borderRadius: '6px' }}>
                                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 'bold', whiteSpace: 'pre-line' }}>{item}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '6px', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Please review the main prescription sheet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Bar / QR Section */}
                        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '64px', height: '64px', background: '#fff', padding: '4px', borderRadius: '8px' }}>
                                    {/* Mock QR Code Pattern */}
                                    <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, #000, #000 5px, #fff 5px, #fff 10px)' }}></div>
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>Scan to Download</span>
                                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-accent-green)' }}>ABHA Digital Record</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handlePrintAndClose}
                        style={{ width: '100%', padding: '16px', background: 'var(--color-accent-green)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)', transition: 'transform 0.2s' }}
                    >
                        <span>🖨️</span> Print & Close Case
                    </button>

                </div>
            </div>
        </div>
    );
}
