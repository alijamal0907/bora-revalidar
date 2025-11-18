// Authentication utilities with localStorage
interface User {
  id: string;
  email: string;
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('bora_user');
  return stored ? JSON.parse(stored) : null;
}

export function setStoredUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('bora_user', JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('bora_user');
}

export function isAuthenticated(): boolean {
  return getStoredUser() !== null;
}

export function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}
