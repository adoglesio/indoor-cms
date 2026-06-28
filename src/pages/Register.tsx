// src/pages/Register.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

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

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);
    try {
      await signUp(data.name, data.email, data.password);
      // Cadastro bem-sucedido
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.message || 'Erro ao criar conta. Tente novamente.';
      setError(message);
      // Exibe um alerta (pop-up) para chamar mais atenção
      alert(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <img src={logo} alt="Digital Solutions" className="mx-auto h-16 w-auto" />
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800">CADASTRO</h2>
          <p className="text-sm text-gray-500 mt-1">Crie sua conta gratuitamente</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              {...register('name', { required: 'Nome é obrigatório' })}
              type="text"
              placeholder="Seu nome"
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register('email', {
                required: 'E-mail é obrigatório',
                pattern: { value: /^\S+@\S+$/i, message: 'E-mail inválido' }
              })}
              type="email"
              placeholder="seu@email.com"
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              {...register('password', {
                required: 'Senha é obrigatória',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' }
              })}
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
            <input
              {...register('confirmPassword', {
                required: 'Confirme sua senha',
                validate: value => value === watch('password') || 'As senhas não coincidem'
              })}
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {/* Exibir erro geral */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'CRIAR CONTA'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium transition">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}