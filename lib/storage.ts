// Local storage management
import { StudyCard, ReviewResult } from './spaced-repetition';

const CARDS_KEY = 'bora_cards';
const REVIEWS_KEY = 'bora_reviews';

export function getStoredCards(): StudyCard[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(CARDS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function setStoredCards(cards: StudyCard[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function getStoredReviews(): ReviewResult[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(REVIEWS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addReview(review: ReviewResult): void {
  if (typeof window === 'undefined') return;
  const reviews = getStoredReviews();
  reviews.push(review);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

export function initializeCards(): StudyCard[] {
  const existing = getStoredCards();
  if (existing.length === 0) {
    const { generateDefaultCards } = require('./spaced-repetition');
    const newCards = generateDefaultCards();
    setStoredCards(newCards);
    return newCards;
  }
  return existing;
}
