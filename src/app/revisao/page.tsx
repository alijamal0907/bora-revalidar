"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/custom/Header";
import ProtectedRoute from "@/components/custom/ProtectedRoute";
import { supabase, isSupabaseConfigured, getCurrentUser } from "@/lib/supabase";
import { Loader2, AlertCircle, BookOpen, Star, Trash2 } from "lucide-react";

type Questao = {
  id: string;
  enunciado: string;
  tema: string;
  subtema?: string;
};

type FiltroAtivo = "erradas" | "marcadas";

export default function RevisaoPage() {
  const router = useRouter();
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroAtivo>("erradas");
  const [questoesErradas, setQuestoesErradas] = useState<Questao[]>([]);
  const [questoesMarcadas, setQuestoesMarcadas] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarQuestoesErradas = async () => {
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

      // Buscar questões erradas recentemente
      const { data: histData, error: histError } = await supabase!
        .from('hist_questoes')
        .select('questao_id')
        .eq('user_id', user.id)
        .eq('correta', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (histError) {
        throw new Error(`Erro ao buscar histórico: ${histError.message}`);
      }

      if (!histData || histData.length === 0) {
        setQuestoesErradas([]);
        setLoading(false);
        return;
      }

      // Extrair IDs únicos
      const idsUnicos = Array.from(new Set(histData.map(item => item.questao_id)));

      // Buscar questões correspondentes
      const { data: questoesData, error: questoesError } = await supabase!
        .from('questoes')
        .select('id, enunciado, tema, subtema')
        .in('id', idsUnicos);

      if (questoesError) {
        throw new Error(`Erro ao buscar questões: ${questoesError.message}`);
      }

      setQuestoesErradas(questoesData || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar questões erradas.");
      setLoading(false);
    }
  };

  const carregarQuestoesMarcadas = async () => {
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

      // Buscar marcações de revisão
      const { data: marcacoesData, error: marcacoesError } = await supabase!
        .from('marcacoes_revisao')
        .select('questao_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (marcacoesError) {
        throw new Error(`Erro ao buscar marcações: ${marcacoesError.message}`);
      }

      if (!marcacoesData || marcacoesData.length === 0) {
        setQuestoesMarcadas([]);
        setLoading(false);
        return;
      }

      // Extrair IDs
      const ids = marcacoesData.map(item => item.questao_id);

      // Buscar questões correspondentes
      const { data: questoesData, error: questoesError } = await supabase!
        .from('questoes')
        .select('id, enunciado, tema, subtema')
        .in('id', ids);

      if (questoesError) {
        throw new Error(`Erro ao buscar questões: ${questoesError.message}`);
      }

      setQuestoesMarcadas(questoesData || []);
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

      // Atualizar lista local
      setQuestoesMarcadas(prev => prev.filter(q => q.id !== questaoId));
    } catch (err) {
      console.error("Erro ao remover marcação:", err);
    }
  };

  useEffect(() => {
    if (filtroAtivo === "erradas") {
      carregarQuestoesErradas();
    } else {
      carregarQuestoesMarcadas();
    }
  }, [filtroAtivo]);

  const questoesExibidas = filtroAtivo === "erradas" ? questoesErradas : questoesMarcadas;

  const truncarTexto = (texto: string, maxLength: number = 150) => {
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + "...";
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: "#0D1B2A" }}>
        <Header />
        
        <main className="pt-24 px-6 max-w-6xl mx-auto pb-12">
          <h1 className="text-4xl font-bold mb-2" style={{ color: "#C6A239" }}>
            Revisão de Questões
          </h1>
          <p className="text-lg mb-8" style={{ color: "#E6E6E6" }}>
            Revise questões que você errou ou que marcou para revisar depois.
          </p>

          {/* Botões de Filtro */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setFiltroAtivo("erradas")}
              className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: filtroAtivo === "erradas" ? "#C6A239" : "#1B4332",
                color: filtroAtivo === "erradas" ? "#0D1B2A" : "#E6E6E6",
                border: "2px solid #C6A239"
              }}
            >
              Erradas Recentemente
            </button>
            <button
              onClick={() => setFiltroAtivo("marcadas")}
              className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: filtroAtivo === "marcadas" ? "#C6A239" : "#1B4332",
                color: filtroAtivo === "marcadas" ? "#0D1B2A" : "#E6E6E6",
                border: "2px solid #C6A239"
              }}
            >
              Marcadas para Revisar
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: "#C6A239" }} />
              <p className="text-xl" style={{ color: "#E6E6E6" }}>
                Carregando questões...
              </p>
            </div>
          )}

          {/* Erro */}
          {error && !loading && (
            <div className="p-8 rounded-lg text-center" style={{ backgroundColor: "#5F2D2D", border: "2px solid #FF6B6B" }}>
              <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#FF6B6B" }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#FF6B6B" }}>
                Erro ao Carregar Questões
              </h2>
              <p className="mb-6" style={{ color: "#E6E6E6" }}>
                {error}
              </p>
              <button
                onClick={() => filtroAtivo === "erradas" ? carregarQuestoesErradas() : carregarQuestoesMarcadas()}
                className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                style={{ backgroundColor: "#C6A239", color: "#0D1B2A" }}
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Lista Vazia */}
          {!loading && !error && questoesExibidas.length === 0 && (
            <div className="p-8 rounded-lg text-center" style={{ backgroundColor: "#1B4332", border: "2px solid #C6A239" }}>
              <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: "#C6A239" }} />
              <p className="text-xl" style={{ color: "#E6E6E6" }}>
                Você ainda não tem questões para revisar aqui. Continue estudando e volte depois.
              </p>
            </div>
          )}

          {/* Lista de Questões */}
          {!loading && !error && questoesExibidas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {questoesExibidas.map((questao) => (
                <div
                  key={questao.id}
                  className="p-6 rounded-lg"
                  style={{ backgroundColor: "#1B4332", border: "2px solid #C6A239" }}
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: "#C6A239" }}>
                        {questao.tema}
                      </p>
                      <p className="text-xs" style={{ color: "#B7CBBF" }}>
                        ID: {questao.id}
                      </p>
                    </div>
                    {filtroAtivo === "marcadas" && (
                      <button
                        onClick={() => removerMarcacao(questao.id)}
                        className="p-2 rounded-lg hover:scale-110 transition-all"
                        style={{ backgroundColor: "#5F2D2D", color: "#FF6B6B" }}
                        title="Remover marcação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Enunciado */}
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: "#E6E6E6" }}>
                    {truncarTexto(questao.enunciado)}
                  </p>

                  {/* Botão Praticar */}
                  <button
                    onClick={() => router.push(`/estudar?questaoId=${questao.id}`)}
                    className="w-full px-4 py-3 rounded-lg font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#C6A239", color: "#0D1B2A" }}
                  >
                    <BookOpen className="w-5 h-5" />
                    Praticar Novamente
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
