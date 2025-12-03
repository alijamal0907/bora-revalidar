"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"

interface Question {
  id: string
  questao: string
  alternativas: any
  resposta_correta: string
  tema?: string
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

  if (questions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground mb-4">Nenhuma questão disponível para revisão.</p>
        <Button onClick={onComplete}>Voltar</Button>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  const handleAnswerSelect = (answer: string) => {
    if (!showResult) {
      setSelectedAnswer(answer)
    }
  }

  const handleSubmit = () => {
    if (!selectedAnswer) return

    const isCorrect = selectedAnswer === currentQuestion.resposta_correta
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
          {Object.entries(currentQuestion.alternativas).map(([key, value]: [string, any]) => {
            const isSelected = selectedAnswer === key
            const isCorrect = key === currentQuestion.resposta_correta
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
                      : isSelected
                        ? "border-primary bg-primary/5"
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
                            : isSelected
                              ? "text-primary"
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

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {!showResult ? (
            <Button onClick={handleSubmit} disabled={!selectedAnswer} className="flex-1">
              Confirmar Resposta
            </Button>
          ) : (
            <Button onClick={handleNext} className="flex-1">
              {isLastQuestion ? "Finalizar Revisão" : "Próxima Questão"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
