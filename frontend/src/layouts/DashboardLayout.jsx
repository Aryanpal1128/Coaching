import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar.jsx';
import { Navbar } from '../components/navigation/Navbar.jsx';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav.jsx';

export const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-theme-global overflow-hidden relative text-theme-primary">
      {/* Global Background Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-[#1B365D]/30 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[600px] h-[600px] rounded-full bg-[#C5A059]/18 blur-[150px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(rgba(255,255,255,0.05)_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
      </div>

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};
