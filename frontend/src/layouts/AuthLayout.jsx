import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-theme-global flex items-center justify-center p-4 relative overflow-hidden">
      {/* Page Background Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-[#1B365D]/30 blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-10 w-[600px] h-[600px] rounded-full bg-indigo-500/10 dark:bg-[#C5A059]/18 blur-[150px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(rgba(0,0,0,0.1)_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(rgba(255,255,255,0.05)_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
      </div>

      <div className="w-full max-w-md relative z-10 bg-theme-card backdrop-blur-md border border-theme-border rounded-3xl p-6 sm:p-8 shadow-theme">
        {/* Platform Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 dark:from-[#1B365D] dark:to-[#C5A059] flex items-center justify-center dark:text-[#060B16] shadow-md dark:shadow-xl dark:shadow-[#1B365D]/30 font-black text-2xl">
              AI
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-extrabold text-theme-primary leading-tight">
                Coaching<span className="text-brand-500">.ai</span>
              </h1>
              <p className="text-xs text-theme-secondary">AI-Powered Learning Platform</p>
            </div>
          </div>
          <p className="text-xs text-theme-secondary mt-1">
            🤖 Get answers graded by Gemini AI • 🏆 Earn badges • 📹 Live classes
          </p>
        </div>

        <Outlet />

        <p className="text-center text-[11px] text-theme-secondary mt-6">
          © 2026 Coaching.ai — All rights reserved
        </p>
      </div>
    </div>
  );
};
