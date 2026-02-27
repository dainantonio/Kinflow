#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const requiredEnv = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_GEMINI_API_KEY'
];

const root = process.cwd();
const envPath = path.join(root, '.env');
const hasEnv = fs.existsSync(envPath);

let envMap = {};
if (hasEnv) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim();
    envMap[k] = v;
  }
}

const mergedEnv = { ...process.env, ...envMap };
const missing = requiredEnv.filter((key) => !mergedEnv[key]);
const requiredFiles = [
  'manifest.json',
  'public/sw.js',
  'src/registerServiceWorker.ts',
  'LICENSE',
  'PRIVACY.md'
];
const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));

if (!hasEnv && requiredEnv.some((key) => !process.env[key])) {
  console.error('❌ .env not found and required env vars are not present in process environment.');
}
if (missing.length) {
  console.error(`❌ Missing env vars: ${missing.join(', ')}`);
}
if (missingFiles.length) {
  console.error(`❌ Missing required files: ${missingFiles.join(', ')}`);
}

if (missing.length || missingFiles.length || (!hasEnv && requiredEnv.some((key) => !process.env[key]))) {
  process.exit(1);
}

console.log('✅ Setup check passed. Configuration files and required env vars are present.');
