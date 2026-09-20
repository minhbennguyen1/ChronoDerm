# ChronoDerm 🔬

> **Clinical Skin Time-Machine & AI Dermatological Diagnostics Platform**  
> An enterprise-grade, dual-portal web application connecting patients and dermatologists through longitudinal lesion tracking, computer vision difference analysis, real-time vitals extraction, and nationwide clinical network access.

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](#)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](#)
[![React 18](https://img.shields.io/badge/Framework-React%2018-cyan.svg)](#)
[![Google Gemini](https://img.shields.io/badge/AI%20Model-Gemini%202.5%20Flash-violet.svg)](#)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-sky.svg)](#)

---

## 🌟 Key Capabilities

### 1. 🕒 Longitudinal 3D "Time-Machine" & Timeline Inspection
* **Chronological Skin Tracking:** Organize patient skin records into an interactive time-series timeline.
* **Dual-Photo Difference Analysis:** Compare baseline and follow-up clinical imagery with automated delta calculation across erythema, lesion border clearance, and surface area.
* **Healing Trajectory & PASI Metrics:** Tracks Psoriasis Area & Severity Index (PASI), induration, scaling, and recovery velocity over days, weeks, or months.

### 2. 🤖 Multimodal AI Clinical Analysis (Gemini 2.5 Flash)
* **Single-Photo Lesion Analysis:** Deep inspection of macroscopic dermatological imagery with granular sub-scores (0–100%) for erythema, induration, and scaling.
* **Differential Diagnoses:** Confident diagnosis estimations (e.g., Plaque Psoriasis, Atopic Dermatitis, Contact Dermatitis, Seborrheic Dermatitis).
* **ABCDE Melanoma Screening:** Automated screening for Asymmetry, Border Irregularity, Color Variation, Diameter (>6mm), and Evolution.
* **Interactive Teledermatology Chatbot:** Multi-turn conversational triage grounded in American Academy of Dermatology (AAD) clinical guidelines.

### 3. 🩺 Dual-Portal Experience (Patient & HCP)
* **Patient Portal:**
  * Interactive camera capture with live alignment overlay.
  * Direct appointment booking (Urgent Virtual Visit, Scheduled Telehealth, In-Clinic Exam, 24hr Async Review).
  * Synchronized patient schedule calendar with date auto-focus.
  * Presage contactless vitals analysis (Heart Rate, HRV, Respiratory Rate via camera PPG).
* **HCP (Healthcare Provider) Portal:**
  * Longitudinal dataset viewer across multi-patient cohorts.
  * Clinical directive banner and priority triage alerts.
  * One-click appointment recommendation engine with direct dispatch to patient portal.
  * Integrated Impiricus copay savings card database for biologic and specialty therapies (Skyrizi, Dupixent, Tremfya, Cosentyx).

### 4. 🗺️ Nationwide U.S. Dermatology Clinic Locator
* **Interactive U.S. Map:** Real latitude/longitude coordinate projection with state filtering and Haversine distance-radius calculations.
* **50+ Verified Academic & Private Practices:** Includes direct telephone lines, address coordinates, telehealth tags, and walk-in statuses.
* **Doctor-to-Clinic Network:** Explore affiliated clinical practices for attending dermatologists with direct 1-click booking.

---

## 🏗️ Technical Architecture

```
                               ┌─────────────────────────┐
                               │       Client (React)    │
                               │  TypeScript, Tailwind   │
                               └────────────┬────────────┘
                                            │ HTTP / JSON
                                            ▼
                               ┌─────────────────────────┐
                               │   Express.js Backend    │
                               │        (Port 3000)      │
                               └───────┬──────────┬──────┘
                                       │          │
                     ┌─────────────────┘          └────────────────┐
                     ▼                                             ▼
        ┌─────────────────────────┐                   ┌─────────────────────────┐
        │   Google Gen AI SDK     │                   │  Local Persistence &    │
        │   (Gemini 2.5 Flash)    │                   │   In-Memory Datasets    │
        │  /api/gemini/analyze    │                   │  • Cases & Timelines    │
        │  /api/gemini/difference │                   │  • Appointments & Notes │
        │  /api/gemini/chat       │                   │  • Copay Cards / Biologics
        └─────────────────────────┘                   └─────────────────────────┘
```

### Stack Highlights:
* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React, HTML5 Canvas API.
* **Backend:** Express.js, Node.js (bundled to CommonJS via `esbuild` for zero-dependency Cloud Run hosting).
* **AI Engine:** Google Gen AI SDK (`@google/genai`) using `gemini-2.5-flash`.
* **Security:** Server-side API key isolation (`GEMINI_API_KEY` is never exposed to client browsers).

---

## 🚀 Getting Started

### Prerequisites
* **Node.js:** v18+ or v20+ recommended
* **npm:** v9+ or v10+
* **Gemini API Key:** Obtainable from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/chronoderm.git
   cd chronoderm
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:3000`.

---

## 📦 Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express + Vite development server with TypeScript execution (`tsx`) on port 3000. |
| `npm run build` | Compiles the client-side SPA (`dist/`) and bundles the server into `dist/server.cjs` via `esbuild`. |
| `npm run start` | Boots the compiled production server (`node dist/server.cjs`). |
| `npm run lint` | Runs the TypeScript compiler check (`tsc --noEmit`) to ensure type safety. |

---

## 🛡️ Clinical Disclaimer

ChronoDerm is an informational and research teledermatology platform designed to support clinical triage and longitudinal tracking. AI-generated diagnostic scores, differential diagnoses, and comparative metrics do not constitute definitive medical advice. Clinical decisions and prescriptions should always be confirmed by a board-certified dermatologist or licensed medical practitioner.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
