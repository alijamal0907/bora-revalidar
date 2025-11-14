"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/custom/Header";
import ProtectedRoute from "@/components/custom/ProtectedRoute";
import { supabase, isSupabaseConfigured, getCurrentUser } from "@/lib/supabase";
import { Loader2, AlertCircle, CheckCircle, XCircle, Star } from "lucide-react";

type Questao = {
  id: string;
  ano: number;
  enunciado: string;
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  alternativaE: string;
  correta: 'A' | 'B' | 'C' | 'D' | 'E';
  tema: string;
  subtema: string;
};

type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E';

export default function EstudarPage() {
  const searchParams = useSearchParams();
  const questaoIdParam = searchParams.get('questaoId');

  const [questao, setQuestao] = useState<Questao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respostaSelecionada, setRespostaSelecionada] = useState<Alternativa | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  
  // Controle de sessão
  const [questoesRespondidas, setQuestoesRespondidas] = useState(0);
  const [acertosSessao, setAcertosSessao] = useState(0);
  const [marcadaParaRevisar, setMarcadaParaRevisar] = useState(false);

  const buscarQuestaoEspecifica = async (questaoId: string) => {
    if (!isSupabaseConfigured()) {
      setError("Supabase não está configurado. Vá em Configurações do Projeto → Integrações → Conectar Supabase.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setRespostaSelecionada(null);
      setMostrarResultado(false);
      setMarcadaParaRevisar(false);

      const { data, error: fetchError } = await supabase!
        .from('questoes')
        .select('*')
        .eq('id', questaoId)
        .single();

      if (fetchError) {
        throw new Error(`Erro ao buscar questão: ${fetchError.message}`);
      }

      if (!data) {
        setError(`Questão com ID "${questaoId}" não encontrada.`);
        setLoading(false);
        return;
      }

      setQuestao(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar questão específica.");
      setLoading(false);
    }
  };

  const buscarQuestaoAleatoria = async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase não está configurado. Vá em Configurações do Projeto → Integrações → Conectar Supabase.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setRespostaSelecionada(null);
      setMostrarResultado(false);
      setMarcadaParaRevisar(false);

      const { data, error: fetchError } = await supabase!
        .from('questoes')
        .select('*');

      if (fetchError) {
        throw new Error(`Erro ao buscar questões: ${fetchError.message}`);
      }

      if (!data || data.length === 0) {
        setError("Nenhuma questão encontrada. Verifique se você adicionou questões na tabela 'questoes' do Supabase e se as políticas RLS permitem leitura.");
        setLoading(false);
        return;
      }

      const questaoAleatoria = data[Math.floor(Math.random() * data.length)];
      setQuestao(questaoAleatoria);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar questão. Verifique sua conexão e as configurações do Supabase.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questaoIdParam) {
      buscarQuestaoEspecifica(questaoIdParam);
    } else {
      buscarQuestaoAleatoria();
    }
  }, [questaoIdParam]);

  const registrarResposta = async (alternativa: Alternativa, correta: boolean) => {
    if (!isSupabaseConfigured() || !questao) return;

    try {
      const { user } = await getCurrentUser();
      if (!user) return;

      const { error: insertError } = await supabase!
        .from('hist_questoes')
        .insert({
          user_id: user.id,
          questao_id: questao.id,
          resposta: alternativa,
          correta: correta,
          origem: 'estudo'
        });

      if (insertError) {
        console.error("Erro no histórico", insertError);
      }
    } catch (err) {
      console.error("Erro no histórico", err);
    }
  };

  const marcarParaRevisar = async () => {
    if (!isSupabaseConfigured() || !questao) return;

    try {
      const { user } = await getCurrentUser();
      if (!user) return;

      if (marcadaParaRevisar) {
        // Desmarcar
        const { error: deleteError } = await supabase!
          .from('marcacoes_revisao')
          .delete()
          .eq('user_id', user.id)
          .eq('questao_id', questao.id);

        if (!deleteError) {
          setMarcadaParaRevisar(false);
        }
      } else {
        // Marcar
        const { error: insertError } = await supabase!
          .from('marcacoes_revisao')
          .insert({
            user_id: user.id,
            questao_id: questao.id
          });

        if (!insertError) {
          setMarcadaParaRevisar(true);
        }
      }
    } catch (err) {
      console.error("Erro ao marcar para revisão", err);
    }
  };

  const handleRespostaClick = (alternativa: Alternativa) => {
    if (mostrarResultado) return;
    
    setRespostaSelecionada(alternativa);
    setMostrarResultado(true);

    const correta = alternativa === questao?.correta;
    
    // Atualizar estatísticas da sessão
    setQuestoesRespondidas(prev => prev + 1);
    if (correta) {
      setAcertosSessao(prev => prev + 1);
    }

    // Registrar resposta no histórico
    registrarResposta(alternativa, correta);
  };

  const handleProximaQuestao = () => {
    buscarQuestaoAleatoria();
  };

  const getTextoAlternativa = (letra: Alternativa): string => {
    if (!questao) return "";
    const campo = `alternativa${letra}` as keyof Questao;
    return String(questao[campo] || "");
  };

  const getAlternativaStyle = (alternativa: Alternativa) => {
    if (!mostrarResultado) {
      return respostaSelecionada === alternativa
        ? { backgroundColor: "#C6A239", color: "#0D1B2A" }
        : { backgroundColor: "#1B4332", color: "#E6E6E6" };
    }

    if (alternativa === questao?.correta) {
      return { backgroundColor: "#2D5F3F", color: "#90EE90", border: "2px solid #90EE90" };
    }

    if (alternativa === respostaSelecionada && alternativa !== questao?.correta) {
      return { backgroundColor: "#5F2D2D", color: "#FF6B6B", border: "2px solid #FF6B6B" };
    }

    return { backgroundColor: "#1B4332", color: "#B7CBBF", opacity: 0.6 };
  };

  const calcularPercentualSessao = () => {
    if (questoesRespondidas === 0) return 0;
    return Math.round((acertosSessao / questoesRespondidas) * 100);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen" style={{ backgroundColor: "#0D1B2A" }}>
          <Header />
          <main className="pt-24 px-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: "#C6A239" }} />
              <p className="text-xl" style={{ color: "#E6E6E6" }}>
                Carregando questão...
              </p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen" style={{ backgroundColor: "#0D1B2A" }}>
          <Header />
          <main className="pt-24 px-6 max-w-4xl mx-auto">
            <div className="p-8 rounded-lg text-center" style={{ backgroundColor: "#5F2D2D", border: "2px solid #FF6B6B" }}>
              <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#FF6B6B" }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#FF6B6B" }}>
                Erro ao Carregar Questão
              </h2>
              <p className="mb-6 whitespace-pre-wrap" style={{ color: "#E6E6E6" }}>
                {error}
              </p>
              <button
                onClick={buscarQuestaoAleatoria}
                className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                style={{ backgroundColor: "#C6A239", color: "#0D1B2A" }}
              >
                Tentar Novamente
              </button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!questao) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen" style={{ backgroundColor: "#0D1B2A" }}>
          <Header />
          <main className="pt-24 px-6 max-w-4xl mx-auto">
            <div className="p-8 rounded-lg text-center" style={{ backgroundColor: "#1B4332", border: "2px solid #C6A239" }}>
              <p className="text-xl" style={{ color: "#E6E6E6" }}>
                Nenhuma questão disponível no momento.
              </p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const acertou = respostaSelecionada === questao.correta;

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: "#0D1B2A" }}>
        <Header />
        
        <main className="pt-24 px-6 max-w-4xl mx-auto pb-12">
          <h1 className="text-4xl font-bold mb-6" style={{ color: "#C6A239" }}>
            Área de Estudos
          </h1>

          {/* Cabeçalho de Progresso da Sessão */}
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: "#1B4332", border: "2px solid #C6A239" }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-lg font-bold" style={{ color: "#C6A239" }}>
                  {questaoIdParam ? `Questão: ${questao.id}` : `Questão ${questoesRespondidas + 1} • Modo Contínuo`}
                </p>
                {questao.tema && (
                  <p className="text-sm" style={{ color: "#E6E6E6" }}>
                    Tema: {questao.tema} {questao.subtema && `• Subtema: ${questao.subtema}`}
                  </p>
                )}
              </div>
              
              {/* Resumo da Sessão */}
              {questoesRespondidas > 0 && !questaoIdParam && (
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: "#E6E6E6" }}>
                    Nesta sessão: {questoesRespondidas} questões • {acertosSessao} acertos • {calcularPercentualSessao()}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card da Questão */}
          <div className="p-6 rounded-lg mb-6" style={{ backgroundColor: "#1B4332", border: "2px solid #C6A239" }}>
            {/* Enunciado */}
            <div className="mb-6">
              <p className="text-lg leading-relaxed whitespace-pre-wrap" style={{ color: "#E6E6E6" }}>
                {questao.enunciado}
              </p>
            </div>

            {/* Alternativas */}
            <div className="space-y-3">
              {(['A', 'B', 'C', 'D', 'E'] as Alternativa[]).map((letra) => {
                const textoAlternativa = getTextoAlternativa(letra);
                
                return (
                  <button
                    key={letra}
                    onClick={() => handleRespostaClick(letra)}
                    disabled={mostrarResultado}
                    className="w-full text-left p-4 rounded-lg transition-all hover:scale-[1.02] disabled:cursor-not-allowed"
                    style={getAlternativaStyle(letra)}
                  >
                    <span className="font-bold mr-3">{letra})</span>
                    {textoAlternativa}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback de Resultado */}
          {mostrarResultado && (
            <div className="p-6 rounded-lg mb-6" style={{ 
              backgroundColor: acertou ? "#2D5F3F" : "#5F2D2D",
              border: `2px solid ${acertou ? "#90EE90" : "#FF6B6B"}`
            }}>
              <div className="flex items-center mb-3">
                {acertou ? (
                  <CheckCircle className="w-8 h-8 mr-3" style={{ color: "#90EE90" }} />
                ) : (
                  <XCircle className="w-8 h-8 mr-3" style={{ color: "#FF6B6B" }} />
                )}
                <h3 className="text-2xl font-bold" style={{ color: acertou ? "#90EE90" : "#FF6B6B" }}>
                  {acertou ? "✅ Acertou! " : "❌ Errou. "}
                  A alternativa correta é {questao.correta}.
                </h3>
              </div>
            </div>
          )}

          {/* Marcar para Revisar */}
          {mostrarResultado && (
            <div className="mb-6">
              <button
                onClick={marcarParaRevisar}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
                style={{ 
                  backgroundColor: marcadaParaRevisar ? "#C6A239" : "#1B4332",
                  color: marcadaParaRevisar ? "#0D1B2A" : "#E6E6E6",
                  border: "2px solid #C6A239"
                }}
              >
                <Star className={`w-5 h-5 ${marcadaParaRevisar ? 'fill-current' : ''}`} />
                {marcadaParaRevisar ? "Marcada para revisar" : "Marcar esta questão para revisar depois"}
              </button>
            </div>
          )}

          {/* Botão Próxima Questão */}
          {mostrarResultado && (
            <div className="text-center">
              <button
                onClick={handleProximaQuestao}
                className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105"
                style={{ backgroundColor: "#C6A239", color: "#0D1B2A" }}
              >
                Próxima Questão
              </button>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
