"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/custom/Header";
import ProtectedRoute from "@/components/custom/ProtectedRoute";
import { supabase, isSupabaseConfigured, getCurrentUser } from "@/lib/supabase";
import { Loader2, AlertCircle, BookOpen, Star, XCircle } from "lucide-react";

type Questao = {
  id: string;
  enunciado: string;
  tema: string;
  subtema?: string;
};

type FiltroTipo = "erradas" | "marcadas";

export default function RevisaoPage() {
  const router = useRouter();
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroTipo>("erradas");
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarQuestoesErradas = async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase não está configurado. Vá em Configurações do Projeto → Integrações → Conectar Supabase.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { user } = await getCurrentUser();
      if (!user) {
        setError("Usuário não autenticado.");
        setLoading(false);
        return;
      }

      // Buscar questões erradas do usuário (últimas 50)
      const { data: historico, error: histError } = await supabase!
        .from('hist_questoes')
        .select('questao_id')
        .eq('user_id', user.id)
        .eq('correta', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (histError) {
        throw new Error(`Erro ao buscar histórico: ${histError.message}`);
      }

      if (!historico || historico.length === 0) {
        setQuestoes([]);
        setLoading(false);
        return;
      }

      // Obter IDs únicos
      const questaoIds = [...new Set(historico.map(h => h.questao_id))];

      // Buscar detalhes das questões
      const { data: questoesData, error: questoesError } = await supabase!
        .from('questoes')
        .select('id, enunciado, tema, subtema')
        .in('id', questaoIds);

      if (questoesError) {
        throw new Error(`Erro ao buscar questões: ${questoesError.message}`);
      }

      setQuestoes(questoesData || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar questões erradas.");
      setLoading(false);
    }
  };

  const buscarQuestoesMarcadas = async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase não está configurado. Vá em Configurações do Projeto → Integrações → Conectar Supabase.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { user } = await getCurrentUser();
      if (!user) {
        setError("Usuário não autenticado.");
        setLoading(false);
        return;
      }

      // Buscar questões marcadas para revisão
      const { data: marcacoes, error: marcError } = await supabase!
        .from('marcacoes_revisao')
        .select('questao_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (marcError) {
        throw new Error(`Erro ao buscar marcações: ${marcError.message}`);
      }

      if (!marcacoes || marcacoes.length === 0) {
        setQuestoes([]);
        setLoading(false);
        return;
      }

      // Obter IDs das questões marcadas
      const questaoIds = marcacoes.map(m => m.questao_id);

      // Buscar detalhes das questões
      const { data: questoesData, error: questoesError } = await supabase!
        .from('questoes')
        .select('id, enunciado, tema, subtema')
        .in('id', questaoIds);

      if (questoesError) {
        throw new Error(`Erro ao buscar questões: ${questoesError.message}`);
      }

      setQuestoes(questoesData || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar questões marcadas.");
      setLoading(false);
    }
  };

  const removerMarcacao = async (questaoId: string) => {
    if (!isSupabaseConfigured()) return;

    try {
      const { user } = await getCurrentUser();
      if (!user) return;

      const { error: deleteError } = await supabase!
        .from('marcacoes_revisao')
        .delete()
        .eq('user_id', user.id)
        .eq('questao_id', questaoId);

      if (deleteError) {
        console.error("Erro ao remover marcação:", deleteError);
        return;
      }

      // Atualizar lista removendo a questão
      setQuestoes(prev => prev.filter(q => q.id !== questaoId));
    } catch (err) {
      console.error("Erro ao remover marcação:", err);
    }
  };

  useEffect(() => {
    if (filtroAtivo === "erradas") {
      buscarQuestoesErradas();
    } else {
      buscarQuestoesMarcadas();
    }
  }, [filtroAtivo]);

  const handlePraticarNovamente = (questaoId: string) => {
    router.push(`/estudar?questaoId=${questaoId}`);
  };

  const truncarTexto = (texto: string, maxLength: number = 150) => {
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + "...";
  };

  return (
    <ProtectedRoute>
      <div 
        className="min-h-screen relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #001C2D 0%, #06345F 100%)",
        }}
      >
        {/* Textura de grade sutil */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px"
          }}
        />

        <Header />
        
        <main className="pt-24 px-6 max-w-5xl mx-auto pb-12 relative z-10">
          {/* Título */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3" style={{ color: "#FFFFFF" }}>
              Revisão de Questões
            </h1>
            <p className="text-lg" style={{ color: "#DCE6ED" }}>
              Revise questões que você errou ou que marcou para revisar depois.
            </p>
          </div>

          {/* Filtros (Abas) */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setFiltroAtivo("erradas")}
              className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: filtroAtivo === "erradas" ? "#FF8A38" : "#1B4332",
                color: filtroAtivo === "erradas" ? "#FFFFFF" : "#DCE6ED",
                border: filtroAtivo === "erradas" ? "2px solid #FF8A38" : "2px solid #1B4332"
              }}
            >
              <XCircle className="w-5 h-5 inline-block mr-2" />
              Erradas recentemente
            </button>

            <button
              onClick={() => setFiltroAtivo("marcadas")}
              className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: filtroAtivo === "marcadas" ? "#FF8A38" : "#1B4332",
                color: filtroAtivo === "marcadas" ? "#FFFFFF" : "#DCE6ED",
                border: filtroAtivo === "marcadas" ? "2px solid #FF8A38" : "2px solid #1B4332"
              }}
            >
              <Star className="w-5 h-5 inline-block mr-2" />
              Marcadas para revisar
            </button>
          </div>

          {/* Conteúdo */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: "#FF8A38" }} />
              <p className="text-xl" style={{ color: "#DCE6ED" }}>
                Carregando questões...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 rounded-lg text-center" style={{ backgroundColor: "#5F2D2D", border: "2px solid #FF6B6B" }}>
              <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#FF6B6B" }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#FF6B6B" }}>
                Erro ao Carregar Questões
              </h2>
              <p className="mb-6" style={{ color: "#E6E6E6" }}>
                {error}
              </p>
            </div>
          ) : questoes.length === 0 ? (
            <div className="p-8 rounded-lg text-center" style={{ backgroundColor: "#1B4332", border: "2px solid #C6A239" }}>
              <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: "#C6A239" }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#FFFFFF" }}>
                Nenhuma questão para revisar
              </h2>
              <p style={{ color: "#DCE6ED" }}>
                {filtroAtivo === "erradas" 
                  ? "Você ainda não tem questões erradas para revisar. Continue estudando e volte depois."
                  : "Você ainda não marcou nenhuma questão para revisar. Marque questões durante seus estudos e elas aparecerão aqui."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questoes.map((questao) => (
                <div
                  key={questao.id}
                  className="p-6 rounded-lg transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    backgroundColor: "#1B4332",
                    border: "2px solid #C6A239",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"
                  }}
                >
                  {/* Cabeçalho do card */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: "#C6A239" }}>
                        {questao.tema} {questao.subtema && `• ${questao.subtema}`}
                      </p>
                      <p className="text-xs" style={{ color: "#B7CBBF" }}>
                        ID: {questao.id}
                      </p>
                    </div>
                  </div>

                  {/* Enunciado (truncado) */}
                  <p className="mb-4 leading-relaxed" style={{ color: "#E6E6E6" }}>
                    {truncarTexto(questao.enunciado)}
                  </p>

                  {/* Botões de ação */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handlePraticarNovamente(questao.id)}
                      className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                      style={{
                        backgroundColor: "#FF8A38",
                        color: "#FFFFFF"
                      }}
                    >
                      <BookOpen className="w-4 h-4 inline-block mr-2" />
                      Praticar novamente
                    </button>

                    {filtroAtivo === "marcadas" && (
                      <button
                        onClick={() => removerMarcacao(questao.id)}
                        className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                        style={{
                          backgroundColor: "#5F2D2D",
                          color: "#FF6B6B",
                          border: "2px solid #FF6B6B"
                        }}
                      >
                        <XCircle className="w-4 h-4 inline-block mr-2" />
                        Remover marcação
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
