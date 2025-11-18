// Spaced repetition algorithm implementation
export interface StudyCard {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  repetitions: number;
  interval: number; // days
  easeFactor: number; // 1.3 to 2.5
  nextReview: number; // timestamp
  lastReviewed: number | null;
}

export interface ReviewResult {
  cardId: string;
  quality: 0 | 1 | 2 | 3 | 4 | 5; // 0 = complete failure, 5 = perfect
  timestamp: number;
}

// SM-2 algorithm for spaced repetition
export function calculateNextReview(
  card: StudyCard,
  quality: number
): {
  easeFactor: number;
  interval: number;
  nextReview: number;
} {
  let { easeFactor, repetitions, interval } = card;

  // Update ease factor
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Calculate next interval
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

  return { easeFactor, interval, nextReview };
}

export function generateDefaultCards(): StudyCard[] {
  return [
    {
      id: 'card_1',
      question: 'What is the capital of France?',
      answer: 'Paris',
      category: 'Geography',
      difficulty: 'easy',
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReview: Date.now(),
      lastReviewed: null,
    },
    {
      id: 'card_2',
      question: 'What is the square root of 144?',
      answer: '12',
      category: 'Mathematics',
      difficulty: 'easy',
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReview: Date.now(),
      lastReviewed: null,
    },
    {
      id: 'card_3',
      question: 'What is the chemical formula for water?',
      answer: 'H2O',
      category: 'Science',
      difficulty: 'easy',
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReview: Date.now(),
      lastReviewed: null,
    },
    {
      id: 'card_4',
      question: 'What is the largest planet in our solar system?',
      answer: 'Jupiter',
      category: 'Science',
      difficulty: 'medium',
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReview: Date.now(),
      lastReviewed: null,
    },
    {
      id: 'card_5',
      question: 'Who wrote "Romeo and Juliet"?',
      answer: 'William Shakespeare',
      category: 'Literature',
      difficulty: 'medium',
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReview: Date.now(),
      lastReviewed: null,
    },
  ];
}

export function getDueCards(cards: StudyCard[]): StudyCard[] {
  const now = Date.now();
  return cards.filter(card => card.nextReview <= now);
}
