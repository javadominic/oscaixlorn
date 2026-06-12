# ☤ MediScribe — AI Medical Scribe for Indian Healthcare

<div align="center">

**The AI co-pilot that listens to your doctor speak Hinglish — and writes the EMR for you.**

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-blue?logo=google)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![ABDM](https://img.shields.io/badge/ABDM-Compliant-green)
![Hackathon](https://img.shields.io/badge/Built_at-Hackathon-orange)

</div>

---

## 🎯 What is MediScribe?

Indian doctors spend **2-3 hours every day** writing notes instead of treating patients.

MediScribe is a real-time AI medical scribe that **listens to the doctor-patient conversation**, understands Hinglish, and **auto-fills the Electronic Medical Record** — ICD-10 codes, medications, safety flags, and all — before the doctor even picks up a pen.

> 💬 *"Doctor, sir mujhe kal se bohot sir dard ho raha hai"* → MediScribe extracts: `Chief Complaint: Headache | ICD-10: R51 | Safety: Check NSAID history`

---

## 🚀 Try the Demo

> **Clone the repo → `npm install` → `npm run dev` → open `http://localhost:3000`**

On the landing page, scroll to the **"How It Works"** section and hit **▶️ Start Demo Now** — no login required. Watch the AI extract clinical data from a live Hinglish consultation in real time.

To explore the full dashboards:

| Role | Login Path | Mock OTP |
|---|---|---|
| 🩺 Doctor | `/login/doctor` | — |
| 🗂️ Receptionist | `/login/receptionist` | `1234` |
| 🏥 Admin | `/login/admin` | — |
| 💊 Pharmacist | `/login/admin` → switch | — |

---

## ✨ Core Features

### 🎙️ Live AI Scribe (The Main Feature)
The doctor talks. MediScribe listens and fills the EMR — **simultaneously**, in real time.

- **Browser-native Speech-to-Text** (Web Speech API — zero API cost, works offline)
- **Dual-speaker transcription** — tags lines as Doctor / Patient automatically
- **Agentic EMR Extraction** panel updating live as words are spoken:
  - Chief Complaint & HPI
  - Provisional Diagnosis + ICD-10 code
  - Clinical Safety Flags (NSAID allergy, pregnancy warnings, drug interactions)
  - Medications & dosage
- Auto-scroll on both transcript and EMR panel

### 🤖 Gemini AI Summarization
When the consultation ends, one click sends the full transcript to **Gemini 2.5 Flash**:
- Returns structured JSON: `complaint`, `diagnosis`, `investigations`, `medications`, `safetyFlags`
- Medical-context prompt with low temperature (0.1) for clinical accuracy
- Secure server-side call via Next.js API route (key never exposed to client)

### 📝 Doctor Review & EMR Sign-off
- Side-by-side: transcript + AI-filled EMR fields
- Doctor edits and signs off before submission
- ABHA ID displayed per patient (ABDM-ready)

### 🗂️ Receptionist Intake
- Patient registration with ABHA ID + mock OTP verification
- Assigns to doctor and adds to live queue

### 💊 Pharmacy & 🏥 Admin
- Pharmacy handover queue with prescribed medications
- Inventory shortage alerts
- Admin: clinic settings, user management, employee list

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router + API Routes) |
| Language | TypeScript |
| AI / LLM | Google Gemini 2.5 Flash |
| Speech-to-Text | Web Speech API (browser native) |
| UI & Animations | React 19 + CSS Modules + Framer Motion |
| State | React Context (GlobalStateContext) |
| Auth | Role-based session (localStorage) |
| Compliance | ABDM / ABHA ID ready |

---

## ⚙️ Local Setup

```bash
# 1. Clone
git clone https://github.com/javadominic/oscaixlorn.git
cd oscaixlorn

# 2. Install
npm install

# 3. Add your Gemini API key (free at aistudio.google.com)
echo "GEMINI_API_KEY=your_key_here" > .env.local

# 4. Run
npm run dev
# → http://localhost:3000
```

---

## 🇮🇳 ABDM / ABHA Compliance

MediScribe is built with ABDM compliance in mind:
- ABHA ID is collected at patient registration and shown across all dashboards
- Patient data is structured for ABDM-compatible records
- **Live ABHA verification API** — we are actively working with government partners on the integration. It takes time for Govt. API access approval; mock IDs work for the demo.

---

## 🔮 What's Next

- [ ] Live ABDM API integration (ABHA verification + NHA sandbox)
- [ ] Hinglish fine-tuned transcription model (custom Whisper)
- [ ] Real OTP via Indian SMS gateway
- [ ] Digitally signed PDF prescriptions
- [ ] HL7 FHIR export for EHR interoperability
- [ ] Multi-clinic SaaS mode
- [ ] React Native mobile app for doctors

---

## 🏗️ Project Structure (Quick Reference)

```
src/app/
├── page.tsx              # Marketing landing page
├── login/                # Role-based login (doctor / receptionist / admin)
├── api/summarize/        # Gemini API route (server-side)
└── dashboard/
    ├── scribe/           ← MAIN FEATURE: Live AI scribe
    ├── review/           ← Doctor EMR review & sign-off
    ├── patients/         ← Receptionist intake form
    ├── reception-queue/  ← Today's patient queue
    ├── alerts/           ← Inventory notices
    ├── handover/         ← Pharmacy queue
    └── admin/            ← Clinic & user management
```

---

## 👥 Team


| Name | Role |
|---|---|
| **Saeed Ansari** | Full Stack & AI Integration & Ideatiion|
| **Madhu Tiwari** |Full Stack & Backend  |
| **Priyanshu Pratik** | Full Stack & UI/UX |

---

*MediScribe — Because doctors should be talking to patients, not filling forms.*
