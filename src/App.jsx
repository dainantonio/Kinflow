import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { 
  Settings, Home, CheckSquare, Calendar as CalendarIcon, CalendarDays,
  ChefHat, Gift, Trophy, X, Plus, Bell, ChevronRight, Clock,
  MapPin, Send, User, Check, Utensils, Star, Flame, Zap,
  MoreVertical, Users, BellRing, CreditCard, LogOut,
  ShoppingCart, Loader2, Hourglass, ArrowRight,
  Layers, Wand2, Smartphone, Film, Ticket,
  MessageCircle, Smile, Image as ImageIcon, Camera, Trash2, ChevronLeft, UserCircle, BadgeCheck
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, OAuthProvider, signInWithRedirect, getRedirectResult, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION using VITE env vars ---
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const hasEnvConfig = Object.values(envConfig).every(Boolean);
const DEMO_MODE = !hasEnvConfig;
let _fbApp = null, auth = null, db = null;
if (!DEMO_MODE) {
  try {
    _fbApp = initializeApp(envConfig);
    auth = getAuth(_fbApp);
    db = getFirestore(_fbApp);
  } catch (e) { console.warn('Firebase init failed:', e); }
}
const appId = 'kinflow-family';

// --- GEMINI API HELPER ---
const fetchWithRetry = async (url, options, retries = 5) => {
  let delay = 1000;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

// --- THEME CONTEXT ---
const ThemeContext = createContext({ isChild: false, user: null });

// --- SCROLL REVEAL HOOK ---
const useScrollReveal = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add('revealed');
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); observer.disconnect(); } },
      { threshold: 0, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
};

const RevealCard = ({ children, delay = 0 }) => {
  const ref = useScrollReveal();
  return <div ref={ref} className="scroll-reveal animate-in" style={{transitionDelay:`${delay}ms`}}>{children}</div>;
};
