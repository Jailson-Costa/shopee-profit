import React, { useState, useRef, useEffect } from 'react';
import { Calculator, AlertTriangle, CheckCircle2, DollarSign, Route, Fuel, Car, Wrench, ChevronDown, ChevronUp, PieChart as PieChartIcon, Save, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../lib/supabase';

export default function CalculatorPage() {
  const [routeDate, setRouteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [routeValue, setRouteValue] = useState<string>('');
  const [kmTotal, setKmTotal] = useState<string>('');
  const [gasPrice, setGasPrice] = useState<string>('');
  const [consumption, setConsumption] = useState<string>('10');
  const [wearCostPerKm, setWearCostPerKm] = useState<string>('0.40');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  
  const [result, setResult] = useState<{
    gasCost: number;
    wearCost: number;
    realProfit: number;
    profitPerKm: number;
    totalValue: number;
  } | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Load default settings from profile on mount
  useEffect(() => {
    const loadProfileDefaults = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('default_consumption, default_wear_cost, default_gas_price')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          if (data.default_consumption) setConsumption(data.default_consumption.toString());
          if (data.default_wear_cost) setWearCostPerKm(data.default_wear_cost.toString());
          if (data.default_gas_price) setGasPrice(data.default_gas_price.toString());
        }
      }
    };
    loadProfileDefaults();
  }, []);

  const handleSaveDefaults = async () => {
    setIsSavingDefaults(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Você precisa estar logado para salvar as configurações.');
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          default_consumption: parseFloat(consumption),
          default_wear_cost: parseFloat(wearCostPerKm),
          default_gas_price: parseFloat(gasPrice)
        })
        .eq('id', user.id);
        
      if (error) throw error;
      alert('Configurações do veículo salvas como padrão!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar configurações: ' + err.message);
    } finally {
      setIsSavingDefaults(false);
    }
  };

  const calculateProfit = () => {
    const value = parseFloat(routeValue);
    const km = parseFloat(kmTotal);
    const gas = parseFloat(gasPrice);
    const cons = parseFloat(consumption);
    const wearRate = parseFloat(wearCostPerKm);

    if (isNaN(value) || isNaN(km) || isNaN(gas) || isNaN(cons) || isNaN(wearRate) || cons === 0) {
      alert('Por favor, preencha todos os campos corretamente com números.');
      return;
    }

    const gasCost = (km / cons) * gas;
    const wearCost = km * wearRate;
    const realProfit = value - gasCost - wearCost;
    const profitPerKm = km > 0 ? realProfit / km : 0;

    setResult({
      gasCost,
      wearCost,
      realProfit,
      profitPerKm,
      totalValue: value
    });

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSaveRoute = async () => {
    if (!result) return;
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Você precisa estar logado para salvar rotas.');
        return;
      }

      const routeData = {
        route_date: routeDate,
        route_value: parseFloat(routeValue),
        km_total: parseFloat(kmTotal),
        gas_price: parseFloat(gasPrice),
        consumption: parseFloat(consumption),
        wear_cost_per_km: parseFloat(wearCostPerKm),
        gas_cost: result.gasCost,
        wear_cost: result.wearCost,
        real_profit: result.realProfit,
        profit_per_km: result.profitPerKm
      };

      if (!navigator.onLine) {
        // Save offline
        const offlineRoutes = JSON.parse(localStorage.getItem('offline_routes') || '[]');
        offlineRoutes.push({
          ...routeData,
          id: `temp_${Date.now()}`,
          created_at: new Date().toISOString(),
          isOffline: true
        });
        localStorage.setItem('offline_routes', JSON.stringify(offlineRoutes));
        window.dispatchEvent(new Event('offline_routes_updated'));
        alert('Você está offline. Rota salva localmente e será sincronizada quando houver conexão.');
      } else {
        // Save online
        const { error } = await supabase.from('routes').insert({
          ...routeData,
          user_id: user.id
        });

        if (error) throw error;
        alert('Rota salva com sucesso! Você pode vê-la no seu Dashboard.');
      }
      
      // Reset form
      setRouteValue('');
      setKmTotal('');
      setResult(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar rota: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const chartData = result ? [
    { name: 'Lucro Real', value: Math.max(0, result.realProfit), color: '#10b981' }, // Emerald
    { name: 'Gasolina', value: result.gasCost, color: '#f59e0b' }, // Amber
    { name: 'Desgaste', value: result.wearCost, color: '#6366f1' }, // Indigo
  ].filter(item => item.value > 0) : [];

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 font-sans pb-24 selection:bg-[#ee4d2d]/30">
      <div className="max-w-md mx-auto bg-[#000000] min-h-screen relative">
        {/* Header */}
        <div className="pt-12 pb-6 px-6 sticky top-0 bg-[#000000]/80 backdrop-blur-xl z-10 border-b border-zinc-900">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="bg-gradient-to-br from-[#ee4d2d] to-[#ff7337] p-2.5 rounded-2xl shadow-lg shadow-[#ee4d2d]/20">
              <Calculator size={22} className="text-white" />
            </span>
            Shopee Profit
          </h1>
          <p className="text-zinc-400 text-sm mt-2 font-medium">Calculadora de Lucro Real</p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <InputField 
            type="date"
            label="Data da Rota" 
            icon={<CalendarIcon size={20} className="text-purple-400" />} 
            iconBg="bg-purple-400/10"
            value={routeDate} 
            onChange={setRouteDate} 
            placeholder="" 
          />
          <InputField 
            label="Valor da Rota (R$)" 
            icon={<DollarSign size={20} className="text-emerald-400" />} 
            iconBg="bg-emerald-400/10"
            value={routeValue} 
            onChange={setRouteValue} 
            placeholder="0.00" 
          />
          <InputField 
            label="KM Rodado" 
            icon={<Route size={20} className="text-blue-400" />} 
            iconBg="bg-blue-400/10"
            value={kmTotal} 
            onChange={setKmTotal} 
            placeholder="0" 
          />
          
          {/* Advanced Settings Toggle */}
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-4 bg-[#1c1c1e] rounded-3xl text-zinc-300 hover:bg-[#252528] transition-colors border border-transparent hover:border-zinc-800"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-zinc-800/50 rounded-xl">
                <Wrench size={18} className="text-zinc-400" />
              </div>
              <span className="font-medium text-sm">Configurações do Veículo</span>
            </div>
            {showAdvanced ? <ChevronUp size={20} className="text-zinc-500" /> : <ChevronDown size={20} className="text-zinc-500" />}
          </button>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-[#141415] rounded-3xl border border-zinc-800/50 animate-in fade-in slide-in-from-top-2">
              <InputField 
                label="Preço Gasolina (R$)" 
                icon={<Fuel size={20} className="text-amber-400" />} 
                iconBg="bg-amber-400/10"
                value={gasPrice} 
                onChange={setGasPrice} 
                placeholder="0.00" 
              />
              <InputField 
                label="Consumo (Km/L)" 
                icon={<Car size={20} className="text-rose-400" />} 
                iconBg="bg-rose-400/10"
                value={consumption} 
                onChange={setConsumption} 
                placeholder="10" 
              />
              <InputField 
                label="Custo Desgaste (R$/Km)" 
                icon={<Wrench size={20} className="text-indigo-400" />} 
                iconBg="bg-indigo-400/10"
                value={wearCostPerKm} 
                onChange={setWearCostPerKm} 
                placeholder="0.40" 
              />
              <button
                onClick={handleSaveDefaults}
                disabled={isSavingDefaults}
                className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                {isSavingDefaults ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Salvar como Padrão
              </button>
            </div>
          )}

          <button
            onClick={calculateProfit}
            className="w-full mt-8 bg-gradient-to-r from-[#ee4d2d] to-[#ff7337] text-white font-bold py-4.5 rounded-3xl transition-transform active:scale-[0.98] shadow-xl shadow-[#ee4d2d]/20 flex justify-center items-center gap-2 text-lg"
          >
            <PieChartIcon size={20} />
            Calcular e Gerar Gráfico
          </button>
        </div>

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="p-6 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-[#1c1c1e] rounded-[2rem] p-6 shadow-2xl border border-zinc-800/50 relative overflow-hidden">
              <h3 className="text-center text-zinc-500 text-xs font-bold mb-6 uppercase tracking-widest">Distribuição da Rota</h3>
              
              {/* Chart Container */}
              <div className="relative h-[240px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={100}
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
                      contentStyle={{ backgroundColor: '#2c2c2e', border: '1px solid #3f3f46', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#fff', fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Valor Total</span>
                  <span className="text-2xl font-bold text-white mt-0.5">R$ {result.totalValue.toFixed(2)}</span>
                </div>
              </div>

              {/* Legend / Breakdown */}
              <div className="mt-8 space-y-2">
                <LegendRow label="Lucro Real" value={result.realProfit} color="bg-emerald-500" isProfit={true} />
                <LegendRow label="Gasolina" value={result.gasCost} color="bg-amber-500" />
                <LegendRow label="Desgaste" value={result.wearCost} color="bg-indigo-500" />
              </div>
            </div>

            {/* Profit per KM Card */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1c1c1e] rounded-[2rem] p-5 border border-zinc-800/50 flex flex-col justify-center">
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Lucro por KM</span>
                <span className={`text-2xl font-bold ${result.profitPerKm >= 0.80 ? 'text-emerald-400' : result.profitPerKm > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                  R$ {result.profitPerKm.toFixed(2)}
                </span>
              </div>
              
              <div className={`rounded-[2rem] p-5 border flex flex-col justify-center ${
                result.profitPerKm >= 0.80 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {result.profitPerKm >= 0.80 ? (
                  <>
                    <CheckCircle2 className="mb-2" size={24} />
                    <span className="font-bold text-sm">Ótima Rota!</span>
                    <span className="text-xs opacity-80 mt-0.5">Vale a pena fazer.</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mb-2" size={24} />
                    <span className="font-bold text-sm">Baixo Lucro</span>
                    <span className="text-xs opacity-80 mt-0.5">Abaixo de R$ 0,80/km.</span>
                  </>
                )}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveRoute}
              disabled={isSaving}
              className="w-full mt-4 bg-[#1c1c1e] hover:bg-[#252528] text-white font-bold py-4 rounded-3xl transition-transform active:scale-[0.98] border border-zinc-800/50 flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {isSaving ? 'Salvando...' : 'Salvar Rota no Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({ label, icon, iconBg, value, onChange, placeholder, type = "number" }: { label: string, icon: React.ReactNode, iconBg: string, value: string, onChange: (v: string) => void, placeholder: string, type?: string }) {
  return (
    <div className="bg-[#1c1c1e] rounded-3xl p-2.5 flex items-center border border-transparent focus-within:border-zinc-700 transition-colors shadow-sm">
      <div className={`p-3.5 rounded-2xl ${iconBg} shrink-0`}>
        {icon}
      </div>
      <div className="ml-4 flex-1">
        <label className="block text-[11px] font-bold text-zinc-500 mb-0.5 uppercase tracking-wider">{label}</label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full bg-transparent text-white text-lg font-bold placeholder-zinc-700 focus:outline-none"
          placeholder={placeholder}
          step={type === "number" ? "0.01" : undefined}
        />
      </div>
    </div>
  );
}

function LegendRow({ label, value, color, isProfit = false }: { label: string, value: number, color: string, isProfit?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/40">
      <div className="flex items-center gap-3">
        <div className={`w-3.5 h-3.5 rounded-full ${color} shadow-sm`}></div>
        <span className="text-zinc-300 font-medium text-sm">{label}</span>
      </div>
      <span className={`font-bold ${isProfit ? (value >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-100'}`}>
        R$ {value.toFixed(2)}
      </span>
    </div>
  );
}
