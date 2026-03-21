"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Brain, 
  BookOpen,
  RotateCcw,
  Trophy,
  Target
} from "lucide-react"
import { recordReviewResult, type ReviewItem } from "@/lib/spaced-repetition-v2"
import { createClient } from "@/lib/supabase/client"
import { saveQuizAnswer } from "@/lib/storage-supabase"
import { cn } from "@/lib/utils"

interface CombinedReviewModeProps {
  userId: string
  dueItems: ReviewItem[]
  onComplete: () => void
  onBack: () => void
}

interface EnrichedItem extends ReviewItem {
  // Flashcard fields
  frente?: string
  verso?: string
  alternativa_tendenciosa?: string
  materia?: string
  tema?: string
  // Question fields
  enunciado?: string
  alternativas?: Record<string, string>
  resposta_correta?: string
  explicacao?: string
  subtema?: string
}

export function CombinedReviewMode({ userId, dueItems, onComplete, onBack }: CombinedReviewModeProps) {
  const [items, setItems] = useState<EnrichedItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState<{ itemId: string; correct: boolean }[]>([])
  const [shuffledOptions, setShuffledOptions] = useState<{ text: string; isCorrect: boolean }[]>([])

  // Load enriched content
  useEffect(() => {
    const loadContent = async () => {
      if (dueItems.length === 0) {
        setIsLoading(false)
        return
      }

      const supabase = createClient()
      const enrichedItems: EnrichedItem[] = []

      const flashcardIds = dueItems
        .filter(i => i.content_type === 'flashcard')
        .map(i => i.content_id)
      const questionIds = dueItems
        .filter(i => i.content_type === 'questao')
        .map(i => i.content_id)

      // Fetch flashcards
      let flashcardsMap = new Map<string, any>()
      if (flashcardIds.length > 0) {
        const { data } = await supabase
          .from('flashcards')
          .select('id, frente, verso, alternativa_tendenciosa, materia, tema')
          .in('id', flashcardIds)
        if (data) {
          data.forEach(f => flashcardsMap.set(f.id, f))
        }
      }

      // Fetch questions - alternativas estao em colunas separadas
      let questionsMap = new Map<string, any>()
      if (questionIds.length > 0) {
        const { data } = await supabase
          .from('questoes')
          .select('id, enunciado, alternativaA, alternativaB, alternativaC, alternativaD, alternativaE, resposta_correta, explicacao, tema, subtema')
          .in('id', questionIds)
        
        if (data) {
          data.forEach(q => {
            // Montar objeto alternativas a partir das colunas
            const alternativas: Record<string, string> = {}
            if (q.alternativaA) alternativas['A'] = q.alternativaA
            if (q.alternativaB) alternativas['B'] = q.alternativaB
            if (q.alternativaC) alternativas['C'] = q.alternativaC
            if (q.alternativaD) alternativas['D'] = q.alternativaD
            if (q.alternativaE) alternativas['E'] = q.alternativaE
            
            questionsMap.set(q.id, {
              ...q,
              alternativas
            })
          })
        }
      }

      // Enrich items
      for (const item of dueItems) {
        const enriched: EnrichedItem = { ...item }
        
        if (item.content_type === 'flashcard') {
          const f = flashcardsMap.get(item.content_id)
          if (f) {
            enriched.frente = f.frente
            enriched.verso = f.verso
            enriched.alternativa_tendenciosa = f.alternativa_tendenciosa
            enriched.materia = f.materia
            enriched.tema = f.tema
          }
        } else {
          const q = questionsMap.get(item.content_id)
          if (q) {
            enriched.enunciado = q.enunciado
            enriched.alternativas = q.alternativas
            enriched.resposta_correta = q.resposta_correta
            enriched.explicacao = q.explicacao
            enriched.tema = q.tema
            enriched.subtema = q.subtema
          }
        }
        
        // Only add items that have content
        // For flashcards: need frente and verso
        // For questions: need enunciado (alternativas may be empty object)
        const isValidFlashcard = item.content_type === 'flashcard' && enriched.frente && enriched.verso
        const isValidQuestion = item.content_type === 'questao' && enriched.enunciado
        
        if (isValidFlashcard || isValidQuestion) {
          enrichedItems.push(enriched)
        }
      }
      
      setItems(enrichedItems)
      setIsLoading(false)
    }

    loadContent()
  }, [dueItems])

  // Generate shuffled options for current flashcard
  useEffect(() => {
    if (items.length === 0 || currentIndex >= items.length) return
    
    const currentItem = items[currentIndex]
    if (currentItem.content_type !== 'flashcard') {
      setShuffledOptions([])
      return
    }

    if (currentItem.verso && currentItem.alternativa_tendenciosa) {
      const options = [
        { text: currentItem.verso, isCorrect: true },
        { text: currentItem.alternativa_tendenciosa, isCorrect: false }
      ]
      setShuffledOptions(options.sort(() => Math.random() - 0.5))
    } else {
      setShuffledOptions([])
    }
  }, [currentIndex, items])

  const currentItem = items[currentIndex]

  const handleFlashcardAnswer = async (isCorrect: boolean) => {
    if (!currentItem || showResult) return

    setShowResult(true)
    setResults(prev => [...prev, { itemId: currentItem.content_id, correct: isCorrect }])

    await recordReviewResult(
      userId,
      currentItem.content_id,
      'flashcard',
      isCorrect,
      isCorrect ? 4 : 1
    )

    // Auto advance after delay
    setTimeout(() => {
      handleNext()
    }, isCorrect ? 1500 : 2500)
  }

  const handleQuestionSubmit = async () => {
    if (!currentItem || !selectedAnswer || showResult) return

    const isCorrect = selectedAnswer.toUpperCase() === (currentItem.resposta_correta || "").toUpperCase()
    
    setShowResult(true)
    setResults(prev => [...prev, { itemId: currentItem.content_id, correct: isCorrect }])

    // Salvar resposta no historico de questoes
    try {
      await saveQuizAnswer(
        userId,
        currentItem.content_id,
        selectedAnswer.toUpperCase(),
        isCorrect,
        "estudo"
      )
    } catch (error) {
      console.error("Erro ao salvar resposta no historico:", error)
    }

    // Registrar resultado para o sistema de revisao espacada
    await recordReviewResult(
      userId,
      currentItem.content_id,
      'questao',
      isCorrect,
      isCorrect ? 4 : 1
    )
  }

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      onComplete()
    }
  }

  const correctCount = results.filter(r => r.correct).length
  const wrongCount = results.filter(r => !r.correct).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-in fade-in-0 duration-300">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-muted-foreground mt-4">Carregando conteúdo para revisão...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Preparando {dueItems.length} itens</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <Trophy className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-foreground mb-2">Tudo em dia!</h3>
        <p className="text-muted-foreground mb-6">Não há itens pendentes para revisão no momento.</p>
        <Button onClick={onBack}>Voltar</Button>
      </div>
    )
  }

  // Completion screen
  if (currentIndex >= items.length) {
    const accuracy = items.length > 0 ? Math.round((correctCount / items.length) * 100) : 0
    
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <Trophy className="w-20 h-20 text-amber-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-foreground mb-4">Revisão Concluída!</h2>
        
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-3xl font-bold text-foreground">{items.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4">
            <p className="text-3xl font-bold text-green-500">{correctCount}</p>
            <p className="text-sm text-muted-foreground">Acertos</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-4">
            <p className="text-3xl font-bold text-red-500">{wrongCount}</p>
            <p className="text-sm text-muted-foreground">Erros</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="w-full bg-muted rounded-full h-3 mb-2">
            <div 
              className={cn(
                "h-3 rounded-full transition-all",
                accuracy >= 70 ? "bg-green-500" : accuracy >= 50 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${accuracy}%` }}
            />
          </div>
          <p className="text-lg font-semibold text-foreground">{accuracy}% de aproveitamento</p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={onComplete}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Revisar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      {/* Progress bar and stats */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="font-medium text-green-500">{correctCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="font-medium text-red-500">{wrongCount}</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="relative">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">
          {currentIndex + 1} de {items.length}
        </p>
      </div>

      {/* Content type badge */}
      <div className="flex items-center justify-center gap-2">
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
          currentItem.content_type === 'flashcard' 
            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
        )}>
          {currentItem.content_type === 'flashcard' ? (
            <>
              <Brain className="w-4 h-4" />
              Flashcard
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4" />
              Questão
            </>
          )}
        </div>
        {(currentItem.tema || currentItem.materia) && (
          <span className="text-sm text-muted-foreground">
            {currentItem.materia || currentItem.tema}
          </span>
        )}
      </div>

      {/* Render based on content type */}
      {currentItem.content_type === 'flashcard' ? (
        <div className="space-y-6">
          {/* Flashcard */}
          <div 
            className={cn(
              "bg-card border-2 rounded-xl p-8 min-h-[250px] flex items-center justify-center cursor-pointer transition-all",
              isFlipped ? "border-primary/50" : "border-border hover:border-primary/30"
            )}
            onClick={() => !showResult && setIsFlipped(!isFlipped)}
          >
            <div className="text-center max-w-2xl">
              {!isFlipped ? (
                <>
                  <p className="text-xl font-medium text-foreground leading-relaxed">
                    {currentItem.frente}
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">Clique para ver a resposta</p>
                </>
              ) : (
                <p className="text-xl text-foreground leading-relaxed">
                  {currentItem.verso}
                </p>
              )}
            </div>
          </div>

          {/* Answer options or self-assessment */}
          {!showResult && (
            <>
              {shuffledOptions.length === 2 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shuffledOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleFlashcardAnswer(option.isCorrect)}
                      className="p-4 bg-muted/50 hover:bg-muted border border-border hover:border-primary/30 rounded-xl text-left transition-all"
                    >
                      <p className="text-foreground">{option.text}</p>
                    </button>
                  ))}
                </div>
              ) : isFlipped ? (
                <div className="flex gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleFlashcardAnswer(false)}
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Errei
                  </Button>
                  <Button 
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleFlashcardAnswer(true)}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Acertei
                  </Button>
                </div>
              ) : null}
            </>
          )}

          {/* Result feedback */}
          {showResult && (
            <div className={cn(
              "p-4 rounded-xl border-2 text-center",
              results[results.length - 1]?.correct 
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            )}>
              {results[results.length - 1]?.correct ? (
                <div className="flex items-center justify-center gap-2 text-green-500">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-semibold text-lg">Correto!</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center gap-2 text-red-500 mb-2">
                    <XCircle className="w-6 h-6" />
                    <span className="font-semibold text-lg">Incorreto</span>
                  </div>
                  <p className="text-muted-foreground">
                    Resposta correta: <span className="text-foreground font-medium">{currentItem.verso}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Question */}
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">
              {currentItem.enunciado}
            </p>
          </div>

          {/* Alternatives */}
          <div className="space-y-3">
            {currentItem.alternativas && typeof currentItem.alternativas === 'object' && Object.entries(currentItem.alternativas).length > 0 ? (
              Object.entries(currentItem.alternativas).map(([key, value]) => {
              const isSelected = selectedAnswer === key
              const isCorrectAnswer = key.toUpperCase() === (currentItem.resposta_correta || "").toUpperCase()
              
              return (
                <button
                  key={key}
                  onClick={() => !showResult && setSelectedAnswer(key)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3",
                    showResult
                      ? isCorrectAnswer
                        ? "bg-green-500/10 border-green-500/50"
                        : isSelected
                          ? "bg-red-500/10 border-red-500/50"
                          : "bg-muted/30 border-border opacity-60"
                      : isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/50 border-border hover:border-primary/30"
                  )}
                >
                  <span className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                    showResult
                      ? isCorrectAnswer
                        ? "bg-green-500 text-white"
                        : isSelected
                          ? "bg-red-500 text-white"
                          : "bg-muted text-muted-foreground"
                      : isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {key.toUpperCase()}
                  </span>
                  <span className="text-foreground pt-1">{value as string}</span>
                </button>
              )
            })
            ) : (
              <div className="text-center text-muted-foreground p-4 bg-muted/30 rounded-xl">
                <p>Alternativas não disponíveis para esta questão.</p>
              </div>
            )}
          </div>

          {/* Submit button or explanation */}
          {!showResult ? (
            <Button 
              onClick={handleQuestionSubmit}
              disabled={!selectedAnswer}
              className="w-full"
              size="lg"
            >
              Confirmar Resposta
            </Button>
          ) : (
            <div className="space-y-4">
              {currentItem.explicacao && (
                <div className="bg-muted/50 border border-border rounded-xl p-4">
                  <h4 className="font-semibold text-foreground mb-2">Explicação:</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{currentItem.explicacao}</p>
                </div>
              )}
              
              <Button onClick={handleNext} className="w-full" size="lg">
                {currentIndex < items.length - 1 ? (
                  <>
                    Próxima
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Ver Resultado
                    <Target className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
