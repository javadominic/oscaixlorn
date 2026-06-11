'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Shared mock data
const INITIAL_PATIENTS = [
    {
        id: '#40112', name: 'Priya Sharma', age: '34F', time: '10:15 AM', status: 'Transcribing', statusColor: 'warning', diagnosis: 'Migraine with Aura',
        abhaId: '91-1234-5678-9012',
        hpi: 'Patient reports recurring episodes of moderate to severe temporal headaches, often preceded by visual aura (flashing lights). Episodes last 4-6 hours and are associated with photophobia and nausea.',
        safetyFlag: 'Patient has a history of NSAID-induced gastritis. Avoid Naproxen.',
        assessment: ['Acute Migraine without aura (G43.009)', 'Prescribe Sumatriptan 50mg PRN for acute attacks.', 'Advise on trigger avoidance (caffeine, sleep hygiene).'],
        isLinked: true
    },
    {
        id: '#40113', name: 'Raj Kumar', age: '52M', time: '11:00 AM', status: 'Reviewing', statusColor: 'info', diagnosis: 'Hypertension',
        abhaId: '91-9876-5432-1098',
        hpi: 'Patient presents for routine follow-up. Reports feeling well, no dizziness or chest pain. Taking Losartan 50mg daily as prescribed.',
        safetyFlag: null,
        assessment: ['Essential Hypertension (I10)', 'Continue Losartan 50mg daily.', 'Diet and lifestyle modifications discussed.'],
        isLinked: true
    },
    {
        id: '#40114', name: 'Sneha Gupta', age: '28F', time: '11:45 AM', status: 'Generated', statusColor: 'success', diagnosis: 'Lower Back Pain',
        abhaId: '91-5555-7777-3333',
        hpi: 'Patient experienced sudden onset lower back pain after lifting heavy boxes yesterday. Pain radiates slightly to the right buttock but not down the leg.',
        safetyFlag: 'Pregnancy Category Warning: Avoid strong NSAIDs or Opioids if planning pregnancy.',
        assessment: ['Acute musculoskeletal back pain (M54.5)', 'Rest and gentle stretching.', 'Acetaminophen 500mg PRN for pain.'],
        isLinked: true
    }
];

const INITIAL_TRANSCRIPTS: Record<string, any[]> = {
    '#40112': [],
    '#40113': [],
    '#40114': []
};

type GlobalStateContextType = {
    patients: any[];
    setPatients: React.Dispatch<React.SetStateAction<any[]>>;
    transcripts: Record<string, any[]>;
    setTranscripts: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
    activePatientId: string;
    setActivePatientId: React.Dispatch<React.SetStateAction<string>>;
    clinicDetails: any;
    setClinicDetails: React.Dispatch<React.SetStateAction<any>>;
    pharmacyAlerts: string[];
    setPharmacyAlerts: React.Dispatch<React.SetStateAction<string[]>>;
    addPatient: (patient: any) => void;
    addTranscriptRecord: (patientId: string, entry: any) => void;
};

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export function GlobalStateProvider({ children }: { children: ReactNode }) {
    const [patients, setPatients] = useState(INITIAL_PATIENTS);
    const [transcripts, setTranscripts] = useState(INITIAL_TRANSCRIPTS);
    const [activePatientId, setActivePatientId] = useState(INITIAL_PATIENTS[0].id);

    // Clinic Details configuration
    const [clinicDetails, setClinicDetails] = useState({
        name: 'MediScribe Clinic',
        doctor: 'Dr. Rajesh Sharma, MD (Internal Medicine)',
        registration: 'Reg No: KMC-89213',
        address: '123 Health Ave, Medical District, Mumbai 400001',
        mobile: '+91 98765 43210',
        timings: 'Mon-Sat: 09:00 AM - 08:00 PM',
        logo: '',
    });

    // Pharmacy Alerts (Internal Inventory Notes)
    const [pharmacyAlerts, setPharmacyAlerts] = useState<string[]>([
        'Out of Stock: Paracetamol 500mg (Use 650mg if needed)',
        'Low Stock: Amoxicillin syrup for pediatrics'
    ]);

    const addPatient = (patient: any) => {
        setPatients(prev => [patient, ...prev]);
        setTranscripts(prev => ({ ...prev, [patient.id]: [] }));
    };

    const addTranscriptRecord = (patientId: string, entry: any) => {
        setTranscripts(prev => {
            const currentList = prev[patientId] || [];
            return {
                ...prev,
                [patientId]: [...currentList, entry]
            };
        });
    };

    return (
        <GlobalStateContext.Provider value={{
            patients, setPatients,
            transcripts, setTranscripts,
            activePatientId, setActivePatientId,
            clinicDetails, setClinicDetails,
            pharmacyAlerts, setPharmacyAlerts,
            addPatient, addTranscriptRecord
        }}>
            {children}
        </GlobalStateContext.Provider>
    );
}

export function useGlobalState() {
    const context = useContext(GlobalStateContext);
    if (context === undefined) {
        throw new Error('useGlobalState must be used within a GlobalStateProvider');
    }
    return context;
}
