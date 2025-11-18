'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseUser } from '@/lib/auth-supabase';
import { Navbar } from '@/components/navbar';
import { 
  getHistoricoQuestoes,
  getWrongAnswers,
  getProgressByTheme,
  getQuestoesWithAlternatives,
  saveQuizAnswer,
} from '@/lib/storage-supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar, BookOpen, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  enunciado: string;
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  alternativaE: string;
  respostaCorreta: string;
  wrongCount: number;
  [key: string]: any;
}

export default function ReviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [themeProgress, setThemeProgress] = useState<any[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'wrong' | 'review'>('overview');
  const [reviewingWrong, setReviewingWrong] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewStats, setReviewStats] = useState({ reviewed: 0, correct: 0 });
  const [reviewAnswered, setReviewAnswered] = useState(false);
  const [reviewSelected, setReviewSelected] = useState<string | null>(null);

  useEffect(() => {
    const loadReviewData = async () => {
      try {
        const currentUser = await getSupabaseUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        const [progress, wrong] = await Promise.all([
          getProgressByTheme(currentUser.usuario_id || currentUser.id),
          getWrongAnswers(currentUser.usuario_id || currentUser.id),
        ]);
        
        setThemeProgress(progress);
        setWrongAnswers(wrong);
        setIsLoading(false);
      } catch (error) {
        console.error('[v0] Error loading review data:', error);
        setIsLoading(false);
      }
    };

    loadReviewData();
  }, [router]);

  if (!user || isLoading) {
    return (
      <div>
        <Navbar user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p className="text-muted-foreground">Carregando dados de revisão...</p>
        </div>
      </div>
    );
  }

  // Overview tab content
  if (activeTab === 'overview' && !reviewingWrong) {
    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <h1 className="text-4xl font-bold text-foreground mb-2">Seu Progresso</h1>
          <p className="text-muted-foreground text-lg mb-8">Acompanhe seu desempenho e melhore continuamente</p>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-primary border-b-2 border-primary -mb-2'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('wrong')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'wrong'
                  ? 'text-primary border-b-2 border-primary -mb-2'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Questões Erradas ({wrongAnswers.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('review');
                setReviewingWrong(true);
              }}
              className="px-4 py-2 font-medium transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={wrongAnswers.length === 0}
            >
              Revisar Erradas
            </button>
          </div>

          {/* Progresso por Matéria */}
          <div className="bg-card border border-border rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-8">Progresso por Matéria</h2>
            {themeProgress.length > 0 ? (
              <div className="space-y-6">
                {themeProgress.map((theme) => (
                  <div key={theme.theme}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-bold text-foreground">{theme.theme}</span>
                        <span className="ml-4 text-sm text-muted-foreground">
                          {theme.correct}/{theme.total} corretas
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-primary">{theme.percentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                        style={{ width: `${theme.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Corretas: {theme.correct}</span>
                      <span>Erradas: {theme.wrong}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum dado de progresso disponível ainda</p>
            )}
          </div>

          {/* Stats Cards */}
          {themeProgress.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total de Questões</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {themeProgress.reduce((sum, t) => sum + t.total, 0)}
                    </p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Média de Acerto</p>
                    <p className="text-3xl font-bold text-accent mt-2">
                      {Math.round(
                        themeProgress.reduce((sum, t) => sum + t.percentage, 0) / themeProgress.length
                      )}%
                    </p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Matérias Estudadas</p>
                    <p className="text-3xl font-bold text-secondary mt-2">
                      {themeProgress.length}
                    </p>
                  </div>
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Wrong Answers tab
  if (activeTab === 'wrong' && !reviewingWrong) {
    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <h1 className="text-3xl font-bold text-foreground mb-2">Questões Erradas</h1>
          <p className="text-muted-foreground mb-8">
            {wrongAnswers.length} questão(ões) para revisar
          </p>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border">
            <button
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2 font-medium transition-colors text-muted-foreground hover:text-foreground"
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('wrong')}
              className="px-4 py-2 font-medium transition-colors text-primary border-b-2 border-primary -mb-2"
            >
              Questões Erradas ({wrongAnswers.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('review');
                setReviewingWrong(true);
              }}
              className="px-4 py-2 font-medium transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={wrongAnswers.length === 0}
            >
              Revisar Erradas
            </button>
          </div>

          {wrongAnswers.length > 0 ? (
            <div className="space-y-4">
              {wrongAnswers.map((question) => (
                <div key={question.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-2">{question.enunciado}</h3>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="text-sm text-destructive">Errada {question.wrongCount} vez(es)</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {question.tema || question.category || 'Sem tema'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setReviewingWrong(true);
                      setReviewIndex(wrongAnswers.indexOf(question));
                    }}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors text-sm"
                  >
                    Responder Novamente
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-12 text-center">
              <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
              <p className="text-foreground font-bold mb-2">Parabéns!</p>
              <p className="text-muted-foreground">Você não tem questões erradas para revisar</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Review mode for wrong answers
  if (reviewingWrong && wrongAnswers.length > 0) {
    const currentQuestion = wrongAnswers[reviewIndex];
    const alternatives = [
      { letter: 'A', text: currentQuestion.alternativaA },
      { letter: 'B', text: currentQuestion.alternativaB },
      { letter: 'C', text: currentQuestion.alternativaC },
      { letter: 'D', text: currentQuestion.alternativaD },
      { letter: 'E', text: currentQuestion.alternativaE },
    ].sort(() => Math.random() - 0.5);

    const correctLetter = currentQuestion.respostaCorreta?.toUpperCase() || 'A';
    const isCorrect = reviewSelected === correctLetter;

    const handleSelectAnswer = async (letter: string) => {
      if (!reviewAnswered && !isLoading) {
        setReviewSelected(letter);
        setReviewAnswered(true);

        const correct = letter === correctLetter;
        if (correct) {
          setReviewStats({
            reviewed: reviewStats.reviewed + 1,
            correct: reviewStats.correct + 1,
          });
        } else {
          setReviewStats({
            reviewed: reviewStats.reviewed + 1,
            correct: reviewStats.correct,
          });
        }

        try {
          await saveQuizAnswer(
            user.usuario_id || user.id,
            currentQuestion.id,
            letter,
            correct,
            'estudo'
          );
        } catch (error) {
          console.error('[v0] Error saving answer:', error);
        }
      }
    };

    const handleNext = () => {
      if (reviewIndex < wrongAnswers.length - 1) {
        setReviewIndex(reviewIndex + 1);
        setReviewSelected(null);
        setReviewAnswered(false);
      } else {
        setReviewingWrong(false);
        setReviewIndex(0);
        setReviewStats({ reviewed: 0, correct: 0 });
      }
    };

    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <button
            onClick={() => {
              setReviewingWrong(false);
              setReviewIndex(0);
              setReviewStats({ reviewed: 0, correct: 0 });
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">
                Questão {reviewIndex + 1} de {wrongAnswers.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(((reviewIndex + 1) / wrongAnswers.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((reviewIndex + 1) / wrongAnswers.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-8">{currentQuestion.enunciado}</h2>

            <div className="space-y-3 mb-8">
              {alternatives.map((alt) => {
                const altLetter = alt.letter;
                const isSelected = reviewSelected === altLetter;
                const isCorrectAlt = altLetter === correctLetter;

                return (
                  <button
                    key={alt.letter}
                    onClick={() => handleSelectAnswer(altLetter)}
                    disabled={reviewAnswered}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      isSelected
                        ? isCorrect
                          ? 'border-accent bg-accent/10'
                          : 'border-destructive bg-destructive/10'
                        : reviewAnswered && isCorrectAlt
                        ? 'border-accent bg-accent/10'
                        : 'border-input hover:border-muted'
                    } ${reviewAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground w-6">{altLetter}</span>
                      <span className="text-foreground flex-1">{alt.text}</span>
                      {reviewAnswered && isCorrectAlt && <span className="text-accent font-bold">✓</span>}
                      {reviewAnswered && isSelected && !isCorrect && <span className="text-destructive font-bold">✗</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {reviewAnswered && (
              <div className={`p-4 rounded-lg ${isCorrect ? 'bg-accent/10 border border-accent' : 'bg-destructive/10 border border-destructive'}`}>
                <p className={`text-sm font-medium ${isCorrect ? 'text-accent' : 'text-destructive'}`}>
                  {isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta'}
                </p>
              </div>
            )}
          </div>

          {reviewAnswered && (
            <button
              onClick={handleNext}
              className="w-full px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              {reviewIndex < wrongAnswers.length - 1 ? 'Próxima' : 'Finalizar Revisão'}
            </button>
          )}
        </main>
      </div>
    );
  }

  return null;
}
