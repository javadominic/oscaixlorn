'use client';
import React from 'react';
import styles from '../Dashboard.module.css';
import { useGlobalState } from '../GlobalStateContext';

export default function ReceptionistQueuePage() {
    const { patients } = useGlobalState();

    return (
        <div className={styles.dashboardContent}>
            <div className={styles.topHeader} style={{ marginBottom: '24px' }}>
                <h1 className={styles.pageTitle}>Today's Queue</h1>
                <div className={styles.headerActions}>
                    <div className={styles.searchBar}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input type="text" placeholder="Search by name, ID, or phone..." className={styles.searchInput} />
                    </div>
                </div>
            </div>

            <div className={styles.workflowCard} style={{ padding: '0', overflow: 'hidden', maxWidth: '1000px' }}>
                <div className={styles.tableContainer} style={{ border: 'none' }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Patient Name</th>
                                <th>ABHA Status</th>
                                <th>Assigned Doctor</th>
                                <th>Triage Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((row: any, i: number) => (
                                <tr key={i} className={styles.tableRow}>
                                    <td><span className={styles.textMuted}>{row.time || 'Today'}</span></td>
                                    <td><span className={styles.fw600}>{row.name} {row.age && `(${row.age})`}</span></td>
                                    <td>
                                        {row.isLinked ? (
                                            <span className={styles.textMuted} style={{ fontFamily: 'monospace', color: 'var(--color-accent-green)', fontWeight: 'bold' }}>✓ Linked</span>
                                        ) : (
                                            <button style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-primary)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                                                Discover ABHA
                                            </button>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{row.assignedDoctor || 'Dr. Rajesh Sharma'}</span>
                                    </td>
                                    <td>
                                        <span className={`${styles.tableBadge} ${(row.stat || row.status) === 'Waiting' ? styles.warning : styles.success}`}>
                                            {row.stat || row.status || 'Waiting'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
