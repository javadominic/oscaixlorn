'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './DashboardShowcase.module.css';
import DashboardLayout from '../dashboard/DashboardLayout';
import ScribePage from '../dashboard/scribe/page';

export default function DashboardShowcase() {
    const [demoStage, setDemoStage] = useState<'flat' | 'recording' | 'floating'>('flat');
    const [demoTrigger, setDemoTrigger] = useState(0);
    return (
        <section className={styles.showcaseSection} id="how-it-works">
            <div className={styles.container}>
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                >
                    <div className={styles.tag}>Workflow Integration Hook</div>
                    <h2 className={styles.title}>Where High-Tech Meets the Hospital Room</h2>
                    <p className={styles.subtitle}>
                        Explore the intuitive MediScribe workspace. We’ve eliminated the clutter so you can focus on the patient, while our AI handles the structured documentation in the background.
                    </p>
                </motion.div>

                <motion.div
                    className={styles.browserWindow}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <div className={styles.browserTopBar}>
                        <div className={styles.dots}>
                            <span className={styles.dotClose}></span>
                            <span className={styles.dotMin}></span>
                            <span className={styles.dotMax}></span>
                        </div>
                        <div className={styles.urlBar}>mediscribe.app/dashboard</div>
                    </div>

                    <div className={styles.browserContent}>
                        {/* Full-screen Doctor Dashboard */}
                        <div className={styles.scaledWrapper} style={{ width: '100%', height: '100%' }}>
                            <DashboardLayout isPreview={true} previewRole="doctor">
                                <ScribePage
                                    isDemo={true}
                                    demoTrigger={demoTrigger}
                                    onDemoStart={() => setDemoStage('recording')}
                                    onDemoComplete={() => {/* Stay on the dashboard view */ }}
                                />
                            </DashboardLayout>
                        </div>

                        {/* Floating Label */}
                        <div className={styles.panelGlassOverlay} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
                            <div className={styles.panelLabel}>👨‍⚕️ Doctor's Live Scribe {demoStage === 'flat' && "(Interactive Demo)"}</div>
                        </div>

                        {/* Demo Call to Action Overlay */}
                        {demoStage === 'flat' && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11, 29, 58, 0.4)', backdropFilter: 'blur(4px)', zIndex: 40, pointerEvents: 'auto' }}>
                                <motion.div 
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: -40 }}
                                    transition={{ duration: 0.5 }}
                                    style={{ background: 'var(--color-dark-surface)', padding: '32px 40px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.5)', boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 4px rgba(16, 185, 129, 0.1)', textAlign: 'center', maxWidth: '420px' }}
                                >
                                    <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '24px' }}>Try the Interactive Demo</h3>
                                    <p style={{ margin: '0 0 24px 0', color: '#b5c4d6', fontSize: '15px', lineHeight: 1.5 }}>
                                        Experience how our AI acts as a co-pilot, extracting clinical data in real-time while the doctor speaks to the patient.
                                    </p>
                                    <button 
                                        onClick={() => setDemoTrigger(t => t + 1)}
                                        style={{ background: 'var(--color-accent-green)', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', transition: 'transform 0.2s, background 0.2s', width: '100%' }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        ▶️ Start Demo Now
                                    </button>
                                </motion.div>
                            </div>
                        )}

                        {/* Small Floating Compliance Badges at corners */}
                        <div className={styles.glowingKeyword} style={{ position: 'absolute', top: '60px', left: '20px', animationDelay: '0s', zIndex: 60 }}>⭐ ABDM Compliant</div>
                        <div className={styles.glowingKeyword} style={{ position: 'absolute', top: '60px', right: '20px', animationDelay: '0.5s', zIndex: 60 }}>🔒 HIPAA Ready</div>
                        <div className={styles.glowingKeyword} style={{ position: 'absolute', bottom: '20px', left: '20px', animationDelay: '1s', zIndex: 60 }}>🗣️ Hinglish AI</div>
                        <div className={styles.glowingKeyword} style={{ position: 'absolute', bottom: '20px', right: '20px', animationDelay: '1.5s', zIndex: 60 }}>📑 ICD-10 Coding</div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
