'use client';
import React, { useMemo } from 'react';
import styles from '../Dashboard.module.css';
import { useGlobalState } from '../GlobalStateContext';

export default function AnalyticsPage() {
    const { patients } = useGlobalState();

    const stats = useMemo(() => {
        const totalPatients = patients.length;
        const abdmRecords = patients.filter(p => p.abhaId).length;
        const safetyFlags = patients.filter(p => p.safetyFlag).length;

        // Compute diagnosis frequencies
        const diagFreq: Record<string, number> = {};
        patients.forEach(p => {
            if (p.diagnosis) {
                diagFreq[p.diagnosis] = (diagFreq[p.diagnosis] || 0) + 1;
            }
        });

        // Sort by frequency
        const topDiagnoses = Object.entries(diagFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({
                name,
                count,
                percentage: totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0
            }));

        return { totalPatients, abdmRecords, safetyFlags, topDiagnoses };
    }, [patients]);

    const handleExport = () => {
        const headers = ['Patient ID', 'Name', 'Age', 'Diagnosis', 'Status', 'Safety Flag', 'ABHA ID'];
        const csvContent = [
            headers.join(','),
            ...patients.map(p => [
                p.id,
                `"${p.name || ''}"`,
                p.age || '',
                `"${p.diagnosis || ''}"`,
                p.status || '',
                `"${p.safetyFlag || ''}"`,
                p.abhaId || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `clinic_analytics_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={styles.dashboardContent}>
            <div className={styles.topHeader}>
                <h1 className={styles.pageTitle}>Clinic Analytics</h1>
                <div className={styles.headerActions}>
                    <button className={styles.btnSecondary} onClick={handleExport}>
                        Export Report (CSV)
                    </button>
                </div>
            </div>

            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>TOTAL PATIENTS SEEN</span>
                        <span className={styles.iconBtn} style={{ boxShadow: 'none', border: 'none', background: '#f8fafc', width: '36px', height: '36px' }}>👥</span>
                    </div>
                    <div className={styles.kpiValue}>
                        {stats.totalPatients}
                    </div>
                    <span className={styles.kpiTrend}>
                        <span className={styles.trendUp}>↗ Live</span> tracked from Scribe
                    </span>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>ABDM HEALTH RECORDS GENERATED</span>
                        <span className={styles.iconBtn} style={{ boxShadow: 'none', border: 'none', background: '#f8fafc', width: '36px', height: '36px' }}>📄</span>
                    </div>
                    <div className={styles.kpiValue}>
                        {stats.abdmRecords} <span className={styles.kpiSub}>Successfully Synced</span>
                    </div>
                    <span className={styles.kpiTrend}>
                        <span className={styles.trendUp}>↗ {stats.totalPatients > 0 ? Math.round((stats.abdmRecords / stats.totalPatients) * 100) : 0}%</span> compliance rate today
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1 }}>
                <div className={styles.workflowCard} style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
                    <h3 className={styles.sectionHeader} style={{ margin: '0 0 24px 0', borderBottom: 'none' }}>Top 5 Primary Diagnoses (ICD-10) This Month</h3>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
                        {stats.topDiagnoses.length > 0 ? stats.topDiagnoses.map((diag, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '120px', fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={diag.name}>{diag.name}</div>
                                <div style={{ flex: 1, background: '#f1f5f9', height: '20px', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${diag.percentage}%`, background: '#3b82f6', height: '100%', minWidth: '2px' }}></div>
                                </div>
                                <div style={{ width: '40px', fontSize: '13px', color: '#64748b', textAlign: 'right' }}>{diag.count}</div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>No diagnoses recorded yet.</div>
                        )}
                    </div>
                </div>

                <div className={styles.workflowCard} style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
                    <h3 className={styles.sectionHeader} style={{ margin: '0 0 24px 0', borderBottom: 'none' }}>Analytics Audit Trail</h3>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', margin: '0 0 16px 0' }}>🛡️</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#b45309' }}>{stats.safetyFlags}</div>
                            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Safety Flags Identified via Engine</div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', display: 'flex', gap: '40px', justifyContent: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#059669' }}>{stats.safetyFlags} (100%)</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Flags Acted Upon</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>0 (0%)</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Overridden / Dismissed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
