# Deployment Guide

## Prerequisites
- Node.js 20+
- npm 10+
- Vercel account (for `deploy-vercel.yml` workflow)

## 1) Configure environment variables
Create `.env` from `.env.example` and set:
- `VITE_FIREBASE_*`
- `VITE_GEMINI_API_KEY`

## 2) Local verification
```bash
npm install
npm run setup:check
npm run build
```

## 3) Deploy with Vercel
1. Import repo into Vercel.
2. Add required env variables in Vercel Project Settings.
3. Add GitHub repository secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. Push to `main` to trigger `.github/workflows/deploy-vercel.yml`.

## 4) Optional GitHub Pages
If using existing Pages workflow, keep `.github/workflows/deploy.yml` and configure Pages in repo settings.
