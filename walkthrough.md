# Gemini Quiz Platform Walkthrough

This document explains how to run and deploy the Gemini Quiz Platform.

## Features Implemented
*   **Teacher Portal**: Login, Create Quiz (with AI mock), Dashboard, Game Lobby, Live Leaderboard, Results.
*   **Student Portal**: Join with PIN, Enter Name, Lobby, Real-time Game (Mario).
*   **Game Engine**: Ported "Super Mario Country Quiz" to Next.js component with real-time score syncing.
*   **Infrastructure**: Next.js 14, Tailwind CSS, Firebase (Auth, Firestore).

## Prerequisites
1.  **Node.js**: Ensure Node.js is installed.
2.  **Firebase Project**: You need a Firebase project with Authentication (Google) and Firestore enabled.

## Setup Instructions

### 1. Configure Environment Variables
Rename `.env.example` to `.env.local` and fill in your Firebase details:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your keys from Firebase Console -> Project Settings.

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Deployment (Firebase App Hosting)

1.  **Initialize Firebase**:
    ```bash
    firebase login
    firebase init hosting
    ```
    *   Select "Use an existing project".
    *   Select "Web Frameworks (experimental)" if prompted, or just standard hosting.
    *   If standard hosting, set public directory to `out` (if using static export) or use **Firebase App Hosting** for dynamic Next.js.

2.  **Deploy**:
    ```bash
    firebase deploy
    ```

## Verification Results
*   **Build Check**: Passed (`npm run build`).
*   **Type Safety**: Verified with TypeScript.
*   **Component Logic**: Ported and adapted for Next.js Client Components.

## Next Steps
*   **Gemini API**: Replace the mock generation in `app/teacher/create-quiz/page.tsx` with actual API call once you have the key.
*   **More Games**: Port the other 2 sample games using the same pattern as `MarioGame.tsx`.
