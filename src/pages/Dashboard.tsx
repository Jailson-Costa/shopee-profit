import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Calendar, Route, DollarSign, Loader2, PieChart as PieChartIcon, Trash2, Pencil, X, Save, Fuel, Car, Wrench } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type RouteData = {
  id: string;
  route_date: string;
  route_value: number;
  km_total: number;
  gas_price: number;
  consumption: number;
  wear_cost_per_km: number;
  real_profit: number;
  created_at: string;
};

export default function Dashboard() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [stats, setStats] = useState({
    totalProfit: 0,
    totalKm: 0,
    totalRevenue: 0,
    routeCount: 0
  });

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, [selectedMonth]);

  const handleDeleteRoute = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta rota?')) return;
    
    setIsDeleting(id);
    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRoutes(routes.filter(r => r.id !== id));
      // Refresh stats
      fetchRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Erro ao excluir rota.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUpdateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;

    try {
      // Recalculate values based on the edited inputs
      const val = typeof editingRoute.route_value === 'string' ? parseFloat(editingRoute.route_value) : editingRoute.route_value;
      const km = typeof editingRoute.km_total === 'string' ? parseFloat(editingRoute.km_total) : editingRoute.km_total;
      const gas = editingRoute.gas_price;
      const cons = editingRoute.consumption;
      const wear = editingRoute.wear_cost_per_km;

      const gasCost = (km / cons) * gas;
      const wearCost = km * wear;
      const realProfit = val - gasCost - wearCost;
      const profitPerKm = km > 0 ? realProfit / km : 0;

      const { error } = await supabase
        .from('routes')
        .update({
          route_date: editingRoute.route_date,
          route_value: val,
          km_total: km,
          gas_cost: gasCost,
          wear_cost: wearCost,
          real_profit: realProfit,
          profit_per_km: profitPerKm
        })
        .eq('id', editingRoute.id);

      if (error) throw error;

      setEditingRoute(null);
      fetchRoutes();
      alert('Rota atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating route:', error);
      alert('Erro ao atualizar rota.');
    }
  };

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [year, month] = selectedMonth.split('-');
      // Start and end dates for the selected month
      const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

      let allRoutes: RouteData[] = [];

      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('routes')
          .select('*')
          .eq('user_id', user.id)
          .gte('route_date', startDate)
          .lte('route_date', endDate)
          .order('route_date', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) allRoutes = data;
      }

      // Add offline routes
      const offlineRoutesStr = localStorage.getItem('offline_routes');
      if (offlineRoutesStr) {
        const offlineRoutes = JSON.parse(offlineRoutesStr);
        // Filter offline routes by selected month
        const filteredOffline = offlineRoutes.filter((r: any) => {
          return r.route_date >= startDate && r.route_date <= endDate;
        });
        allRoutes = [...filteredOffline, ...allRoutes];
        
        // Sort combined routes
        allRoutes.sort((a, b) => {
          if (a.route_date !== b.route_date) {
            return new Date(b.route_date).getTime() - new Date(a.route_date).getTime();
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }

      setRoutes(allRoutes);
      
      // Calculate stats
      const totalProfit = allRoutes.reduce((acc, curr) => acc + Number(curr.real_profit), 0);
      const totalKm = allRoutes.reduce((acc, curr) => acc + Number(curr.km_total), 0);
      const totalRevenue = allRoutes.reduce((acc, curr) => acc + Number(curr.route_value), 0);
      
      setStats({
        totalProfit,
        totalKm,
        totalRevenue,
        routeCount: allRoutes.length
      });
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleSync = () => {
      fetchRoutes();
    };
    window.addEventListener('routes_synced', handleSync);
    window.addEventListener('offline_routes_updated', handleSync);
    return () => {
      window.removeEventListener('routes_synced', handleSync);
      window.removeEventListener('offline_routes_updated', handleSync);
    };
  }, [selectedMonth]);

  const chartData = [
    { name: 'Lucro Líquido', value: Math.max(0, stats.totalProfit), color: '#10b981' },
    { name: 'Custos (Gasolina + Desgaste)', value: Math.max(0, stats.totalRevenue - stats.totalProfit), color: '#f59e0b' },
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 font-sans pb-24 selection:bg-[#ee4d2d]/30">
      <div className="max-w-md mx-auto relative">
        {/* Header */}
        <div className="pt-12 pb-6 px-6 sticky top-0 bg-[#000000]/80 backdrop-blur-xl z-10 border-b border-zinc-900 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              Dashboard
            </h1>
            <p className="text-zinc-400 text-sm mt-2 font-medium capitalize flex items-center gap-1.5">
              <Calendar size={14} />
              Resumo Mensal
            </p>
          </div>
          
          {/* Month Picker */}
          <div className="relative">
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[#1c1c1e] border border-zinc-800 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-[#ee4d2d] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-[#ee4d2d] animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Main Stat Card */}
            <div className="bg-gradient-to-br from-[#1c1c1e] to-[#141415] rounded-[2rem] p-6 border border-zinc-800/50 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <DollarSign size={80} />
              </div>
              
              <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest mb-2 block">Lucro Real do Mês</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">R$ {stats.totalProfit.toFixed(2)}</span>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Rotas Feitas</span>
                  <span className="text-lg font-bold text-zinc-200">{stats.routeCount}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block mb-1">KM Rodado</span>
                  <span className="text-lg font-bold text-zinc-200">{stats.totalKm.toFixed(1)} km</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            {stats.totalRevenue > 0 && (
              <div className="bg-[#1c1c1e] rounded-[2rem] p-6 border border-zinc-800/50">
                <h3 className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <PieChartIcon size={14} />
                  Receita vs Custos
                </h3>
                <div className="h-[200px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={8}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                        contentStyle={{ backgroundColor: '#2c2c2e', border: '1px solid #3f3f46', borderRadius: '16px', color: '#fff' }}
                        itemStyle={{ color: '#fff', fontWeight: 600 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Faturamento</span>
                    <span className="text-lg font-bold text-white mt-0.5">R$ {stats.totalRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Routes List */}
            <div>
              <h3 className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest mb-4 pl-2">Histórico de Rotas</h3>
              
              {routes.length === 0 ? (
                <div className="bg-[#1c1c1e] rounded-[2rem] p-8 text-center border border-zinc-800/50">
                  <Route size={32} className="mx-auto text-zinc-600 mb-3" />
                  <p className="text-zinc-400 text-sm">Nenhuma rota registrada neste mês.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {routes.map((route) => {
                    // Fix timezone issue by adding time to the date string
                    const routeDate = new Date(`${route.route_date}T12:00:00`);
                    return (
                      <div key={route.id} className="bg-[#1c1c1e] rounded-3xl p-4 border border-zinc-800/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${route.real_profit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {route.real_profit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            </div>
                            <div>
                              <p className="font-bold text-white">R$ {Number(route.route_value).toFixed(2)}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">{format(routeDate, "dd 'de' MMM", { locale: ptBR })}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${route.real_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {route.real_profit >= 0 ? '+' : ''}R$ {Number(route.real_profit).toFixed(2)}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">{Number(route.km_total).toFixed(1)} km</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-3 border-t border-zinc-800/50">
                          <button 
                            onClick={() => setEditingRoute(route)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-xs font-bold"
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteRoute(route.id)}
                            disabled={isDeleting === route.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/5 text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold disabled:opacity-50"
                          >
                            {isDeleting === route.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingRoute && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#1c1c1e] rounded-[2.5rem] border border-zinc-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Editar Rota</h2>
                <button 
                  onClick={() => setEditingRoute(null)}
                  className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateRoute} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Data da Rota</label>
                  <div className="bg-zinc-900/50 rounded-2xl p-3 flex items-center border border-zinc-800 focus-within:border-[#ee4d2d] transition-colors">
                    <Calendar size={18} className="text-zinc-500 mr-3" />
                    <input 
                      type="date"
                      value={editingRoute.route_date}
                      onChange={(e) => setEditingRoute({...editingRoute, route_date: e.target.value})}
                      className="bg-transparent text-white font-bold w-full focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Valor da Rota (R$)</label>
                  <div className="bg-zinc-900/50 rounded-2xl p-3 flex items-center border border-zinc-800 focus-within:border-[#ee4d2d] transition-colors">
                    <DollarSign size={18} className="text-emerald-400 mr-3" />
                    <input 
                      type="number"
                      step="0.01"
                      value={editingRoute.route_value}
                      onChange={(e) => setEditingRoute({...editingRoute, route_value: e.target.value})}
                      className="bg-transparent text-white font-bold w-full focus:outline-none"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">KM Rodado</label>
                  <div className="bg-zinc-900/50 rounded-2xl p-3 flex items-center border border-zinc-800 focus-within:border-[#ee4d2d] transition-colors">
                    <Route size={18} className="text-blue-400 mr-3" />
                    <input 
                      type="number"
                      step="0.1"
                      value={editingRoute.km_total}
                      onChange={(e) => setEditingRoute({...editingRoute, km_total: e.target.value})}
                      className="bg-transparent text-white font-bold w-full focus:outline-none"
                      placeholder="0.0"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingRoute(null)}
                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-[#ee4d2d] hover:bg-[#ff5733] text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
