'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getReviewStats, getDueReviewItems, recordReviewResult, type ReviewItem } from '@/lib/spaced-repetition-v2'
import { AlertCircle, BookOpen, Brain, RefreshCw, Clock, Play, ChevronRight, Sparkles, Target, TrendingUp, CheckCircle2, XCircle, Pause, Trophy, RotateCcw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { saveQuizAnswer } from '@/lib/storage-supabase'

interface SmartReviewSectionProps {
  userId: string
}

interface EnrichedReviewItem extends ReviewItem {
  title?: string
  preview?: string
  tema?: string
  materia?: string
  frente?: string
  verso?: string
  alternativa_tendenciosa?: string
  enunciado?: string
  alternativas?: Record<string, string>
  resposta_correta?: string
  explicacao?: string
  subtema?: string
}

type ReviewState = 'idle' | 'loading' | 'reviewing' | 'completed' | 'paused'

export function SmartReviewSection({ userId }: SmartReviewSectionProps) {
  // Main state
  const [stats, setStats] = useState({ total: 0, due: 0, overdue: 0, questoes: 0, flashcards: 0, averageEaseFactor: '0' })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Review mode state
  const [reviewState, setReviewState] = useState<ReviewState>('idle')
  const [reviewItems, setReviewItems] = useState<EnrichedReviewItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState<{ itemId: string; correct: boolean }[]>([])
  const [shuffledOptions, setShuffledOptions] = useState<{ text: string; isCorrect: boolean }[]>([])
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null)

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await getReviewStats(userId)
        setStats(statsData)
        setLastUpdated(new Date())
      } catch (error) {
        console.error('Erro ao carregar stats:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }
    loadStats()
  }, [userId])

  // Generate options for flashcards
  useEffect(() => {
    if (reviewState !== 'reviewing' || !reviewItems[currentIndex]) return
    
    const current = reviewItems[currentIndex]
    if (current.content_type === 'flashcard' && current.verso && current.alternativa_tendenciosa) {
      const opts = [
        { text: current.verso, isCorrect: true },
        { text: current.alternativa_tendenciosa, isCorrect: false }
      ].sort(() => Math.random() - 0.5)
      setShuffledOptions(opts)
    } else {
      setShuffledOptions([])
    }
  }, [currentIndex, reviewItems, reviewState])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    }
  }, [])

  const currentItem = reviewItems[currentIndex]
  const correctCount = results.filter(r => r.correct).length
  const wrongCount = results.filter(r => !r.correct).length

  const startReview = useCallback(async () => {
    if (reviewState !== 'idle') return
    
    setReviewState('loading')
    try {
      const supabase = createClient()
      const dueData = await getDueReviewItems(userId)
      
      if (!dueData || dueData.length === 0) {
        setReviewState('completed')
        return
      }

      const enrichedItems: EnrichedReviewItem[] = []
      const flashcardIds = dueData.filter(i => i.content_type === 'flashcard').map(i => i.content_id)
      const questionIds = dueData.filter(i => i.content_type === 'questao').map(i => i.content_id)

      // Fetch flashcards
      const flashcardsMap = new Map()
      if (flashcardIds.length > 0) {
        const { data } = await supabase.from('flashcards').select('id, frente, verso, alternativa_tendenciosa, materia, tema').in('id', flashcardIds)
        if (data) data.forEach(f => flashcardsMap.set(f.id, f))
      }

      // Fetch questions
      const questionsMap = new Map()
      if (questionIds.length > 0) {
        const { data } = await supabase.from('questoes').select('id, enunciado, alternativaA, alternativaB, alternativaC, alternativaD, alternativaE, resposta_correta, explicacao, tema, subtema').in('id', questionIds)
        if (data) {
          data.forEach(q => {
            const alt: Record<string, string> = {}
            if (q.alternativaA) alt['A'] = q.alternativaA
            if (q.alternativaB) alt['B'] = q.alternativaB
            if (q.alternativaC) alt['C'] = q.alternativaC
            if (q.alternativaD) alt['D'] = q.alternativaD
            if (q.alternativaE) alt['E'] = q.alternativaE
            questionsMap.set(q.id, { ...q, alternativas: alt })
          })
        }
      }

      // Enrich items
      for (const item of dueData) {
        const enriched: EnrichedReviewItem = { ...item }
        
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
          }
        }
        enrichedItems.push(enriched)
      }

      if (enrichedItems.length === 0) {
        setReviewState('completed')
        return
      }

      setReviewItems(enrichedItems)
      setCurrentIndex(0)
      setResults([])
      setReviewState('reviewing')
    } catch (error) {
      console.error('Erro:', error)
      setReviewState('idle')
    }
  }, [userId, reviewState])

  const handleFlashcardAnswer = async (isCorrect: boolean) => {
    if (!currentItem || showResult) return
    setShowResult(true)
    setResults(prev => [...prev, { itemId: currentItem.content_id, correct: isCorrect }])
    await recordReviewResult(userId, currentItem.content_id, 'flashcard', isCorrect, isCorrect ? 4 : 1)
    autoAdvanceRef.current = setTimeout(() => handleNext(), isCorrect ? 1500 : 2500)
  }

  const handleQuestionSubmit = async () => {
    if (!currentItem || !selectedAnswer || showResult) return
    const isCorrect = selectedAnswer.toUpperCase() === (currentItem.resposta_correta || '').toUpperCase()
    setShowResult(true)
    setResults(prev => [...prev, { itemId: currentItem.content_id, correct: isCorrect }])
    try {
      await saveQuizAnswer(userId, currentItem.content_id, selectedAnswer.toUpperCase(), isCorrect, 'estudo')
    } catch (error) {
      console.error('Erro ao salvar resposta:', error)
    }
    await recordReviewResult(userId, currentItem.content_id, 'questao', isCorrect, isCorrect ? 4 : 1)
  }

  const handleNext = () => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    if (currentIndex < reviewItems.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setReviewState('completed')
    }
  }

  const handlePause = () => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    setReviewState('paused')
  }

  const handleResume = () => setReviewState('reviewing')

  const handleRestart = () => {
    setReviewState('idle')
    setCurrentIndex(0)
    setResults([])
    setReviewItems([])
    setIsFlipped(false)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  // States rendering
  if (isLoadingStats) {
    return <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse h-32"></div>
  }

  if (reviewState === 'loading') {
    return (
      <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/50 to-purple-900/20 border-2 border-blue-700/50 rounded-xl p-8 shadow-xl">
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <div className="relative mb-4"><div className="w-12 h-12 border-4 border-blue-500/20 rounded-full"></div><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0"></div></div>
          <p className="text-white font-medium">Carregando revisao...</p>
        </div>
      </div>
    )
  }

  if (reviewState === 'completed') {
    const accuracy = reviewItems.length > 0 ? Math.round((correctCount / reviewItems.length) * 100) : 0
    return (
      <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/50 to-purple-900/20 border-2 border-blue-700/50 rounded-xl p-6 shadow-xl">
        <div className="text-center py-6">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Revisao Concluida!</h2>
          {reviewItems.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto my-6">
                <div className="bg-slate-800/60 rounded-lg p-3"><p className="text-2xl font-bold text-white">{reviewItems.length}</p><p className="text-xs text-slate-400">Total</p></div>
                <div className="bg-emerald-500/20 rounded-lg p-3"><p className="text-2xl font-bold text-emerald-400">{correctCount}</p><p className="text-xs text-slate-400">Acertos</p></div>
                <div className="bg-red-500/20 rounded-lg p-3"><p className="text-2xl font-bold text-red-400">{wrongCount}</p><p className="text-xs text-slate-400">Erros</p></div>
              </div>
              <div className="max-w-sm mx-auto mb-6"><div className="w-full bg-slate-700 rounded-full h-3 mb-2"><div className={cn("h-3 rounded-full", accuracy >= 70 ? "bg-emerald-500" : accuracy >= 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${accuracy}%` }}></div></div><p className="text-lg font-semibold text-white">{accuracy}% de aproveitamento</p></div>
            </>
          )}
          <div className="flex gap-3 justify-center"><Button variant="outline" onClick={handleRestart} className="border-slate-600">Voltar</Button><Button onClick={startReview} className="bg-blue-600">Revisar Novamente</Button></div>
        </div>
      </div>
    )
  }

  if (reviewState === 'paused') {
    return (
      <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/50 to-purple-900/20 border-2 border-blue-700/50 rounded-xl p-6 shadow-xl">
        <div className="text-center py-8"><Pause className="w-12 h-12 text-amber-400 mx-auto mb-4" /><h3 className="text-xl font-bold text-white mb-2">Revisao Pausada</h3><p className="text-slate-400 mb-4">{currentIndex + 1} de {reviewItems.length}</p><div className="flex gap-3 justify-center"><Button variant="outline" onClick={handleRestart}>Encerrar</Button><Button onClick={handleResume} className="bg-blue-600"><Play className="w-4 h-4 mr-2" />Continuar</Button></div></div>
      </div>
    )
  }

  if (reviewState === 'reviewing' && currentItem) {
    const isFlashcard = currentItem.content_type === 'flashcard'
    return (
      <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/50 to-purple-900/20 border-2 border-blue-700/50 rounded-xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4"><button onClick={handlePause} className="text-sm text-slate-400 hover:text-white"><Pause className="w-4 h-4 mr-1 inline" />Pausar</button><div className="flex gap-3"><div className="flex items-center gap-1 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-emerald-400 font-medium">{correctCount}</span></div><div className="flex items-center gap-1 text-sm"><XCircle className="w-4 h-4 text-red-500" /><span className="text-red-400 font-medium">{wrongCount}</span></div></div></div>
        <div className="mb-4"><div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${((currentIndex + 1) / reviewItems.length) * 100}%` }} /></div><p className="text-center text-xs text-slate-400 mt-1">{currentIndex + 1} de {reviewItems.length}</p></div>
        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4", isFlashcard ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30")}>{isFlashcard ? <Brain className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}{isFlashcard ? 'Flashcard' : 'Questao'}</div>
        {isFlashcard ? (
          <div className="space-y-4">
            <div className={cn("bg-slate-800/80 border-2 rounded-xl p-6 min-h-[180px] flex items-center justify-center cursor-pointer transition-all", isFlipped ? "border-blue-500/50" : "border-slate-600")} onClick={() => !showResult && setIsFlipped(!isFlipped)}><div className="text-center">{!isFlipped ? <><p className="text-lg font-medium text-white">{currentItem.frente}</p><p className="text-xs text-slate-500 mt-3">Toque para ver</p></> : <p className="text-lg text-slate-200">{currentItem.verso}</p>}</div></div>
            {!showResult && (shuffledOptions.length === 2 ? <div className="grid grid-cols-2 gap-3">{shuffledOptions.map((opt, i) => <button key={i} onClick={() => handleFlashcardAnswer(opt.isCorrect)} className="p-3 bg-slate-800/60 hover:bg-slate-700 border border-slate-600 hover:border-blue-500/50 rounded-lg text-sm text-slate-200">{opt.text}</button>)}</div> : isFlipped && <div className="flex gap-3"><Button variant="outline" className="flex-1 border-red-500/30 text-red-400" onClick={() => handleFlashcardAnswer(false)}><XCircle className="w-4 h-4 mr-2" />Errei</Button><Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleFlashcardAnswer(true)}><CheckCircle2 className="w-4 h-4 mr-2" />Acertei</Button></div>)}
            {showResult && <div className={cn("p-3 rounded-lg border text-center", results[results.length - 1]?.correct ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30")}>{results[results.length - 1]?.correct ? <div className="flex items-center justify-center gap-2 text-emerald-400"><CheckCircle2 className="w-5 h-5" /><span>Correto!</span></div> : <div><div className="flex items-center justify-center gap-2 text-red-400 mb-1"><XCircle className="w-5 h-5" /><span>Incorreto</span></div><p className="text-xs text-slate-400">Resposta: <span className="text-white">{currentItem.verso}</span></p></div>}</div>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-4"><p className="text-sm text-slate-200 whitespace-pre-wrap">{currentItem.enunciado}</p></div>
            <div className="space-y-2">{currentItem.alternativas && Object.entries(currentItem.alternativas).length > 0 ? Object.entries(currentItem.alternativas).map(([key, value]) => { const isSelected = selectedAnswer === key; const isCorrect = key.toUpperCase() === (currentItem.resposta_correta || '').toUpperCase(); return <button key={key} onClick={() => !showResult && setSelectedAnswer(key)} disabled={showResult} className={cn("w-full p-3 rounded-lg border text-left transition-all flex items-start gap-2 text-sm", showResult ? isCorrect ? "bg-emerald-500/10 border-emerald-500/50" : isSelected ? "bg-red-500/10 border-red-500/50" : "bg-slate-800/30 border-slate-700 opacity-60" : isSelected ? "bg-blue-500/10 border-blue-500" : "bg-slate-800/60 border-slate-600 hover:border-blue-500/30")}><span className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-medium text-xs", showResult ? isCorrect ? "bg-emerald-500 text-white" : isSelected ? "bg-red-500 text-white" : "bg-slate-700" : isSelected ? "bg-blue-500 text-white" : "bg-slate-700")}>{key.toUpperCase()}</span><span className="text-slate-200">{value as string}</span></button> }) : <div className="text-slate-500">Sem alternativas</div>}</div>
            {!showResult ? <Button onClick={handleQuestionSubmit} disabled={!selectedAnswer} className="w-full bg-blue-600">Confirmar</Button> : <div className="space-y-3">{currentItem.explicacao && <div className="bg-slate-800/60 border border-slate-600 rounded-lg p-3"><h4 className="font-medium text-white text-sm mb-1">Explicacao:</h4><p className="text-xs text-slate-400">{currentItem.explicacao}</p></div>}<Button onClick={handleNext} className="w-full bg-blue-600">Proximo<ChevronRight className="w-4 h-4 ml-2" /></Button></div>}
          </div>
        )}
      </div>
    )
  }

  // Default idle state
  return (
    <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/50 to-purple-900/20 border-2 border-blue-700/50 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><Sparkles className="w-5 h-5 text-blue-400" /><div><h3 className="font-bold text-white flex items-center gap-2">Revisao Inteligente {stats.due > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">{stats.due}</span>}</h3><p className="text-xs text-slate-400">Sistema SM-2</p></div></div><button onClick={() => {}} className="p-2 hover:bg-slate-700/50 rounded-lg"><RefreshCw className="w-4 h-4 text-slate-400" /></button></div>
      {stats.due > 0 && (
        <>
          <button onClick={startReview} className="mb-5 w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/30 group border border-blue-400/20 text-left"><div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform"><Play className="w-5 h-5" /></div><div><span className="block text-lg">Iniciar Revisao</span><span className="block text-xs text-blue-200 font-normal">{stats.questoes} Q + {stats.flashcards} F</span></div></div><div className="flex items-center gap-2"><span className="bg-white/20 px-3 py-1 rounded-full text-sm">{stats.due} itens</span><ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></div></button>
          {lastUpdated && <p className="text-xs text-slate-500 text-center">Atualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}</p>}
        </>
      )}
      {stats.due === 0 && (
        <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-lg p-4 text-center"><AlertCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" /><p className="text-emerald-300 font-medium">Tudo em dia!</p><p className="text-emerald-400/70 text-xs mt-1">Nenhum conteudo pendente</p></div>
      )}
    </div>
  )
}
