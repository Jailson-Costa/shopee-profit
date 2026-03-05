import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calculator, Mail, Lock, Loader2, User, Phone } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!name || !phone) {
          throw new Error('Por favor, preencha seu nome e telefone.');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone: phone,
            }
          }
        });
        if (error) throw error;
        alert('Conta criada com sucesso! Você já pode fazer login.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4 font-sans selection:bg-[#ee4d2d]/30">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-[#ee4d2d] to-[#ff7337] rounded-3xl shadow-2xl shadow-[#ee4d2d]/20 mb-6">
            <Calculator size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Shopee Profit</h2>
          <p className="text-zinc-400 mt-2">Faça login para salvar suas rotas</p>
        </div>

        <form onSubmit={handleAuth} className="mt-8 space-y-6 bg-[#1c1c1e] p-8 rounded-[2rem] border border-zinc-800/50 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Nome Completo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User size={18} className="text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      required={isSignUp}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-[#141415] border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-[#ee4d2d] transition-colors"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Telefone</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone size={18} className="text-zinc-500" />
                    </div>
                    <input
                      type="tel"
                      required={isSignUp}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-[#141415] border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-[#ee4d2d] transition-colors"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-zinc-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-[#141415] border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-[#ee4d2d] transition-colors"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-zinc-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-[#141415] border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-[#ee4d2d] transition-colors"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#ee4d2d] to-[#ff7337] text-white font-bold py-4 rounded-2xl transition-transform active:scale-[0.98] shadow-xl shadow-[#ee4d2d]/20 flex justify-center items-center gap-2 disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
