import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function SyncManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const checkPending = () => {
    const offlineRoutes = JSON.parse(localStorage.getItem('offline_routes') || '[]');
    setPendingCount(offlineRoutes.length);
  };

  useEffect(() => {
    checkPending();
    
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      syncOfflineData();
    }

    window.addEventListener('storage', checkPending);
    window.addEventListener('offline_routes_updated', checkPending);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', checkPending);
      window.removeEventListener('offline_routes_updated', checkPending);
    };
  }, []);

  const syncOfflineData = async () => {
    const offlineRoutes = JSON.parse(localStorage.getItem('offline_routes') || '[]');
    if (offlineRoutes.length === 0) return;

    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const routesToInsert = offlineRoutes.map((r: any) => {
        const { id, isOffline, created_at, ...rest } = r;
        return { ...rest, user_id: user.id };
      });

      const { error } = await supabase.from('routes').insert(routesToInsert);
      
      if (error) throw error;

      localStorage.removeItem('offline_routes');
      setPendingCount(0);
      window.dispatchEvent(new Event('offline_routes_updated'));
      window.dispatchEvent(new Event('routes_synced'));
      
    } catch (error) {
      console.error('Error syncing offline routes:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 flex items-center justify-center gap-2 z-50 shadow-lg">
        <WifiOff size={12} />
        Modo Offline {pendingCount > 0 && `(${pendingCount} pendentes)`}
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 flex items-center justify-center gap-2 z-50 shadow-lg">
        <RefreshCw size={12} className="animate-spin" />
        Sincronizando dados...
      </div>
    );
  }

  return null;
}
