import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animated Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Platform Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 font-black text-2xl">
              AI
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-extrabold text-white leading-tight">
                Coaching<span className="text-brand-500">.ai</span>
              </h1>
              <p className="text-xs text-slate-400">AI-Powered Learning Platform</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            🤖 Get answers graded by Gemini AI • 🏆 Earn badges • 📹 Live classes
          </p>
        </div>

        <Outlet />

        <p className="text-center text-[11px] text-slate-600 mt-6">
          © 2026 Coaching.ai — All rights reserved
        </p>
      </div>
    </div>
  );
};
