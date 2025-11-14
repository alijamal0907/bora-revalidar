"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/custom/Header";
import ProtectedRoute from "@/components/custom/ProtectedRoute";
import { getCurrentUser, supabase, isSupabaseConfigured } from "@/lib/supabase";
import { TrendingUp, Target, Award } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [progressoHoje, setProgressoHoje] = useState({
    totalRespondidas: 0,
    totalAcertos: 0,
    percentual: 0
  });
  const [loadingProgresso, setLoadingProgresso] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { user } = await getCurrentUser();
      if (user) {
        // Pega o nome do email (antes do @)
        const nome = user.email?.split("@")[0] || "Usuário";
        setNomeUsuario(nome);
      }
    };
    
    loadUser();
  }, []);

  useEffect(() => {
    const carregarProgressoHoje = async () => {
      if (!isSupabaseConfigured()) {
        setLoadingProgresso(false);
        return;
      }

      try {
        const { user } = await getCurrentUser();
        if (!user) {
          setLoadingProgresso(false);
          return;
        }

        // Pegar data de hoje no formato YYYY-MM-DD
        const hoje = new Date().toISOString().split('T')[0];

        // Buscar registros de hoje
        const { data, error } = await supabase!
          .from('hist_questoes')
          .select('correta')
          .eq('user_id', user.id)
          .gte('created_at', `${hoje}T00:00:00`)
          .lte('created_at', `${hoje}T23:59:59`);

        // LOG para depuração
        console.log("Histórico de hoje:", data);

        if (error) {
          console.error("Erro no histórico", error);
          setLoadingProgresso(false);
          return;
        }

        // SEMPRE atualizar o estado, mesmo se data estiver vazio
        if (data && data.length > 0) {
          const totalRespondidas = data.length;
          const totalAcertos = data.filter(item => item.correta === true).length;
          const percentual = Math.round((totalAcertos / totalRespondidas) * 100);

          setProgressoHoje({
            totalRespondidas,
            totalAcertos,
            percentual
          });
        } else {
          // Se não houver dados, manter em 0
          setProgressoHoje({
            totalRespondidas: 0,
            totalAcertos: 0,
            percentual: 0
          });
        }

        setLoadingProgresso(false);
      } catch (err) {
        console.error("Erro no histórico", err);
        setLoadingProgresso(false);
      }
    };

    carregarProgressoHoje();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: "#0D1B2A" }}>
        <Header />
        
        <main className="pt-24 px-6 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#C6A239" }}>
            Bem-vindo, {nomeUsuario}!
          </h1>
          
          <p className="text-xl mb-8" style={{ color: "#E6E6E6" }}>
            Escolha uma opção para começar seus estudos
          </p>

          {/* Painel de Progresso Hoje - SEMPRE VISÍVEL */}
          {!loadingProgresso && (
            <div className="mb-8 p-6 rounded-lg" style={{ backgroundColor: "#1B4332", border: "2px solid #C6A239" }}>
              <h2 className="text-2xl font-bold mb-4 flex items-center" style={{ color: "#C6A239" }}>
                <TrendingUp className="w-6 h-6 mr-2" />
                Seu Progresso Hoje
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: "#0D1B2A" }}>
                  <div className="flex items-center justify-center mb-2">
                    <Target className="w-5 h-5 mr-2" style={{ color: "#C6A239" }} />
                    <p className="text-sm font-semibold" style={{ color: "#B7CBBF" }}>
                      Questões Respondidas
                    </p>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: "#C6A239" }}>
                    {progressoHoje.totalRespondidas}
                  </p>
                </div>

                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: "#0D1B2A" }}>
                  <div className="flex items-center justify-center mb-2">
                    <Award className="w-5 h-5 mr-2" style={{ color: "#90EE90" }} />
                    <p className="text-sm font-semibold" style={{ color: "#B7CBBF" }}>
                      Acertos
                    </p>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: "#90EE90" }}>
                    {progressoHoje.totalAcertos}
                  </p>
                </div>

                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: "#0D1B2A" }}>
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 mr-2" style={{ color: "#C6A239" }} />
                    <p className="text-sm font-semibold" style={{ color: "#B7CBBF" }}>
                      Taxa de Acerto
                    </p>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: "#C6A239" }}>
                    {progressoHoje.percentual}%
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <button
              onClick={() => router.push("/estudar")}
              className="p-8 rounded-lg hover:opacity-90 transition-all transform hover:scale-105"
              style={{ backgroundColor: "#1B4332", border: "2px solid #C6A239" }}
            >
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#C6A239" }}>
                📚 Estudar
              </h2>
              <p style={{ color: "#E6E6E6" }}>
                Acesse questões e materiais de estudo
              </p>
            </button>

            <button
              onClick={() => router.push("/simulados")}
              className="p-8 rounded-lg hover:opacity-90 transition-all transform hover:scale-105"
              style={{ backgroundColor: "#1B4332", border: "2px solid #C6A239" }}
            >
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#C6A239" }}>
                📝 Simulados
              </h2>
              <p style={{ color: "#E6E6E6" }}>
                Faça simulados e teste seus conhecimentos
              </p>
            </button>

            <button
              onClick={() => router.push("/premium")}
              className="p-8 rounded-lg hover:opacity-90 transition-all transform hover:scale-105"
              style={{ backgroundColor: "#C6A239", border: "2px solid #C6A239" }}
            >
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#0D1B2A" }}>
                ⭐ Premium
              </h2>
              <p style={{ color: "#0D1B2A" }}>
                Desbloqueie todos os recursos
              </p>
            </button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
