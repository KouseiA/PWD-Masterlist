# PWD Masterlist System

A desktop application designed for the City Government of Meycauayan Persons with Disability Affairs Office (PDAO) to manage, track, and generate records and analytics for Persons with Disabilities (PWD).

---

## 🚀 Features

- **Masterlist Management**: Search, register, update, and manage PWD records.
- **Data Analytics & Reports**: Visual dashboards and demographic breakdowns by barangay, disability type, age, and status.
- **Export & Document Generation**: Print and export official reports and masterlists to Excel and PDF formats.
- **OCR / Document Scanning Support**: Integrated Tesseract OCR and Google Generative AI capabilities for digitizing records.
- **Offline & Desktop First**: Embedded SQLite database (`better-sqlite3`) and portable standalone Electron packaging.

---

## 🛠️ Tech Stack

- **Desktop Framework**: Electron
- **Frontend**: React 18, Vite, Tailwind CSS, Tabler Icons, Lucide Icons, Recharts, Anime.js
- **Backend**: Node.js, Express, Helmet, CORS
- **Database**: SQLite with `better-sqlite3`

---

## 💻 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/KouseiA/PWD-Masterlist.git
   cd PWD-Masterlist
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running in Development

Start both the backend server and Vite frontend concurrently:
```bash
npm run dev
```

To run the Electron desktop app in development:
```bash
npx electron .
```

### Building & Packaging

- **Build frontend**:
  ```bash
  npm run build
  ```
- **Package portable Windows app**:
  ```bash
  npm run dist
  ```
- **Build NSIS Windows installer**:
  ```bash
  npm run dist:builder
  ```

---

## 📄 License

Internal use for Meycauayan City PWD Office.