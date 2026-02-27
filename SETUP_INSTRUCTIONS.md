# Setup Instructions

## Step 1: Install dependencies
```bash
npm install
```

## Step 2: Configure env
```bash
cp .env.example .env
```
Fill Firebase + Gemini values.

### Firebase values (provided)
- `VITE_FIREBASE_API_KEY=AIzaSyBaWdluvfxqaW6XRxCkpA6gRvo7g02xsko`
- `VITE_FIREBASE_AUTH_DOMAIN=kinflow-1629b.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID=kinflow-1629b`
- `VITE_FIREBASE_STORAGE_BUCKET=kinflow-1629b.firebasestorage.app`
- `VITE_FIREBASE_MESSAGING_SENDER_ID=447158788158`
- `VITE_FIREBASE_APP_ID=1:447158788158:web:c7034e895ca7ac55f3b16f`

## Step 3: Validate config quickly
```bash
npm run setup:check
```

## Step 4: Run locally
```bash
npm run dev
```

## Step 5: Build verification
```bash
npm run build
```
