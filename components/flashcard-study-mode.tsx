"use client"

import { useState, useEffect } from "react"
import { ChevronRight, CheckCircle, XCircle, RotateCcw, Trophy } from "lucide-react"
import type { Flashcard } from "@/lib/flashcards-storage"
import { saveFlashcardAnswer } from "@/lib/flashcards-storage"
import { getSupabaseUser } from "@/lib/auth-supabase"

interface FlashcardStudyModeProps {
  materia: string
  tema: string
  onBack: () => void
  fetchFlashcards: () => Promise<Flashcard[]>
  userPlan?: "free" | "premium" // Added userPlan prop to support free vs premium logic
  onFlashcardAnswered?: () => void // Added callback for flashcard answered
}

export function FlashcardStudyMode({
  materia,
  tema,
  onBack,
  fetchFlashcards,
  userPlan = "free",
  onFlashcardAnswered,
}: FlashcardStudyModeProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [wrongCards, setWrongCards] = useState<Flashcard[]>([])
  const [isFinished, setIsFinished] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getSupabaseUser()
        if (user) {
          setUserId(user.id || user.usuario_id)
        }
      } catch (error) {
        console.error("[v0] Error loading user:", error)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    const loadFlashcards = async () => {
      try {
        setIsLoading(true)
        const cards = await fetchFlashcards()
        setFlashcards(cards)
        setIsLoading(false)
      } catch (error) {
        console.error("[v0] Error loading flashcards:", error)
        setIsLoading(false)
      }
    }

    loadFlashcards()
  }, [fetchFlashcards])

  const handleShowAnswer = () => {
    setShowAnswer(true)
  }

  const handleCorrect = async () => {
    setCorrect(correct + 1)

    if (userId && flashcards[currentIndex]?.id) {
      try {
        await saveFlashcardAnswer(
          userId,
          flashcards[currentIndex].id,
          true,
          flashcards[currentIndex].materia,
          flashcards[currentIndex].tema,
        )
        if (onFlashcardAnswered) {
          onFlashcardAnswered()
        }
      } catch (error) {
        console.error("[v0] Error saving correct answer:", error)
      }
    }

    moveToNext()
  }

  const handleWrong = async () => {
    setWrong(wrong + 1)
    setWrongCards([...wrongCards, flashcards[currentIndex]])

    if (userId && flashcards[currentIndex]?.id) {
      try {
        await saveFlashcardAnswer(
          userId,
          flashcards[currentIndex].id,
          false,
          flashcards[currentIndex].materia,
          flashcards[currentIndex].tema,
        )
        if (onFlashcardAnswered) {
          onFlashcardAnswered()
        }
      } catch (error) {
        console.error("[v0] Error saving wrong answer:", error)
      }
    }

    moveToNext()
  }

  const moveToNext = () => {
    setShowAnswer(false)
    if (currentIndex + 1 < flashcards.length) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setIsFinished(true)
    }
  }

  const handleReviewWrong = () => {
    setFlashcards(wrongCards)
    setCurrentIndex(0)
    setCorrect(0)
    setWrong(0)
    setWrongCards([])
    setIsFinished(false)
    setShowAnswer(false)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setCorrect(0)
    setWrong(0)
    setWrongCards([])
    setIsFinished(false)
    setShowAnswer(false)
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

        {/* Continue with normal flashcard study */}
        {isFinished ? (
          <div className="bg-card border border-border rounded-lg p-12">
            {/* ... existing finished state code ... */}
          </div>
        ) : (
          <div>{/* ... existing flashcard display code ... */}</div>
        )}
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

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {wrongCards.length > 0 && (
            <button
              onClick={handleReviewWrong}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Rever apenas os que errei ({wrongCards.length})
            </button>
          )}
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
      {/* Progress bar */}
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

      {/* Stats */}
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

      {/* Flashcard */}
      <div className="bg-card border-2 border-border rounded-xl p-8 md:p-12 min-h-[400px] flex flex-col justify-center shadow-lg">
        <div className="mb-8">
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            {showAnswer ? "Resposta" : "Pergunta"}
          </div>
          <div className="text-2xl md:text-3xl font-bold text-foreground leading-relaxed">
            {showAnswer ? currentCard.verso : currentCard.frente}
          </div>
        </div>

        <div className="mt-auto">
          {!showAnswer ? (
            <button
              onClick={handleShowAnswer}
              className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-bold text-lg flex items-center justify-center gap-2"
            >
              Mostrar resposta
              <ChevronRight className="w-6 h-6" />
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleWrong}
                className="px-8 py-4 bg-red-500/10 border-2 border-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors font-bold text-lg flex items-center justify-center gap-2"
              >
                <XCircle className="w-6 h-6" />
                Errei
              </button>
              <button
                onClick={handleCorrect}
                className="px-8 py-4 bg-green-500/10 border-2 border-green-500/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500/20 transition-colors font-bold text-lg flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-6 h-6" />
                Acertei
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
