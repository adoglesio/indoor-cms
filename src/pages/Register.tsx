// src/pages/Register.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Monitor, ChevronRight } from 'lucide-react';
import logoImg from '../assets/logo.png';
import designImg from '../assets/Design.png';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);
    try {
      await signUp(data.name, data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.message || 'Erro ao criar conta. Tente novamente.';
      setError(message);
      alert(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050B16] flex items-center justify-center overflow-hidden relative">
      {/* ============================================================ */}
      {/* FUNDO – ELEMENTOS TECNOLÓGICOS */}
      {/* ============================================================ */}

      {/* Glow central */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

      {/* Circuitos – linhas decorativas */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[5%] w-32 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent rotate-45" />
        <div className="absolute bottom-[20%] left-[8%] w-40 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent -rotate-12" />
        <div className="absolute top-[30%] right-[10%] w-36 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent rotate-12" />
        <div className="absolute bottom-[40%] right-[5%] w-28 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent -rotate-45" />
      </div>

      {/* Partículas pequenas */}
      <div className="absolute top-[15%] left-[20%] w-1 h-1 rounded-full bg-blue-400/40 blur-[1px]" />
      <div className="absolute top-[65%] left-[10%] w-1.5 h-1.5 rounded-full bg-cyan-400/30 blur-[1px]" />
      <div className="absolute top-[25%] right-[15%] w-1 h-1 rounded-full bg-indigo-400/40 blur-[1px]" />
      <div className="absolute bottom-[35%] right-[25%] w-1.5 h-1.5 rounded-full bg-blue-400/30 blur-[1px]" />

      {/* ============================================================ */}
      {/* CONTEÚDO PRINCIPAL */}
      {/* ============================================================ */}

      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[42%_58%] gap-0 min-h-[65vh] items-stretch">

          {/* ============================================================ */}
          {/* COLUNA ESQUERDA – FORMULÁRIO (42%) */}
          {/* ============================================================ */}

          <div className="flex items-center justify-center p-6 md:p-8 lg:p-10 bg-[#0A0F19]/40 backdrop-blur-xl rounded-3xl lg:rounded-r-none border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="w-full max-w-sm space-y-5 animate-fade-in-up">

              {/* Logo e título */}
              <div className="text-center">
                <img
                  src={logoImg}
                  alt="CONEXON"
                  className="h-25 w-auto mx-auto mb-3 drop-shadow-[0_4px_20px_rgba(59,130,246,0.3)]"
                />
                
              </div>

              {/* Saudação */}
              <div>
                <h2 className="text-xl font-semibold text-white">Criar conta</h2>
                <p className="text-sm text-gray-400">Preencha os dados para se cadastrar.</p>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-300">Nome completo</label>
                  <div className="relative mt-1 group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-400 transition-colors duration-200 w-5 h-5" />
                    <input
                      {...register('name', { required: 'Nome é obrigatório' })}
                      type="text"
                      placeholder="Digite seu nome"
                      className="w-full h-[60px] pl-12 pr-4 bg-transparent border border-[#334155] rounded-xl text-white placeholder-gray-500 outline-none transition-all duration-200 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300">E-mail</label>
                  <div className="relative mt-1 group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-400 transition-colors duration-200 w-5 h-5" />
                    <input
                      {...register('email', {
                        required: 'E-mail é obrigatório',
                        pattern: { value: /^\S+@\S+$/i, message: 'E-mail inválido' }
                      })}
                      type="email"
                      placeholder="Digite seu e-mail"
                      className="w-full h-[60px] pl-12 pr-4 bg-transparent border border-[#334155] rounded-xl text-white placeholder-gray-500 outline-none transition-all duration-200 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-300">Senha</label>
                  <div className="relative mt-1 group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-400 transition-colors duration-200 w-5 h-5" />
                    <input
                      {...register('password', {
                        required: 'Senha é obrigatória',
                        minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha (mínimo 6 caracteres)"
                      className="w-full h-[60px] pl-12 pr-12 bg-transparent border border-[#334155] rounded-xl text-white placeholder-gray-500 outline-none transition-all duration-200 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-blue-400 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                </div>

                {/* Confirmar Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-300">Confirmar senha</label>
                  <div className="relative mt-1 group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-400 transition-colors duration-200 w-5 h-5" />
                    <input
                      {...register('confirmPassword', {
                        required: 'Confirme sua senha',
                        validate: value => value === watch('password') || 'As senhas não coincidem'
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirme sua senha"
                      className="w-full h-[60px] pl-12 pr-12 bg-transparent border border-[#334155] rounded-xl text-white placeholder-gray-500 outline-none transition-all duration-200 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-blue-400 transition-colors duration-200"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>

                {/* Erro */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-sm text-center animate-shake">
                    {error}
                  </div>
                )}

                {/* Botão Criar conta */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[60px] bg-gradient-to-r from-[#1E90FF] to-[#005DFF] text-white font-semibold rounded-xl shadow-[0_4px_20px_rgba(30,144,255,0.3)] hover:shadow-[0_4px_30px_rgba(30,144,255,0.5)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Criar conta
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </button>

                {/* Separador */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-gray-500 uppercase tracking-wider">ou</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Link para login */}
                <p className="text-center text-sm text-gray-400">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 hover:underline">
                    Faça login
                  </Link>
                </p>
              </form>

              {/* Rodapé */}
              <div className="text-center">
                <p className="text-xs text-gray-500">CONEXON MÍDIA INDOOR © 2026</p>
                <p className="text-[10px] text-gray-600 mt-1">v1.0.0</p>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLUNA DIREITA – IMAGEM (58%) */}
          {/* ============================================================ */}

          <div className="relative hidden lg:block overflow-hidden rounded-3xl lg:rounded-l-none bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5">
            {/* Imagem principal – ocupa toda a área */}
            <img
              src={designImg}
              alt="Sinalização Digital"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay gradiente sutil para melhor legibilidade do card */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050B16]/60 via-[#050B16]/20 to-transparent" />

            {/* ============================================================ */}
            {/* CARD FLUTUANTE – PLANOS DE LOCAÇÃO */}
            {/* ============================================================ */}

            <div className="absolute bottom-8 left-8 max-w-xs bg-[#0A0F19]/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.15)] p-6 animate-fade-in-up [animation-delay:300ms] hover:shadow-[0_0_60px_rgba(59,130,246,0.25)] transition-shadow duration-500">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/30 flex-shrink-0">
                  <Monitor className="w-6 h-6 text-blue-300" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                    Planos de Locação
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Sistema, Player e Telas <br />
                    <span className="text-blue-300">(21” a 86”)</span>
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-3xl font-bold text-blue-400">5</span>
                    <span className="text-xs text-gray-400">opções disponíveis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ANIMAÇÕES TAILWIND CUSTOM */}
      {/* ============================================================ */}

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        .animate-shake {
          animation: shake 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}