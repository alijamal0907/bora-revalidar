"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, CheckCircle, XCircle, RotateCcw, Trophy, Zap, Eye } from "lucide-react"
import type { Flashcard } from "@/lib/flashcards-storage"
import { saveFlashcardAnswer, deleteFlashcardAnswer } from "@/lib/flashcards-storage"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { generateSmartContent, updateLearningStatus, type SmartFlashcard } from "@/lib/smart-flashcards-v3"
import { orderWithSmartRepetition } from "@/lib/smart-repetition"

interface FlashcardStudyModeProps {
  materia: string
  tema: string
  onBack: () => void
  fetchFlashcards: () => Promise<Flashcard[]>
  userPlan?: "free" | "premium"
  onFlashcardAnswered?: () => void
  selectedQuantity?: number
}

// Tipo estendido com conteudo inteligente
interface SmartFlashcardExtended extends Flashcard {
  alternativa_tendenciosa?: string
  comentario_explicativo?: string
  modo_classico?: boolean
}

// Status de aprendizado
type LearningStatus = "novo" | "errou_1" | "errou_2" | "consolidado"

// Rastreamento de status por flashcard
interface FlashcardLearningState {
  flashcardId: string
  status: LearningStatus
  wrongCount: number
  lastAnswered: number // indice da ultima resposta
}

function FlashcardStudyMode({
  materia,
  tema,
  onBack,
  fetchFlashcards,
  userPlan = "free",
  onFlashcardAnswered,
  selectedQuantity = 10,
}: FlashcardStudyModeProps) {
  const [flashcards, setFlashcards] = useState<SmartFlashcardExtended[]>([])
  const [allFlashcards, setAllFlashcards] = useState<SmartFlashcardExtended[]>([]) // Armazena todos os flashcards disponiveis
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<"correct" | "wrong" | "reveal" | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [learningStates, setLearningStates] = useState<Map<string, FlashcardLearningState>>(new Map())
  const [shuffledOptions, setShuffledOptions] = useState<{ text: string; isCorrect: boolean }[]>([])
  const [interactionCount, setInteractionCount] = useState(0)
  const [wrongCards, setWrongCards] = useState<Flashcard[]>([])
  const [answersMap, setAnswersMap] = useState<Map<number, { flashcardId: string; correct: boolean; answeredAt: string }>>(new Map())
  const [canLoadMore, setCanLoadMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [previousAnswer, setPreviousAnswer] = useState<{ flashcardId: string; correct: boolean; answeredAt: string } | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getSupabaseUser()
        if (user) {
          setUserId(user.id || user.usuario_id)
        }
      } catch (error) {
        console.error("Error loading user:", error)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    const loadFlashcards = async () => {
      try {
        setIsLoading(true)
        const cards = await fetchFlashcards()

        // Ordena com repeticao inteligente
        const orderedCards = await orderWithSmartRepetition(cards)
        
        // Gera conteudo inteligente para cada flashcard
        const cardsWithSmartContent = await Promise.all(
          orderedCards.map(async (card) => {
            const smartContent = await generateSmartContent(card as SmartFlashcard)
            
            // NUNCA pula flashcard - sempre retorna com modo_classico se necessário
            return {
              ...card,
              alternativa_tendenciosa: smartContent.alternativa_tendenciosa,
              comentario_explicativo: smartContent.comentario_explicativo,
              modo_classico: smartContent.modo_classico || false,
            }
          })
        )

        console.log(`[v0] ${cardsWithSmartContent.length}/${orderedCards.length} flashcards carregados (100%)`)

        // Armazena todos os flashcards disponiveis
        setAllFlashcards(cardsWithSmartContent)
        
        // Mostra apenas a quantidade selecionada inicialmente
        setFlashcards(cardsWithSmartContent.slice(0, selectedQuantity))
        setCanLoadMore(cardsWithSmartContent.length > selectedQuantity)
        setIsLoading(false)
      } catch (error) {
        console.error("Error reloading flashcards:", error)
        setIsLoading(false)
      }
    }
    loadFlashcards()
  }, [])

  const handleAnswerSelect = async (isCorrect: boolean) => {
    const currentCard = flashcards[currentIndex]
    const answeredAt = new Date().toISOString()

    setAnswersMap((prevMap) => prevMap.set(currentIndex, { flashcardId: currentCard.id, correct: isCorrect, answeredAt }))

    if (isCorrect) {
      setCorrect(correct + 1)
    } else {
      setWrong(wrong + 1)
      setWrongCards((prevWrongCards) => [...prevWrongCards, currentCard])
    }

    setInteractionCount(interactionCount + 1)
    setShowFeedback(true)

    // Update learning status
    const currentLearningState = learningStates.get(currentCard.id) || { flashcardId: currentCard.id, status: "novo", wrongCount: 0, lastAnswered: currentIndex }
    const newStatus = isCorrect ? "consolidado" : currentLearningState.status === "novo" ? "errou_1" : "errou_2"
    const newWrongCount = isCorrect ? 0 : currentLearningState.wrongCount + 1

    setLearningStates((prevStates) => prevStates.set(currentCard.id, { ...currentLearningState, status: newStatus, wrongCount: newWrongCount, lastAnswered: currentIndex }))
  }

  const handleCorrect = async () => {
    await handleAnswerSelect(true)
  }

  const handleWrong = async () => {
    await handleAnswerSelect(false)
  }

  const formatAnswerInTopics = (text: string) => {
    if (!text) return null

    // Divide por pontos, ponto e vírgula, ou quebras de linha
    const sentences = text
      .split(/[.;]\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    // Se tiver apenas uma frase curta, retorna sem formatação
    if (sentences.length <= 1 && text.length < 100) {
      return <p className="text-xl md:text-2xl leading-relaxed text-foreground">{text}</p>
    }

    // Se tiver múltiplas frases ou uma longa, formata em tópicos
    return (
      <ul className="space-y-4">
        {sentences.map((sentence, index) => (
          <li key={index} className="flex items-start gap-3 group">
            <span className="flex-shrink-0 w-7 h-7 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-bold mt-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {index + 1}
            </span>
            <span className="text-lg md:text-xl leading-relaxed text-foreground flex-1">
              {sentence}
              {!sentence.endsWith(".") && !sentence.endsWith("!") && !sentence.endsWith("?") && "."}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  const handleReviewWrong = () => {
    // Implement logic to review wrong cards
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleRevealMore = async () => {
    setIsLoadingMore(true)
    const newFlashcards = allFlashcards.slice(flashcards.length, flashcards.length + selectedQuantity)
    setFlashcards((prevFlashcards) => [...prevFlashcards, ...newFlashcards])
    setCanLoadMore(allFlashcards.length > flashcards.length + selectedQuantity)
    setIsLoadingMore(false)
  }

  const handleRestart = () => {
    setFlashcards(allFlashcards.slice(0, selectedQuantity))
    setCurrentIndex(0)
    setCorrect(0)
    setWrong(0)
    setCanLoadMore(allFlashcards.length > selectedQuantity)
    setInteractionCount(0)
    setWrongCards([])
    setAnswersMap(new Map())
    setLearningStates(new Map())
  }

  const moveToNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowFeedback(false)
    } else {
      setIsFinished(true)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando flashcards...</p>
      </div>
    )
  }

  if (flashcards.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📚</span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Nenhum flashcard disponível</h3>
          <p className="text-muted-foreground">
            Ainda não há flashcards cadastrados para este tema. Em breve adicionaremos conteúdo aqui.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          Voltar
        </button>
      </div>
    )
  }

  if (userPlan === "free" && flashcards.length === 5) {
    return (
      <div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">
                Versão Gratuita - Limite de 5 flashcards
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                Você está visualizando apenas os primeiros 5 flashcards deste tema. Faça upgrade para premium para
                acessar todos os flashcards disponíveis e revisar seus erros.
              </p>
              <button
                onClick={() => (window.location.href = "/upgrade")}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-semibold text-sm"
              >
                Fazer Upgrade
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isFinished) {
    const totalCards = correct + wrong
    const accuracy = totalCards > 0 ? Math.round((correct / totalCards) * 100) : 0

    return (
      <div className="bg-card border border-border rounded-lg p-12">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Sessão concluída!</h2>
          <p className="text-muted-foreground">Confira seu desempenho</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Total de cards</p>
            <p className="text-4xl font-bold text-foreground">{totalCards}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
            <p className="text-sm text-green-600 dark:text-green-400 mb-2">Acertos</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{correct}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">Erros</p>
            <p className="text-4xl font-bold text-red-600 dark:text-red-400">{wrong}</p>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">Taxa de acerto</p>
          <p className="text-5xl font-bold text-primary">{accuracy}%</p>
        </div>

        {/* Botao de revelar mais flashcards */}
        {canLoadMore && (
          <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">Continuar revisando?</h3>
                <p className="text-sm text-muted-foreground">
                  Ainda existem {allFlashcards.length - flashcards.length} flashcards disponíveis para estudo
                </p>
              </div>
              <button
                onClick={() => {
                  setIsFinished(false)
                  handleRevealMore()
                }}
                disabled={isLoadingMore}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <Zap className="w-5 h-5" />
                {isLoadingMore ? "Carregando..." : "Revelar mais"}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Recomeçar
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-semibold"
          >
            Escolher outro tema
          </button>
        </div>
      </div>
    )
  }

  const currentCard = flashcards[currentIndex]
  const progress = ((currentIndex + 1) / flashcards.length) * 100

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-muted-foreground">
            Card {currentIndex + 1} de {flashcards.length}
          </span>
          <span className="text-sm font-semibold text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">Acertos</span>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">{correct}</span>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-red-600 dark:text-red-400">Erros</span>
          <span className="text-2xl font-bold text-red-600 dark:text-red-400">{wrong}</span>
        </div>
      </div>

      <div className="bg-card border-2 border-border rounded-xl shadow-lg">
        {/* Badge - modo inteligente ou clássico */}
        {!currentCard.modo_classico ? (
          <div className="p-4 border-b border-border bg-gradient-to-r from-violet-500/10 to-purple-500/10">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-500" />
              <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                Flashcards Inteligentes - Escolha a alternativa correta
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-border bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                Flashcard Clássico
              </span>
            </div>
          </div>
        )}

        {/* Pergunta */}
        <div className="p-8 md:p-12 border-b border-border">
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
            Pergunta
          </div>
          <div className="text-xl md:text-2xl font-bold text-foreground leading-relaxed text-balance">
            {currentCard.frente}
          </div>
        </div>

        {/* MODO CLÁSSICO: Apenas botão "Mostrar resposta" */}
        {currentCard.modo_classico && !showFeedback && (
          <div className="p-8 md:p-12">
            <button
              onClick={() => {
                setShowFeedback(true)
                setSelectedAnswer("reveal")
              }}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors font-bold text-lg flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Mostrar resposta
            </button>
          </div>
        )}

        {/* MODO INTELIGENTE: Alternativas */}
        {!currentCard.modo_classico && !showFeedback && (
          <div className="p-8 md:p-12 space-y-4">
            <p className="text-sm text-muted-foreground mb-4">Selecione a alternativa correta:</p>
            {shuffledOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option.isCorrect)}
                className="w-full p-6 text-left bg-muted/50 hover:bg-muted border-2 border-border hover:border-primary/50 rounded-xl transition-all text-base md:text-lg leading-relaxed"
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option.text}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Feedback apos resposta */}
        {showFeedback && (
          <div className="p-8 md:p-12">
            {/* MODO CLÁSSICO: Mostra resposta e botões Acertei/Errei */}
            {currentCard.modo_classico && selectedAnswer === "reveal" && (
              <div>
                <div className="bg-blue-500/10 border-2 border-blue-500/20 rounded-xl p-6 mb-6">
                  <div className="inline-block px-4 py-2 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold mb-4">
                    Resposta
                  </div>
                  <div className="text-lg md:text-xl text-foreground leading-relaxed">
                    {formatAnswerInTopics(currentCard.verso)}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Você acertou ou errou?
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleCorrect}
                    className="px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold text-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Acertei
                  </button>
                  <button
                    onClick={handleWrong}
                    className="px-6 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold text-lg flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Errei
                  </button>
                </div>
              </div>
            )}

            {/* MODO INTELIGENTE: Feedback normal */}
            {!currentCard.modo_classico && selectedAnswer === "correct" && (
              <div className="bg-green-500/10 border-2 border-green-500/20 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-bold text-green-600 dark:text-green-400">Correto!</h3>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Avancando automaticamente...
                </p>
              </div>
            )}

            {!currentCard.modo_classico && selectedAnswer !== "correct" && selectedAnswer !== "reveal" && (
              <div>
                <div className="bg-red-500/10 border-2 border-red-500/20 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Incorreto</h3>
                  </div>
                </div>

                {/* Comentario explicativo */}
                {currentCard.comentario_explicativo && (
                  <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-xl p-6 mb-6">
                    <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-3">
                      Por que errei?
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                      {currentCard.comentario_explicativo}
                    </p>
                  </div>
                )}

                {/* Botao para avancar */}
                <button
                  onClick={moveToNext}
                  className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-bold text-lg"
                >
                  Próximo flashcard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { FlashcardStudyMode }
export default FlashcardStudyMode
