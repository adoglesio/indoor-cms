
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Tv, 
  Calendar, 
  ChevronRight,
  HelpCircle,
  MessageCircle,
  Monitor,
  BarChart3,
  Settings,
} from 'lucide-react';

export default function Plans() {
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState(3);
  const [usedPoints, setUsedPoints] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchPlanData = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('points_included')
        .eq('user_id', user.id)
        .maybeSingle();
      setTotalPoints(profile?.points_included || 3);

      const { count } = await supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('owner_id', user.id); // 🔥 FILTRO POR USUÁRIO
      setUsedPoints(count || 0);
    };

    fetchPlanData();
  }, [user]);

  const planData = {
    name: 'Ponto X Indoor',
    price: 89.70,
    period: 'Mensal',
    points: totalPoints,
    usedPoints: usedPoints,
    nextBilling: '11 de julho de 2026',
    features: [
      { icon: Monitor, label: 'Biblioteca de mídias' },
      { icon: Calendar, label: 'Agendamento inteligente' },
      { icon: Tv, label: 'Playlists por setor da loja' },
      { icon: BarChart3, label: 'Monitoramento em tempo real' },
      { icon: Settings, label: 'Gestão centralizada de TVs' },
      { icon: MessageCircle, label: 'Suporte por WhatsApp' },
    ],
  };

  return (
    <div className="min-h-screen w-full bg-[#050B16] flex items-start justify-center overflow-hidden relative p-4 md:p-8 pt-8">
      {/* Glows de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[5%] w-32 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent rotate-45" />
        <div className="absolute bottom-[20%] left-[8%] w-40 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent -rotate-12" />
        <div className="absolute top-[30%] right-[10%] w-36 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent rotate-12" />
        <div className="absolute bottom-[40%] right-[5%] w-28 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent -rotate-45" />
      </div>

      <div className="w-full max-w-4xl mx-auto relative z-10 animate-fade-in-up">
        {/* Container principal SEM BORDAS */}
        <div className="bg-[#0A0F19]/60 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-6 md:p-10">

          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Planos</h1>
              <p className="text-sm text-gray-400">Gerencie sua assinatura e pontos disponíveis</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-xl">
              <span className="text-blue-400 font-medium">{user?.email || 'Usuário'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-6">

            {/* COLUNA ESQUERDA */}
            <div className="space-y-6">
              {/* Card do plano */}
              <div className="bg-white/5 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Meu Plano</h2>
                    <p className="text-xl font-bold text-white mt-2">{planData.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-3xl font-bold text-blue-400">
                        R$ {planData.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                        {planData.period}
                      </span>
                    </div>
                  </div>
                  <div className="bg-blue-500/10 rounded-xl px-3 py-1.5">
                    <span className="text-xs text-blue-300 font-medium">Ativo</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400 bg-white/5 rounded-xl px-4 py-3">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Próxima cobrança: <span className="text-white font-medium">{planData.nextBilling}</span></span>
                </div>
              </div>

              {/* Pontos */}
              <div className="bg-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Pontos (TVs) cadastrados</p>
                    <p className="text-2xl font-bold text-white">
                      {planData.usedPoints} <span className="text-gray-400 text-lg font-normal">de {planData.points}</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Tv className="w-6 h-6 text-blue-300" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${planData.points > 0 ? Math.min(100, (planData.usedPoints / planData.points) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {planData.usedPoints >= planData.points ? (
                      <span className="text-yellow-300">Limite atingido — todas as TVs do plano estão em uso.</span>
                    ) : (
                      <>Você ainda pode cadastrar <span className="text-blue-300 font-medium">{planData.points - planData.usedPoints} TV{planData.points - planData.usedPoints === 1 ? '' : 's'}</span></>
                    )}
                  </p>
                </div>
              </div>

              {/* Recursos */}
              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Recursos Incluídos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {planData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm text-gray-300">
                      <feature.icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA */}
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Ações</h3>
                <button className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-all duration-200 group">
                  <span className="text-sm text-gray-300">Gerenciar Assinatura</span>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </button>
                <button className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-all duration-200 group">
                  <span className="text-sm text-gray-300">Solicitar Equipamento</span>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </button>
                <button className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-all duration-200 group">
                  <span className="text-sm text-gray-300">Histórico de Pagamentos</span>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              {/* Dica */}
              <div className="bg-blue-500/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-blue-300" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">Dica</h4>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Você pode cancelar ou alterar seu plano a qualquer momento. As alterações entram em vigor no próximo ciclo de cobrança.
                  </p>
                </div>
              </div>

              {/* Suporte */}
              <div className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Suporte por WhatsApp</p>
                  <p className="text-xs text-gray-400">Atendimento em até 5 minutos</p>
                </div>
                <button className="ml-auto text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  Falar agora
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}