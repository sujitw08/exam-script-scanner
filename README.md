# 📱 ScriptScan Pro - Mobile Exam Script Scanner & Laptop Excel Sync Hub

A high-performance mobile application and desktop companion hub designed for faculty and examiners to scan student exam answer scripts, organize marks by Register Number, support **CAT1, CAT2, CAT3**, handle blurry script photos with an interactive manual correction modal, and synchronize live with a laptop for Excel marksheets.

---

## 🌟 Key Features

1. **Answer Script Scanner (Mobile Camera)**:
   - Live camera viewfinder with document corner framing guides, flashlight/torch toggle, and flip camera.
   - Batch photo upload from phone storage / gallery.
   - Includes a one-click **"Try Sample Answer Script"** feature for testing without paper.

2. **Hybrid OCR Engine**:
   - **Google Gemini 2.0 Flash Vision**: High-precision recognition for cursive or messy handwritten Register Numbers, Question-wise marks grids, and totals.
   - **Tesseract.js (Offline Fallback)**: Runs 100% locally in-browser without requiring an internet connection or API key.

3. **Smart Blurry Image & Low-Confidence Fallback**:
   - Analyzes Laplacian variance on the canvas to detect blur and poor lighting.
   - Automatically highlights unclear fields in amber/red and launches the **Side-by-Side Manual Review Modal**.
   - Zoom (+/-), rotate (90°), and B&W high-contrast filter to inspect handwriting details.
   - **Dynamic Total Recalculator**: Automatically sums question marks in real-time as you type.

4. **Exam Categorization & Dynamic Excel Templates**:
   - Built-in presets for **CAT 1 (50m)**, **CAT 2 (50m)**, and **CAT 3 / Model Exam (100m)**.
   - **Upload College Excel Template (.xlsx)**: Automatically reads column headers and pre-existing student rosters.
   - **Paste Text Template**: Accepts comma or tab-delimited schemas (e.g. `RegNo, Name, Q1(2m), Q2(2m), Q3(2m), ..., Total`).

5. **Live Laptop Synchronization Bridge**:
   - Connect phone and laptop on the same Wi-Fi.
   - Scan the on-screen **QR Code** on your phone to open the Scanner.
   - Every script captured on your phone streams immediately to the laptop spreadsheet view in real-time.
   - Inline cell editing, sort by Register No or Total, class statistics (Average, Highest, Lowest, Pass Rate).
   - One-click **Export to Excel (`.xlsx`)** with formatted headers and summary statistics.

6. **Capacitor Android APK Ready**:
   - Configured with `capacitor.config.json` for building standalone native Android `.apk`.

---

## 🚀 Quick Start Guide

### 1. Launch the Application
The app runs with both the frontend dev server and the backend sync bridge:
```bash
cd exam-script-scanner
npm start
```
- **Laptop Dashboard**: `http://localhost:5173`
- **Companion Sync Bridge**: `http://<your-laptop-ip>:3001`
- **Mobile Access URL**: `http://<your-laptop-ip>:5173`

### 2. Connect Mobile Phone to Laptop
1. Click the **"Connect Laptop" / "Laptop Live"** pill in the top header.
2. A QR Code and Local Wi-Fi URL will appear.
3. Open your mobile phone camera or browser and scan the QR code.
4. Now, both devices are paired via WebSockets!

### 3. Scanning & Manual Correction
1. In the **Scanner View**, point the camera at the student answer sheet front page.
2. Tap the shutter button or click **"Try Sample Answer Script"**.
3. If handwriting is clear, marks are extracted and auto-saved to the marksheet.
4. If image clarity is low or handwriting is ambiguous, the **Manual Correction Modal** will open automatically:
   - Inspect the zoomed script on the left.
   - Type or adjust marks on the right.
   - Total marks will recalculate dynamically.
   - Tap **"Save to Excel Table"**.

### 4. Exporting the Excel Marksheet
1. Switch to the **"Excel Sheet"** tab.
2. Review class statistics, sort by Register No or Total.
3. Click **"Export to Excel (.xlsx)"** to download the official marksheet file.

---

## 🛠️ Standalone Android APK Build (Capacitor)

To compile into a standalone Android APK:
```bash
npm run build
npx cap add android
npx cap copy
npx cap open android
```
This opens Android Studio where you can click **Build > Build APK**.
