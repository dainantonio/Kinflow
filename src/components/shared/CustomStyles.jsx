import React from 'react';

export const CustomStyles = () => (
  <style>
    {`
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      @keyframes springPress {
        0% { transform: scale(1); }
        40% { transform: scale(0.93); }
        70% { transform: scale(1.04); }
        100% { transform: scale(1); }
      }
      @keyframes bounceIn {
        0% { transform: translateY(12px) scale(0.96); opacity: 0; }
        60% { transform: translateY(-4px) scale(1.02); opacity: 1; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes navBounce {
        0% { transform: translateY(0) scale(1); }
        30% { transform: translateY(-7px) scale(1.18); }
        55% { transform: translateY(2px) scale(0.95); }
        75% { transform: translateY(-3px) scale(1.07); }
        100% { transform: translateY(0) scale(1); }
      }
      @keyframes shimmer {
        from { background-position: -200% center; }
        to { background-position: 200% center; }
      }
      @keyframes pulseRing {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(2.4); opacity: 0; }
      }
      @keyframes countUp {
        from { transform: translateY(8px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
      }
      @keyframes popIn {
        0% { transform: scale(0.92); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes confetti-fall {
        0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(120px) rotate(360deg); opacity: 0; }
      }
      @keyframes pulse-slow {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }

      .animate-bounce-in { animation: bounceIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .animate-slide-up { animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .animate-fade-in { animation: fadeIn 0.3s ease forwards; }
      .animate-nav-bounce { animation: navBounce 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .animate-float { animation: float 4s ease-in-out infinite; }
      .animate-count-up { animation: countUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }

      .spring-press {
        transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .spring-press:active { transform: scale(0.93); }

      .scroll-reveal { opacity: 1; transform: translateY(0); transition: opacity 0.4s ease, transform 0.4s ease; }
      .scroll-reveal.animate-in { opacity: 0; transform: translateY(8px); }
      .scroll-reveal.animate-in.revealed { opacity: 1; transform: translateY(0); }
      /* Ensure content always appears even if JS is delayed */
      @media (prefers-reduced-motion: reduce) {
        .scroll-reveal, .scroll-reveal.animate-in { opacity: 1 !important; transform: none !important; transition: none !important; }
      }

      .pb-safe { padding-bottom: max(env(safe-area-inset-bottom, 16px), 16px); }
      .pt-safe { padding-top: max(env(safe-area-inset-top, 0px), 0px); }
      /* Dynamic viewport + overscroll fix */
      html, body { overscroll-behavior: none; overflow: hidden; height: 100dvh; }
      #root { height: 100dvh; overflow: hidden; }

      /* Native-feel scroll */
      .scroll-container {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-y: contain;
        scroll-behavior: smooth;
      }

      .shimmer-bg {
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% auto;
        animation: shimmer 1.4s linear infinite;
      }
    `}
  </style>
);
