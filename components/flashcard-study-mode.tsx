"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, CheckCircle, XCircle, RotateCcw, Trophy, Zap } from "lucide-react"
import type { Flashcard } from "@/lib/flashcards-storage"
import { saveFlashcardAnswer, deleteFlashcardAnswer } from "@/lib/flashcards-storage"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { generateSmartContent, updateLearningStatus, type SmartFlashcard } from "@/lib/smart-flashcards-v2"

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
  const [selectedAnswer, setSelectedAnswer] = useState<"correct" | "wrong" | null>(null)
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
            
            // Pula apenas se falhou completamente na geração (caso extremamente raro)
            if (!smartContent || !smartContent.alternativa_tendenciosa) {
              console.warn(`[v0] ⚠️ Flashcard pulado - falha crítica na geração`)
              return null
            }
            
            return {
              ...card,
              alternativa_tendenciosa: smartContent.alternativa_tendenciosa,
              comentario_explicativo: smartContent.comentario_explicativo,
            }
          })
        )

        // Remove nulls
        const validCards = cardsWithSmartContent.filter((card): card is SmartFlashcardExtended => card !== null)

        console.log(`[v0] ${validCards.length}/${orderedCards.length} flashcards carregados com sucesso`)

        // Armazena todos os flashcards disponiveis
        setAllFlashcards(validCards)
        
        // Mostra apenas a quantidade selecionada inicialmente
        setFlashcards(validCards.slice(0, selectedQuantity))
        
        // Verifica se ha mais flashcards para revelar
        setCanLoadMore(validCards.length > selectedQuantity)
        
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading flashcards:", error)
        setIsLoading(false)
      }
    }

    loadFlashcards()
  }, [fetchFlashcards, userId, selectedQuantity])

  // Ordena flashcards com repeticao inteligente APRIMORADA
  const orderWithSmartRepetition = async (cards: Flashcard[]) => {
    const cardsWithPriority = cards.map((card, index) => {
      const state = learningStates.get(card.id)
      let priority = 0

      if (!state || state.status === "novo") {
        priority = 1000 + index // Novos tem prioridade ABAIXO de errou_2
      } else if (state.status === "errou_1") {
        // Reaparece apos 3 cards
        const interval = interactionCount - state.lastAnswered
        if (interval >= 3) {
          priority = -500 // Prioridade media-alta
        } else {
          priority = 9999 // Baixa prioridade (ainda nao e hora)
        }
      } else if (state.status === "errou_2") {
        // Reaparece apos 6 cards - MAXIMA PRIORIDADE sobre novos
        const interval = interactionCount - state.lastAnswered
        if (interval >= 6) {
          priority = -2000 // Maxima prioridade (acima de novos)
        } else {
          priority = 9999 // Baixa prioridade
        }
      } else if (state.status === "consolidado") {
        priority = 10000 // Consolidados vao pro final
      }

      return { card, priority, state }
    })

    // Ordena por prioridade
    const sorted = cardsWithPriority.sort((a, b) => a.priority - b.priority)

    // BLINDAGEM: Evita repeticao dentro de 2 cards consecutivos
    const finalOrder: Flashcard[] = []
    const used = new Set<string>()

    for (const item of sorted) {
      // Verifica se algum dos ultimos 2 cards e o mesmo
      const lastTwoIds = finalOrder.slice(-2).map(c => c.id)
      if (lastTwoIds.includes(item.card.id)) {
        continue // Pula, ja apareceu recentemente
      }
      finalOrder.push(item.card)
      used.add(item.card.id)
    }

    // Adiciona os que sobraram no final (se houver)
    for (const item of sorted) {
      if (!used.has(item.card.id)) {
        finalOrder.push(item.card)
      }
    }

    return finalOrder
  }

  // Embaralha opcoes quando muda de card
  useEffect(() => {
    if (flashcards.length > 0 && currentIndex < flashcards.length) {
      const card = flashcards[currentIndex]
      const options = [
        { text: card.verso, isCorrect: true },
        { text: card.alternativa_tendenciosa || card.verso + " (alternativa)", isCorrect: false },
      ]
      // Embaralha
      setShuffledOptions(options.sort(() => Math.random() - 0.5))
      setSelectedAnswer(null)
      setShowFeedback(false)
    }
  }, [currentIndex, flashcards])

  const handleAnswerSelect = async (isCorrect: boolean) => {
    setSelectedAnswer(isCorrect ? "correct" : "wrong")
    setShowFeedback(true)
    setInteractionCount(prev => prev + 1)

    const currentCard = flashcards[currentIndex]
    const currentState = learningStates.get(currentCard.id)

    if (isCorrect) {
      setCorrect(prev => prev + 1)

      // Logica de status: acerto apos erro = consolidado
      let newStatus: LearningStatus = "consolidado"
      if (!currentState || currentState.status === "novo") {
        newStatus = "consolidado"
      } else if (currentState.status === "errou_1" || currentState.status === "errou_2") {
        newStatus = "consolidado" // Acertou apos erro
      }

      // Atualiza estado
      setLearningStates(prev => {
        const newMap = new Map(prev)
        newMap.set(currentCard.id, {
          flashcardId: currentCard.id,
          status: newStatus,
          wrongCount: currentState?.wrongCount || 0,
          lastAnswered: interactionCount,
        })
        return newMap
      })

      // Salva no banco
      if (userId && currentCard?.id) {
        try {
          await saveFlashcardAnswer(userId, currentCard.id, true, currentCard.materia, currentCard.tema)
          await updateLearningStatus(userId, currentCard.id, true, interactionCount)
          if (onFlashcardAnswered) onFlashcardAnswered()
        } catch (error) {
          console.error("Error saving correct answer:", error)
        }
      }

      // Se acertou, avanca automaticamente apos 1 segundo
      setTimeout(() => {
        moveToNext()
      }, 1000)
    } else {
      setWrong(prev => prev + 1)

      // Logica de status: erro 1 = errou_1, erro 2+ = errou_2
      const newWrongCount = (currentState?.wrongCount || 0) + 1
      let newStatus: LearningStatus = newWrongCount === 1 ? "errou_1" : "errou_2"

      // Atualiza estado
      setLearningStates(prev => {
        const newMap = new Map(prev)
        newMap.set(currentCard.id, {
          flashcardId: currentCard.id,
          status: newStatus,
          wrongCount: newWrongCount,
          lastAnswered: interactionCount,
        })
        return newMap
      })

      // Salva no banco
      if (userId && currentCard?.id) {
        try {
          await saveFlashcardAnswer(userId, currentCard.id, false, currentCard.materia, currentCard.tema)
          await updateLearningStatus(userId, currentCard.id, false, interactionCount)
          if (onFlashcardAnswered) onFlashcardAnswered()
        } catch (error) {
          console.error("Error saving wrong answer:", error)
        }
      }

      // Se errou, usuario precisa ler o comentario antes de avancar
      // Nao avanca automaticamente
    }
  }

  const moveToNext = () => {
    setSelectedAnswer(null)
    setShowFeedback(false)
    setShowAnswer(false)
    if (currentIndex + 1 < flashcards.length) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setIsFinished(true)
    }
  }

  const handleRevealMore = async () => {
    setIsLoadingMore(true)
    
    // Adiciona mais 10 flashcards ou o restante disponivel
    const currentLength = flashcards.length
    const additionalCards = allFlashcards.slice(currentLength, currentLength + 10)
    
    if (additionalCards.length > 0) {
      setFlashcards([...flashcards, ...additionalCards])
      setCanLoadMore(currentLength + additionalCards.length < allFlashcards.length)
      
      console.log(`[v0] Revelados +${additionalCards.length} flashcards (total: ${currentLength + additionalCards.length}/${allFlashcards.length})`)
    }
    
    setIsLoadingMore(false)
  }

  const handleRestart = async () => {
    setCurrentIndex(0)
    setCorrect(0)
    setWrong(0)
    setIsFinished(false)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setLearningStates(new Map())
    setInteractionCount(0)
    
    // Recarrega flashcards
    try {
      setIsLoading(true)
      const cards = await fetchFlashcards()
      const orderedCards = await orderWithSmartRepetition(cards)
      const cardsWithSmartContent = await Promise.all(
        orderedCards.map(async (card) => {
          const smartContent = await generateSmartContent(card as SmartFlashcard)
          if (!smartContent || !smartContent.alternativa_tendenciosa) {
            return null
          }
          return {
            ...card,
            alternativa_tendenciosa: smartContent.alternativa_tendenciosa,
            comentario_explicativo: smartContent.comentario_explicativo,
          }
        })
      )
      const validCards = cardsWithSmartContent.filter((card): card is SmartFlashcardExtended => card !== null)
      
      console.log(`[v0] Restart: ${validCards.length} flashcards recarregados`)
      
      setAllFlashcards(validCards)
      setFlashcards(validCards.slice(0, selectedQuantity))
      setCanLoadMore(validCards.length > selectedQuantity)
      setIsLoading(false)
    } catch (error) {
      console.error("Error reloading flashcards:", error)
      setIsLoading(false)
    }
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
        {/* Badge de modo inteligente */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-violet-500/10 to-purple-500/10">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
              Flashcards Inteligentes - Escolha a alternativa correta
            </span>
          </div>
        </div>

        {/* Pergunta */}
        <div className="p-8 md:p-12 border-b border-border">
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
            Pergunta
          </div>
          <div className="text-xl md:text-2xl font-bold text-foreground leading-relaxed text-balance">
            {currentCard.frente}
          </div>
        </div>

        {/* Alternativas */}
        {!showFeedback && (
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
            {selectedAnswer === "correct" ? (
              <div className="bg-green-500/10 border-2 border-green-500/20 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-bold text-green-600 dark:text-green-400">Correto!</h3>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Avancando automaticamente...
                </p>
              </div>
            ) : (
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
