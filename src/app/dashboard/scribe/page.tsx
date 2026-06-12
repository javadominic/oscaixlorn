'use client';
import React, { useState, useEffect, useRef } from 'react';
import styles from '../Dashboard.module.css';
import { useGlobalState } from '../GlobalStateContext';
import { useRouter } from 'next/navigation';

export default function ScribePage(props: { isDemo?: boolean, onDemoComplete?: () => void, onDemoStart?: () => void, demoTrigger?: number }) {
    const { isDemo = false, onDemoComplete, onDemoStart, demoTrigger } = props;
    const { patients, transcripts, setTranscripts, activePatientId, setActivePatientId, addTranscriptRecord, pharmacyAlerts, setPatients } = useGlobalState();
    const router = useRouter();
    const [isRecording, setIsRecording] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [showPatientList, setShowPatientList] = useState(false);
    const recognitionRef = useRef<any>(null);
    const activePatientIdRef = useRef(activePatientId);

    // Watch for the demoTrigger from DashboardShowcase
    useEffect(() => {
        if (demoTrigger && demoTrigger > 0) {
            if (!isRecording) {
                // If there's no active patient, pick the first one
                if (!activePatientIdRef.current && patients.length > 0) {
                    setActivePatientId(patients[0].id);
                }
                
                // Set recording true and call onDemoStart immediately
                setIsRecording(true);
                if (onDemoStart) onDemoStart();

                // Run the exact same sequence as toggleRecording demo logic
                const demoLines = [
                    { speaker: 'Doctor', text: 'Good morning, Priya. Kya takleef hai aapko?' },
                    { speaker: 'Patient', text: 'Doctor, kal raat se sir mein bohot severe pain ho raha hai.' },
                    { speaker: 'Doctor', text: 'I see. Vision mein kuch changes lag rahe hain? Any flashing lights?' },
                    { speaker: 'Patient', text: 'Haan sir, zigzag lines dikhayi deti hain pain shuru hone se pehle.' },
                    { speaker: 'Doctor', text: 'Theek hai. Aapka BP check karte hain... 120/80, which is normal. HR is 72.' },
                    { speaker: 'Doctor', text: 'Priya, kya aapko koi acidity ya gastritis ki problem rahi hai pehle?' },
                    { speaker: 'Patient', text: 'Haan sir, pain-killers lene se pet mein bohot jalan hoti hai.' },
                    { speaker: 'Doctor', text: "Understood. I'll prescribe Sumatriptan 50mg for acute attacks. Take it 'Zaroorat padne par'." },
                    { speaker: 'Doctor', text: 'Iska summary aapke ABHA app pe mil jayega. Pharmacist ko dikha dena.' }
                ];

                let lineIndex = 0;
                const interval = setInterval(() => {
                    if (lineIndex < demoLines.length) {
                        const now = new Date();
                        const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
                        const targetId = activePatientIdRef.current || patients[0]?.id;
                        if (targetId) addTranscriptRecord(targetId, { ...demoLines[lineIndex], time: timeStr });
                        lineIndex++;
                    } else {
                        clearInterval(interval);
                        setIsRecording(false);
                        if (onDemoComplete) onDemoComplete();
                    }
                }, 1600);
            }
        }
    }, [demoTrigger]);

    // Auto-scroll refs
    const transcriptContainerRef = useRef<HTMLDivElement>(null);
    const emrContainerRef = useRef<HTMLDivElement>(null);

    const activePatient = patients.find((p: any) => p.id === activePatientId);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowPatientList(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        activePatientIdRef.current = activePatientId;
    }, [activePatientId]);

    // Track whether we WANT to be recording (separate from browser's recognition state)
    const wantRecordingRef = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // HTTPS check for deployed environments
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                console.warn('MediScribe: Web Speech API requires HTTPS. Microphone may not work on HTTP deployments.');
            }

            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRec) {
                const recognition = new SpeechRec();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-IN'; // Indian English — transcribes Hinglish in Roman script, not Devanagari

                recognition.onresult = (event: any) => {
                    let finalTranscriptStr = '';
                    let tempInterimStr = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscriptStr += event.results[i][0].transcript;
                        } else {
                            tempInterimStr += event.results[i][0].transcript;
                        }
                    }

                    if (finalTranscriptStr) {
                        const now = new Date();
                        const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');

                        setTranscripts((prev: any) => {
                            const currentId = activePatientIdRef.current;
                            if (!currentId) return prev;
                            const currentList = prev[currentId] || [];
                            return {
                                ...prev,
                                [currentId]: [...currentList, { speaker: 'Doctor/Patient (Live)', text: finalTranscriptStr.trim(), time: timeStr }]
                            };
                        });
                        setInterimTranscript('');
                    } else {
                        setInterimTranscript(tempInterimStr);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    if (event.error === 'not-allowed') {
                        alert("Microphone access was denied. Please allow microphone permission in your browser settings and ensure you are on HTTPS.");
                        wantRecordingRef.current = false;
                        setIsRecording(false);
                    } else if (event.error === 'no-speech') {
                        // No speech detected - this is normal, just restart
                        console.log('No speech detected, will auto-restart...');
                    } else if (event.error === 'network') {
                        alert("Network error. Speech recognition requires a stable internet connection.");
                        wantRecordingRef.current = false;
                        setIsRecording(false);
                    }
                };

                // Auto-restart: if the browser kills the session but we still want to record, restart it
                recognition.onend = () => {
                    if (wantRecordingRef.current) {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error('Auto-restart failed:', e);
                            wantRecordingRef.current = false;
                            setIsRecording(false);
                        }
                    } else {
                        setIsRecording(false);
                    }
                };

                recognitionRef.current = recognition;
            }
        }

        return () => {
            wantRecordingRef.current = false;
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.abort();
            }
        };
    }, []);

    const listLength = transcripts[activePatientId]?.length || 0;

    // Only count structured DEMO transcripts (speaker = 'Doctor' or 'Patient')
    // Real mic entries (speaker = 'Doctor/Patient (Live)') are excluded
    const demoTranscripts = (transcripts[activePatientId] || []).filter(
        (t: any) => t.speaker === 'Doctor' || t.speaker === 'Patient'
    );
    const demoLength = demoTranscripts.length;

    // Is the user using the real mic (NOT demo mode)
    const hasLiveMicData = !isDemo && listLength > 0;

    // Auto-scroll effect — works for both demo and real mic recording
    useEffect(() => {
        if (transcriptContainerRef.current) {
            transcriptContainerRef.current.scrollTo({
                top: transcriptContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
        if (emrContainerRef.current) {
            setTimeout(() => {
                if (!emrContainerRef.current) return;
                let targetTop = 0;
                // Use demoLength to determine which box is active
                if (demoLength >= 7) {
                    targetTop = emrContainerRef.current.scrollHeight; // Scroll to bottom (Safety/Meds)
                } else if (demoLength >= 4) {
                    targetTop = emrContainerRef.current.scrollHeight * 0.4; // Scroll to middle (Diagnosis)
                } else {
                    targetTop = 0; // Stay at top
                }
                emrContainerRef.current.scrollTo({
                    top: targetTop,
                    behavior: 'smooth'
                });
            }, 50); // Small delay to let DOM update heights
        }
    }, [transcripts, activePatientId, listLength, interimTranscript]);

    const toggleRecording = () => {
        if (!activePatientId && patients.length > 0) {
            setActivePatientId(patients[0].id); // Auto-select first patient if none selected
        }

        if (isDemo) {
            if (isRecording) return;
            setIsRecording(true);
            if (onDemoStart) onDemoStart(); // Triggers the visual recording state!

            const demoLines = [
                { speaker: 'Doctor', text: 'Good morning, Priya. Kya takleef hai aapko?' },
                { speaker: 'Patient', text: 'Doctor, kal raat se sir mein bohot severe pain ho raha hai.' },
                { speaker: 'Doctor', text: 'I see. Vision mein kuch changes lag rahe hain? Any flashing lights?' },
                { speaker: 'Patient', text: 'Haan sir, zigzag lines dikhayi deti hain pain shuru hone se pehle.' },
                { speaker: 'Doctor', text: 'Theek hai. Aapka BP check karte hain... 120/80, which is normal. HR is 72.' },
                { speaker: 'Doctor', text: 'Priya, kya aapko koi acidity ya gastritis ki problem rahi hai pehle?' },
                { speaker: 'Patient', text: 'Haan sir, pain-killers lene se pet mein bohot jalan hoti hai.' },
                { speaker: 'Doctor', text: "Understood. I'll prescribe Sumatriptan 50mg for acute attacks. Take it 'Zaroorat padne par'." },
                { speaker: 'Doctor', text: 'Iska summary aapke ABHA app pe mil jayega. Pharmacist ko dikha dena.' }
            ];

            let lineIndex = 0;
            const interval = setInterval(() => {
                if (lineIndex < demoLines.length) {
                    const now = new Date();
                    const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
                    const targetId = activePatientIdRef.current || patients[0]?.id;
                    if (targetId) addTranscriptRecord(targetId, { ...demoLines[lineIndex], time: timeStr });
                    lineIndex++;
                } else {
                    clearInterval(interval);
                    setIsRecording(false);
                    if (onDemoComplete) onDemoComplete();
                }
            }, 1600);
            return;
        }

        if (isRecording) {
            wantRecordingRef.current = false;
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            if (recognitionRef.current) {
                try {
                    wantRecordingRef.current = true;
                    recognitionRef.current.start();
                    setIsRecording(true);
                } catch (e) {
                    console.error("Start recording failed:", e);
                    wantRecordingRef.current = false;
                }
            } else {
                alert("Speech recognition is not supported in this browser. Please use Google Chrome on HTTPS.");
            }
        }
    };

    return (
        <div className={styles.dashboardContent} style={{ padding: '24px 32px' }}>
            <div style={{ marginBottom: '16px' }}>
                <h1 className={styles.pageTitle} style={{ fontSize: '24px' }}>Welcome back, Doctor</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>Live AI Scribe & Consultation Workspace</p>
            </div>

            {/* Top Banner: Patient Context & Recording Status */}
            <div className={styles.workflowCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', marginBottom: '8px', borderLeft: isRecording ? '4px solid #ef4444' : '4px solid var(--color-accent-green)', overflow: 'visible' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div>
                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Consultation</span>
                        <div style={{ position: 'relative' }} ref={dropdownRef}>
                            <button onClick={() => setShowPatientList(!showPatientList)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', fontSize: '20px', fontWeight: 'bold', cursor: isDemo ? 'default' : 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: isDemo ? 'none' as const : 'auto' as const }}>
                                {activePatient ? `${activePatient.name} ${activePatient.age ? `(${activePatient.age})` : ''}` : 'Select a patient...'}
                                <span style={{ fontSize: '12px' }}>▼</span>
                            </button>
                            {showPatientList && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: 'var(--color-sidebar-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '320px', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Upcoming / Waiting</div>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {patients.filter((p: any) => p.status === 'Waiting' || p.status === 'Transcribing' || p.condition === 'Pending Intake').map((p: any) => (
                                            <div key={p.id} onClick={() => { setActivePatientId(p.id); setShowPatientList(false); }} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activePatientId === p.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent' }}>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.name} <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{p.age}</span></div>
                                                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Status: {p.status}</div>
                                                </div>
                                                <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-alert-amber)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>WAIT</span>
                                            </div>
                                        ))}
                                        {patients.filter((p: any) => p.status === 'Waiting' || p.status === 'Transcribing' || p.condition === 'Pending Intake').length === 0 && (
                                            <div style={{ padding: '12px', color: 'var(--color-text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>No patients waiting.</div>
                                        )}
                                    </div>
                                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>History (Seen Today)</div>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {patients.filter((p: any) => !['Waiting', 'Transcribing'].includes(p.status) && p.condition !== 'Pending Intake').map((p: any) => (
                                            <div key={p.id} onClick={() => { setActivePatientId(p.id); setShowPatientList(false); }} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activePatientId === p.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent' }}>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.name} <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{p.age}</span></div>
                                                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Status: {p.status}</div>
                                                </div>
                                                <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-accent-green)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>DONE</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ paddingLeft: '24px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', gap: '32px' }}>
                            <div>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>ABHA ID</span>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: activePatient?.abhaId ? 'var(--color-accent-green)' : '#ef4444' }}>{activePatient?.abhaId || 'Not Linked'}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Vitals Summary</span>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-accent-green)' }}>BP: 120/80 | HR: 72</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {isRecording && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 'bold', fontSize: '14px', animation: `${styles.pulse} 2s infinite` }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                            🎙️ RECORDING
                        </div>
                    )}
                    <button
                        onClick={toggleRecording}
                        className={isDemo && !isRecording ? styles.demoMicPulse : ''}
                        style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', background: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-accent-green)', color: isRecording ? '#ef4444' : '#fff', transition: 'all 0.2s', position: 'relative', pointerEvents: 'auto' }}
                    >
                        {isRecording ? 'PAUSE CAPTURE' : 'START MIC'}
                    </button>
                    {!isDemo && !isRecording && transcripts[activePatientId]?.length > 0 && (
                        <button
                            onClick={() => {
                                setPatients((prev: any[]) => prev.map((p: any) => p.id === activePatientId ? { ...p, status: 'Reviewing' } : p));
                                router.push('/dashboard/review');
                            }}
                            style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--color-accent-green)', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-accent-green)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            📋 Send to Doctor Review
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 400px) 1fr', gap: '24px', flex: 1, height: 'calc(100vh - 160px)' }}>
                {/* Left Column: Audio Capture / Feed */}
                <div className={styles.workflowCard} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>Live Audio Capture</h3>
                        <span style={{ fontSize: '12px', color: 'var(--color-accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent-green)' }}></span>
                            Hinglish Supported
                        </span>
                    </div>

                    <div ref={transcriptContainerRef} style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {(!activePatientId || !transcripts[activePatientId] || transcripts[activePatientId].length === 0) ? (
                            <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.5, color: 'var(--color-text-secondary)' }}>
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎙️</div>
                                <p>No audio captured yet.</p>
                                <p style={{ fontSize: '12px' }}>Click Start Mic to begin transcription.</p>
                            </div>
                        ) : (
                            transcripts[activePatientId].map((msg: any, idx: number) => (
                                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{msg.speaker || 'Log Entry'}</span>
                                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{msg.time}</span>
                                    </div>
                                    <div style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--color-text-primary)' }}>{msg.text}</div>
                                </div>
                            ))
                        )}

                        {isRecording && interimTranscript && (
                            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '14px', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent-green)' }}>Hearing...</span>
                                </div>
                                <div style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--color-text-primary)', fontStyle: 'italic' }}>{interimTranscript}</div>
                            </div>
                        )}
                    </div>

                    {isRecording && (
                        <div style={{ height: '60px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            {/* Simulated active waveform */}
                            {[...Array(15)].map((_, i) => (
                                <div key={i} style={{ width: '4px', height: `${Math.random() * 24 + 8}px`, background: 'var(--color-accent-green)', borderRadius: '2px', animation: `${styles.pulse} ${Math.random() * 0.5 + 0.5}s infinite ease-in-out alternate` }} />
                            ))}
                        </div>
                    )}
                </div>



                {/* Right Column: Agentic EMR Cards */}
                <div ref={emrContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-text-primary)', margin: 0 }}>Agentic EMR Extraction</h2>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px' }}>Auto-Syncing</span>
                    </div>

                    {/* Chief Complaint & History */}
                    <div className={styles.workflowCard} style={{
                        padding: '20px',
                        transition: 'all 0.5s ease',
                        border: (demoLength === 2 || demoLength === 3) ? '1px solid rgba(16, 185, 129, 0.4)' : '',
                        boxShadow: (demoLength === 2 || demoLength === 3) ? '0 0 20px rgba(16, 185, 129, 0.15)' : ''
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '15px' }}>Chief Complaint &amp; HPI</h4>
                            {demoLength > 1 ? (
                                <span style={{ color: 'var(--color-accent-green)', fontSize: '12px', fontWeight: 'bold' }}>✓ Extracted</span>
                            ) : (
                                <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>⏳ Awaiting Speech</span>
                            )}
                        </div>
                        <p style={{ color: demoLength > 1 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                            {hasLiveMicData
                                ? '🔬 Awaiting ML Model API — real-time extraction coming soon.'
                                : demoLength > 1
                                    ? 'Patient reports severe headache since last night, later confirmed accompanied by visual auras (zigzag lines).'
                                    : 'AI is listening for symptoms and history...'}
                        </p>
                    </div>

                    {/* Provisional Diagnosis */}
                    <div className={styles.workflowCard} style={{
                        padding: '20px',
                        transition: 'all 0.5s ease',
                        border: (demoLength >= 4 && demoLength <= 6) ? '1px solid rgba(16, 185, 129, 0.4)' : '',
                        boxShadow: (demoLength >= 4 && demoLength <= 6) ? '0 0 20px rgba(16, 185, 129, 0.15)' : ''
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '15px' }}>Provisional Diagnosis</h4>
                            {demoLength > 3 ? (
                                <span style={{ color: 'var(--color-accent-green)', fontSize: '12px', fontWeight: 'bold' }}>✓ Extracted</span>
                            ) : (
                                <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>⏳ Analyzing</span>
                            )}
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {hasLiveMicData ? (
                                <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', fontSize: '14px' }}>🔬 Awaiting ML Model API — diagnosis extraction coming soon.</span>
                            ) : demoLength > 3 ? (
                                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '14px' }}>Migraine with Aura (ICD-10: G43.109)</span>
                            ) : (
                                <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', fontSize: '14px' }}>Drafting diagnosis codes...</span>
                            )}
                        </div>
                    </div>

                    {/* Two Column Split: Safety Check & Medications */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className={styles.workflowCard} style={{
                            padding: '20px',
                            transition: 'all 0.5s ease',
                            border: (demoLength === 7) ? '1px solid rgba(239, 68, 68, 0.4)' : '',
                            boxShadow: (demoLength === 7) ? '0 0 20px rgba(239, 68, 68, 0.15)' : ''
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <h4 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '15px' }}>Clinical Safety Check</h4>
                            </div>
                            {hasLiveMicData ? (
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', fontSize: '13px' }}>🔬 Awaiting ML Model API</span>
                                </div>
                            ) : demoLength > 6 ? (
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '8px' }}>
                                    <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        ⚠️ FLAG: NSAID-induced Gastritis History
                                    </span>
                                </div>
                            ) : (
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', fontSize: '13px' }}>Scanning Patient History...</span>
                                </div>
                            )}
                        </div>
                        <div className={styles.workflowCard} style={{
                            padding: '20px',
                            transition: 'all 0.5s ease',
                            border: (demoLength >= 8) ? '1px solid rgba(16, 185, 129, 0.4)' : '',
                            boxShadow: (demoLength >= 8) ? '0 0 20px rgba(16, 185, 129, 0.15)' : ''
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <h4 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '15px' }}>Medications (Rx)</h4>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: demoLength > 7 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                                {hasLiveMicData ? (
                                    <span style={{ fontStyle: 'italic', marginLeft: '-20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>🔬 Awaiting ML Model API</span>
                                ) : demoLength > 7 ? (
                                    <>
                                        <li>Sumatriptan 50mg (PRN / Zaroorat padne par)</li>
                                    </>
                                ) : (
                                    <span style={{ fontStyle: 'italic', marginLeft: '-20px' }}>Listening for Rx...</span>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
