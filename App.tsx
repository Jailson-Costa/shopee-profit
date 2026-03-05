import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Database, Loader2 } from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CalculatorPage from './pages/Calculator';
import Layout from './components/Layout';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if Supabase env vars are set
  const hasSupabaseKeys = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (!hasSupabaseKeys) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [hasSupabaseKeys]);

  if (!hasSupabaseKeys) {
    return <SetupScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <Loader2 size={32} className="text-[#ee4d2d] animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {session ? (
        <Layout>
          <Routes>
            <Route path="/" element={<CalculatorPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

function SetupScreen() {
  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 p-6 flex items-center justify-center font-sans">
      <div className="max-w-md w-full bg-[#1c1c1e] p-8 rounded-[2rem] border border-zinc-800/50 shadow-2xl">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-2xl mb-6">
          <Database size={32} className="text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Configuração do Banco de Dados</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Para usar o Dashboard e salvar rotas, você precisa conectar o aplicativo ao Supabase.
        </p>
        
        <div className="space-y-4">
          <div className="bg-[#141415] p-4 rounded-2xl border border-zinc-800">
            <h3 className="font-bold text-sm text-white mb-2">1. Adicione as Variáveis</h3>
            <p className="text-xs text-zinc-500 mb-2">No painel lateral, adicione as seguintes variáveis de ambiente:</p>
            <code className="block text-[10px] text-indigo-300 bg-indigo-950/30 p-2 rounded-lg font-mono">
              VITE_SUPABASE_URL<br/>
              VITE_SUPABASE_ANON_KEY
            </code>
          </div>

          <div className="bg-[#141415] p-4 rounded-2xl border border-zinc-800">
            <h3 className="font-bold text-sm text-white mb-2">2. Crie as Tabelas no Supabase</h3>
            <p className="text-xs text-zinc-500 mb-2">Rode este código no SQL Editor do Supabase para criar as tabelas de Perfis e Rotas:</p>
            <pre className="block text-[10px] text-emerald-300 bg-emerald-950/30 p-3 rounded-lg font-mono overflow-x-auto h-48">
{`-- 1. Tabela de Perfis (Nome, Telefone e Configurações Padrão)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  phone text,
  default_consumption numeric default 10,
  default_wear_cost numeric default 0.40,
  default_gas_price numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Gatilho para criar perfil automaticamente ao cadastrar
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Tabela de Rotas
create table public.routes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  route_date date not null default CURRENT_DATE,
  route_value numeric not null,
  km_total numeric not null,
  gas_price numeric not null,
  consumption numeric not null,
  wear_cost_per_km numeric not null,
  gas_cost numeric not null,
  wear_cost numeric not null,
  real_profit numeric not null,
  profit_per_km numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.routes enable row level security;
create policy "Users can view own routes" on routes for select using (auth.uid() = user_id);
create policy "Users can insert own routes" on routes for insert with check (auth.uid() = user_id);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
