import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calculator, LayoutDashboard, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SyncManager from './SyncManager';

export default function Layout({ children }: { children: React.ReactNode }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      <SyncManager />
      {children}
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#000000]/80 backdrop-blur-xl border-t border-zinc-900 pb-safe pt-2 px-6 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center pb-4">
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex flex-col items-center gap-1 p-2 transition-colors ${isActive ? 'text-[#ee4d2d]' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Calculator size={24} />
            <span className="text-[10px] font-medium">Calculadora</span>
          </NavLink>
          
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `flex flex-col items-center gap-1 p-2 transition-colors ${isActive ? 'text-[#ee4d2d]' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-medium">Dashboard</span>
          </NavLink>

          <button 
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <LogOut size={24} />
            <span className="text-[10px] font-medium">Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}
