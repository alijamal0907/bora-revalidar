"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ChevronLeft } from "lucide-react"

interface Question {
  id: string
  questao: string
  alternativas: any
  resposta_correta: string
  tema?: string
  explicacao?: string | null
}

interface QuestionStudyModeProps {
  questions: Question[]
  onComplete: () => void
  isReviewMode?: boolean
}

export function QuestionStudyMode({ questions, onComplete, isReviewMode = false }: QuestionStudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState<boolean[]>([])

  const parseAlternativas = (alternativas: any): Record<string, string> => {
    if (!alternativas) return {}

    // Se já é um objeto válido
    if (typeof alternativas === "object" && !Array.isArray(alternativas)) {
      return alternativas
    }

    // Se é uma string JSON, tenta fazer parse
    if (typeof alternativas === "string") {
      try {
        const parsed = JSON.parse(alternativas)
        if (typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed
        }
      } catch (e) {
        return {}
      }
    }

    return {}
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground mb-4">Nenhuma questão disponível para revisão.</p>
        <Button onClick={onComplete}>Voltar</Button>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  const alternativasObj = currentQuestion ? parseAlternativas(currentQuestion.alternativas) : {}
  const alternativasEntries = Object.entries(alternativasObj)

  if (!currentQuestion) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground mb-4">Erro ao carregar questão. Por favor, volte e tente novamente.</p>
        <Button onClick={onComplete}>Voltar</Button>
      </div>
    )
  }

  if (alternativasEntries.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground mb-4">Esta questão não possui alternativas válidas no banco de dados.</p>
        <p className="text-sm text-muted-foreground mb-4">ID da questão: {currentQuestion.id}</p>
        <div className="flex gap-3 justify-center">
          {currentIndex > 0 && (
            <Button variant="outline" onClick={() => setCurrentIndex(currentIndex - 1)}>
              Questão Anterior
            </Button>
          )}
          {currentIndex < questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex(currentIndex + 1)}>Próxima Questão</Button>
          ) : (
            <Button onClick={onComplete}>Voltar</Button>
          )}
        </div>
      </div>
    )
  }

  const isLastQuestion = currentIndex === questions.length - 1

  const handleAnswerSelect = (answer: string) => {
    if (!showResult) {
      setSelectedAnswer(answer)
    }
  }

  const handleSubmit = () => {
    if (!selectedAnswer) return

    const normalizedSelected = selectedAnswer.toUpperCase()
    const normalizedCorrect = (currentQuestion.resposta_correta || "").toUpperCase()
    const isCorrect = normalizedSelected === normalizedCorrect
    setResults([...results, isCorrect])
    setShowResult(true)
  }

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete()
    } else {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setSelectedAnswer(null)
      setShowResult(false)
      if (results.length > currentIndex) {
        setResults(results.slice(0, -1))
      }
    }
  }

  const correctCount = results.filter((r) => r).length
  const totalAnswered = results.length

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Questão {currentIndex + 1} de {questions.length}
          </span>
          {totalAnswered > 0 && (
            <span className="text-sm text-muted-foreground">
              Acertos: {correctCount}/{totalAnswered}
            </span>
          )}
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="mb-6">
          {currentQuestion.tema && (
            <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full mb-4">
              {currentQuestion.tema}
            </span>
          )}
          <p className="text-lg text-foreground font-medium leading-relaxed">{currentQuestion.questao}</p>
        </div>

        {/* Answers */}
        <div className="space-y-3">
          {alternativasEntries.map(([key, value]: [string, any]) => {
            const isSelected = selectedAnswer === key
            const isCorrect = key.toUpperCase() === (currentQuestion.resposta_correta || "").toUpperCase()
            const showCorrect = showResult && isCorrect
            const showWrong = showResult && isSelected && !isCorrect

            return (
              <button
                key={key}
                onClick={() => handleAnswerSelect(key)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  showCorrect
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : showWrong
                      ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                      : isSelected && !showResult
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                } ${showResult ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span
                      className={`font-bold text-sm ${
                        showCorrect
                          ? "text-green-600 dark:text-green-400"
                          : showWrong
                            ? "text-red-600 dark:text-red-400"
                            : isSelected && !showResult
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-muted-foreground"
                      }`}
                    >
                      {key})
                    </span>
                    <span
                      className={`${
                        showCorrect
                          ? "text-green-900 dark:text-green-100"
                          : showWrong
                            ? "text-red-900 dark:text-red-100"
                            : "text-foreground"
                      }`}
                    >
                      {value}
                    </span>
                  </div>
                  {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />}
                  {showWrong && <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Added visual indicator when an option is selected */}
        {selectedAnswer && !showResult && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              ✓ Alternativa <strong>{selectedAnswer}</strong> selecionada. Você pode mudar sua escolha clicando em outra
              alternativa antes de confirmar.
            </p>
          </div>
        )}

        {showResult && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              selectedAnswer?.toUpperCase() === (currentQuestion.resposta_correta || "").toUpperCase()
                ? "bg-green-50 dark:bg-green-950/20 border-2 border-green-500"
                : "bg-red-50 dark:bg-red-950/20 border-2 border-red-500"
            }`}
          >
            <p
              className={`font-semibold ${
                selectedAnswer?.toUpperCase() === (currentQuestion.resposta_correta || "").toUpperCase()
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {selectedAnswer?.toUpperCase() === (currentQuestion.resposta_correta || "").toUpperCase()
                ? "✓ Resposta correta!"
                : "✗ Resposta incorreta"}
            </p>
            {selectedAnswer?.toUpperCase() !== (currentQuestion.resposta_correta || "").toUpperCase() && (
              <p className="text-sm mt-2 text-muted-foreground">
                A resposta correta é: <strong>{(currentQuestion.resposta_correta || "").toUpperCase()}</strong>
              </p>
            )}
          </div>
        )}

        {/* Justificativa da questão - sempre mostra após confirmar */}
        {showResult && (
          <div className="mt-4 rounded-lg p-4 border-2 border-[#C6A239] bg-[#0D1B2A]">
            <h3 className="font-semibold mb-2 text-[#C6A239] flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Justificativa da questão
            </h3>
            {currentQuestion.explicacao ? (
              <p className="text-sm leading-relaxed text-[#E6E6E6]">{currentQuestion.explicacao}</p>
            ) : (
              <p className="text-sm leading-relaxed text-[#C6A239] italic">
                A justificativa desta questão será carregada em breve. Continuamos trabalhando para melhorar seu estudo!
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {currentIndex > 0 && !showResult && (
            <Button variant="outline" onClick={handlePrevious} className="flex items-center gap-2 bg-transparent">
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </Button>
          )}
          {!showResult ? (
            <Button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className={`flex-1 text-lg py-6 font-semibold ${selectedAnswer ? "animate-pulse" : ""}`}
              size="lg"
            >
              Confirmar Resposta
            </Button>
          ) : (
            <Button onClick={handleNext} className="flex-1 text-lg py-6" size="lg">
              {isLastQuestion ? "Finalizar Revisão" : "Próxima Questão"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
