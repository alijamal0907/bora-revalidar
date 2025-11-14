"use client";

import { useState, useEffect } from "react";
import Header from "@/components/custom/Header";
import ProtectedRoute from "@/components/custom/ProtectedRoute";
import { supabase, isSupabaseConfigured, getCurrentUser } from "@/lib/supabase";
import { Loader2, AlertCircle, CheckCircle, XCircle, Trophy, Home } from "lucide-react";
import { useRouter } from "next/navigation";

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

type EstadoSimulado = 'configuracao' | 'em-andamento' | 'finalizado';

type QuestaoErrada = {
  questao: Questao;
  respostaUsuario: Alternativa;
};

export default function SimuladosPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoSimulado>('configuracao');
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState<number>(10);
  const [temaFiltro, setTemaFiltro] = useState<string>("todos");
  const [temasDisponiveis, setTemasDisponiveis] = useState<string[]>([]);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostas, setRespostas] = useState<(Alternativa | null)[]>([]);
  const [respostaSelecionada, setRespostaSelecionada] = useState<Alternativa | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questoesErradas, setQuestoesErradas] = useState<QuestaoErrada[]>([]);

  // Buscar temas disponíveis ao carregar
  useEffect(() => {
    const buscarTemas = async () => {
      if (!isSupabaseConfigured()) return;

      try {
        const { data, error } = await supabase!
          .from('questoes')
          .select('tema');

        if (!error && data) {
          const temasUnicos = Array.from(new Set(data.map(q => q.tema).filter(Boolean)));
          setTemasDisponiveis(temasUnicos);
        }
      } catch (err) {
        console.error("Erro ao buscar temas:", err);
      }
    };

    buscarTemas();
  }, []);

  const buscarQuestoes = async (quantidade: number, tema: string) => {
    if (!isSupabaseConfigured()) {
      setError("Supabase não está configurado. Configure as variáveis de ambiente.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase!
        .from('questoes')
        .select('*');

      // Filtrar por tema se não for "todos"
      if (tema !== "todos") {
        query = query.eq('tema', tema);
      }

      const { data, error: fetchError } = await query.limit(Math.min(quantidade * 3, 300));

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!data || data.length === 0) {
        setError("Nenhuma questão encontrada no banco de dados.");
        setLoading(false);
        return;
      }

      // Embaralhar e pegar a quantidade solicitada
      const questoesEmbaralhadas = data
        .sort(() => Math.random() - 0.5)
        .slice(0, quantidade);

      setQuestoes(questoesEmbaralhadas);
      setRespostas(new Array(quantidade).fill(null));
      setQuestoesErradas([]);
      setIndiceAtual(0);
      setEstado('em-andamento');
      setLoading(false);
    } catch (err: any) {
      console.error("Erro ao buscar questões:", err);
      setError(err.message || "Erro ao carregar questões. Verifique sua conexão.");
      setLoading(false);
    }
  };

  const registrarResposta = async (alternativa: Alternativa, correta: boolean, questaoId: string) => {
    if (!isSupabaseConfigured()) return;

    try {
      const { user } = await getCurrentUser();
      if (!user) return;

      const { error: insertError } = await supabase!
        .from('hist_questoes')
        .insert({
          user_id: user.id,
          questao_id: questaoId,
          resposta: alternativa,
          correta: correta,
          origem: 'simulado'
        });

      if (insertError) {
        console.error("Erro no histórico", insertError);
      }
    } catch (err) {
      console.error("Erro no histórico", err);
    }
  };

  const handleIniciarSimulado = () => {
    if (quantidadeQuestoes < 1 || quantidadeQuestoes > 100) {
      setError("Por favor, escolha entre 1 e 100 questões.");
      return;
    }
    buscarQuestoes(quantidadeQuestoes, temaFiltro);
  };

  const handleRespostaClick = (alternativa: Alternativa) => {
    if (mostrarResultado) return;
    
    setRespostaSelecionada(alternativa);
    setMostrarResultado(true);

    // Salvar resposta
    const novasRespostas = [...respostas];
    novasRespostas[indiceAtual] = alternativa;
    setRespostas(novasRespostas);

    // Registrar no histórico
    const questaoAtual = questoes[indiceAtual];
    const correta = alternativa === questaoAtual.correta;
    registrarResposta(alternativa, correta, questaoAtual.id);

    // Se errou, adicionar à lista de erradas
    if (!correta) {
      setQuestoesErradas(prev => [...prev, {
        questao: questaoAtual,
        respostaUsuario: alternativa
      }]);
    }
  };

  const handleProximaQuestao = () => {
    if (indiceAtual < questoes.length - 1) {
      setIndiceAtual(indiceAtual + 1);
      setRespostaSelecionada(null);
      setMostrarResultado(false);
    } else {
      setEstado('finalizado');
    }
  };

  const handleNovoSimulado = () => {
    setEstado('configuracao');
    setQuestoes([]);
    setRespostas([]);
    setIndiceAtual(0);
    setRespostaSelecionada(null);
    setMostrarResultado(false);
    setError(null);
    setQuestoesErradas([]);
  };

  const handleVoltarHome = () => {
    router.push('/home');
  };

  const calcularResultados = () => {
    let acertos = 0;
    questoes.forEach((questao, index) => {
      if (respostas[index] === questao.correta) {
        acertos++;
      }
    });

    const total = questoes.length;
    const percentual = total > 0 ? Math.round((acertos / total) * 100) : 0;

    return { acertos, total, percentual };
  };

  const getTextoAlternativa = (letra: Alternativa, questao: Questao): string => {
    const campo = `alternativa${letra}` as keyof Questao;
    return String(questao[campo] || "");
  };

  const getAlternativaStyle = (alternativa: Alternativa, questao: Questao) => {
    if (!mostrarResultado) {
      return respostaSelecionada === alternativa
        ? { backgroundColor: "#C6A239", color: "#0D1B2A" }
        : { backgroundColor: "#1B4332", color: "#E6E6E6" };
    }

    if (alternativa === questao.correta) {
      return { backgroundColor: "#2D5F3F", color: "#90EE90", border: "2px solid #90EE90" };
    }

    if (alternativa === respostaSelecionada && alternativa !== questao.correta) {
      return { backgroundColor: "#5F2D2D", color: "#FF6B6B", border: "2px solid #FF6B6B" };
    }

    return { backgroundColor: "#1B4332", color: "#B7CBBF", opacity: 0.6 };
  };

  // Tela de Configuração
  if (estado === 'configuracao') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen" style={{ backgroundColor: "#0D1B2A" }}>
          <Header />
          
          <main className="pt-24 px-6 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-8" style={{ color: "#C6A239" }}>
              Simulados
            </h1>

            <div className="p-8 rounded-lg" style={{ backgroundColor: "#1B4332", border: "2px solid #C6A239" }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: "#E6E6E6" }}>
                Configure seu Simulado
              </h2>

              {/* Quantidade de Questões */}
              <div className="mb-6">
                <label className="block text-lg font-semibold mb-3" style={{ color: "#E6E6E6" }}>
                  Quantidade de Questões
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantidadeQuestoes}
                  onChange={(e) => setQuantidadeQuestoes(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg text-lg font-semibold"
                  style={{ backgroundColor: "#0D1B2A", color: "#E6E6E6", border: "2px solid #C6A239" }}
                />
                <p className="mt-2 text-sm" style={{ color: "#B7CBBF" }}>
                  Escolha entre 1 e 100 questões
                </p>
              </div>

              {/* Opções rápidas */}
              <div className="mb-6">
                <p className="text-sm font-semibold mb-3" style={{ color: "#B7CBBF" }}>
                  Opções rápidas:
                </p>
                <div className="flex gap-3 flex-wrap">
                  {[5, 10, 20, 30, 50].map((num) => (
                    <button
                      key={num}
                      onClick={() => setQuantidadeQuestoes(num)}
                      className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
                      style={{ 
                        backgroundColor: quantidadeQuestoes === num ? "#C6A239" : "#2D5F3F",
                        color: quantidadeQuestoes === num ? "#0D1B2A" : "#E6E6E6"
                      }}
                    >
                      {num} questões
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro de Tema */}
              <div className="mb-6">
                <label className="block text-lg font-semibold mb-3" style={{ color: "#E6E6E6" }}>
                  Tema
                </label>
                <select
                  value={temaFiltro}
                  onChange={(e) => setTemaFiltro(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-lg font-semibold"
                  style={{ backgroundColor: "#0D1B2A", color: "#E6E6E6", border: "2px solid #C6A239" }}
                >
                  <option value="todos">Todos os temas</option>
                  {temasDisponiveis.map((tema) => (
                    <option key={tema} value={tema}>{tema}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: "#5F2D2D", border: "2px solid #FF6B6B" }}>
                  <p style={{ color: "#FF6B6B" }}>{error}</p>
                </div>
              )}

              <button
                onClick={handleIniciarSimulado}
                disabled={loading}
                className="w-full px-6 py-4 rounded-lg font-bold text-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ backgroundColor: "#C6A239", color: "#0D1B2A" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Carregando...
                  </>
                ) : (
                  "Iniciar Simulado"
                )}
              </button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Tela de Simulado em Andamento
  if (estado === 'em-andamento' && questoes.length > 0) {
    const questaoAtual = questoes[indiceAtual];
    const acertou = respostaSelecionada === questaoAtual.correta;

    return (
      <ProtectedRoute>
        <div className="min-h-screen" style={{ backgroundColor: "#0D1B2A" }}>
          <Header />
          
          <main className="pt-24 px-6 max-w-4xl mx-auto pb-12">
            {/* Barra de Progresso */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold" style={{ color: "#C6A239" }}>
                  Simulado em Andamento
                </h1>
                <span className="text-xl font-bold" style={{ color: "#E6E6E6" }}>
                  Questão {indiceAtual + 1} de {questoes.length}
                </span>
              </div>
              <div className="w-full h-3 rounded-full" style={{ backgroundColor: "#1B4332" }}>
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: "#C6A239",
                    width: `${((indiceAtual + 1) / questoes.length) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Card da Questão */}
            <div className="p-6 rounded-lg mb-6" style={{ backgroundColor: "#1B4332", border: "2px solid #C6A239" }}>
              {/* Tema */}
              {questaoAtual.tema && (
                <div className="mb-4">
                  <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: "#C6A239", color: "#0D1B2A" }}>
                    {questaoAtual.tema}
                  </span>
                  {questaoAtual.subtema && (
                    <span className="ml-2 px-3 py-1 rounded-full text-sm" style={{ backgroundColor: "#2D5F3F", color: "#E6E6E6" }}>
                      {questaoAtual.subtema}
                    </span>
                  )}
                </div>
              )}

              {/* Enunciado */}
              <div className="mb-6">
                <p className="text-lg leading-relaxed whitespace-pre-wrap" style={{ color: "#E6E6E6" }}>
                  {questaoAtual.enunciado}
                </p>
              </div>

              {/* Alternativas */}
              <div className="space-y-3">
                {(['A', 'B', 'C', 'D', 'E'] as Alternativa[]).map((letra) => {
                  const textoAlternativa = getTextoAlternativa(letra, questaoAtual);
                  
                  return (
                    <button
                      key={letra}
                      onClick={() => handleRespostaClick(letra)}
                      disabled={mostrarResultado}
                      className="w-full text-left p-4 rounded-lg transition-all hover:scale-[1.02] disabled:cursor-not-allowed"
                      style={getAlternativaStyle(letra, questaoAtual)}
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
                    {acertou ? "✅ Correto!" : "❌ Incorreto"}
                  </h3>
                </div>
                {!acertou && (
                  <p className="text-lg" style={{ color: "#E6E6E6" }}>
                    A resposta correta é: <span className="font-bold" style={{ color: "#90EE90" }}>{questaoAtual.correta}</span>
                  </p>
                )}
              </div>
            )}

            {/* Botão Próxima/Finalizar */}
            {mostrarResultado && (
              <div className="text-center">
                <button
                  onClick={handleProximaQuestao}
                  className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105"
                  style={{ backgroundColor: "#C6A239", color: "#0D1B2A" }}
                >
                  {indiceAtual < questoes.length - 1 ? "Próxima Questão" : "Ver Resultado Final"}
                </button>
              </div>
            )}
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Tela de Resultado Final
  if (estado === 'finalizado') {
    const { acertos, total, percentual } = calcularResultados();

    return (
      <ProtectedRoute>
        <div className="min-h-screen" style={{ backgroundColor: "#0D1B2A" }}>
          <Header />
          
          <main className="pt-24 px-6 max-w-4xl mx-auto pb-12">
            <div className="text-center mb-8">
              <Trophy className="w-20 h-20 mx-auto mb-4" style={{ color: "#C6A239" }} />
              <h1 className="text-4xl font-bold mb-2" style={{ color: "#C6A239" }}>
                Simulado Concluído!
              </h1>
              <p className="text-xl" style={{ color: "#E6E6E6" }}>
                Confira seu desempenho
              </p>
            </div>

            {/* Card de Resultados */}
            <div className="p-8 rounded-lg mb-6" style={{ backgroundColor: "#1B4332", border: "2px solid #C6A239" }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 rounded-lg" style={{ backgroundColor: "#0D1B2A" }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: "#B7CBBF" }}>
                    Total de Questões
                  </p>
                  <p className="text-4xl font-bold" style={{ color: "#C6A239" }}>
                    {total}
                  </p>
                </div>

                <div className="text-center p-6 rounded-lg" style={{ backgroundColor: "#0D1B2A" }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: "#B7CBBF" }}>
                    Acertos
                  </p>
                  <p className="text-4xl font-bold" style={{ color: "#90EE90" }}>
                    {acertos}
                  </p>
                </div>

                <div className="text-center p-6 rounded-lg" style={{ backgroundColor: "#0D1B2A" }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: "#B7CBBF" }}>
                    Percentual
                  </p>
                  <p className="text-4xl font-bold" style={{ color: "#C6A239" }}>
                    {percentual}%
                  </p>
                </div>
              </div>

              {/* Mensagem de desempenho */}
              <div className="text-center p-6 rounded-lg mb-6" style={{ 
                backgroundColor: percentual >= 70 ? "#2D5F3F" : percentual >= 50 ? "#5F5F2D" : "#5F2D2D"
              }}>
                <p className="text-xl font-bold" style={{ color: "#E6E6E6" }}>
                  {percentual >= 70 && "Excelente desempenho! Continue assim! 🎉"}
                  {percentual >= 50 && percentual < 70 && "Bom trabalho! Continue estudando! 📚"}
                  {percentual < 50 && "Continue praticando! Você vai melhorar! 💪"}
                </p>
              </div>

              {/* Lista de Questões Erradas */}
              {questoesErradas.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "#C6A239" }}>
                    Questões Erradas ({questoesErradas.length})
                  </h3>
                  <div className="space-y-4">
                    {questoesErradas.map((item, index) => (
                      <div 
                        key={index} 
                        className="p-4 rounded-lg" 
                        style={{ backgroundColor: "#0D1B2A", border: "1px solid #5F2D2D" }}
                      >
                        <p className="text-sm font-semibold mb-2" style={{ color: "#B7CBBF" }}>
                          {item.questao.tema} {item.questao.subtema && `• ${item.questao.subtema}`}
                        </p>
                        <p className="mb-3" style={{ color: "#E6E6E6" }}>
                          {item.questao.enunciado}
                        </p>
                        <div className="flex gap-4 text-sm">
                          <p style={{ color: "#FF6B6B" }}>
                            Sua resposta: <span className="font-bold">{item.respostaUsuario}</span>
                          </p>
                          <p style={{ color: "#90EE90" }}>
                            Correta: <span className="font-bold">{item.questao.correta}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleVoltarHome}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105"
                style={{ backgroundColor: "#1B4332", color: "#E6E6E6", border: "2px solid #C6A239" }}
              >
                <Home className="w-5 h-5" />
                Voltar para Home
              </button>
              <button
                onClick={handleNovoSimulado}
                className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105"
                style={{ backgroundColor: "#C6A239", color: "#0D1B2A" }}
              >
                Fazer Outro Simulado
              </button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return null;
}
