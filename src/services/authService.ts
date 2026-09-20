import { UserAccount } from '../types';

const AUTH_STORAGE_KEY = 'chronoderm_user_session_v4';

// Default personal account matching user's real email from AI Studio
export const DEFAULT_USER: UserAccount = {
  id: 'user_agadkarvineet0',
  email: 'agadkarvineet0@gmail.com',
  name: 'Vineet Agadkar',
  isGuestDemo: false,
};

export const DEMO_GUEST_USER: UserAccount = {
  id: 'demo_guest_user',
  email: 'newuser@chronoderm.demo',
  name: 'New User (Test Drive)',
  isGuestDemo: true,
};

export function getCurrentUser(): UserAccount {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id && parsed.email) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse saved user:', err);
  }
  // Default to user's real personal account (clean data, zero pre-existing demo photos)
  return DEFAULT_USER;
}

export function setCurrentUser(user: UserAccount): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('Failed to save user session:', err);
  }
}

export function logInUser(email: string, name?: string): UserAccount {
  const cleanEmail = email.trim().toLowerCase();
  const id = `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const userName = name?.trim() || cleanEmail.split('@')[0];
  const user: UserAccount = {
    id,
    email: cleanEmail,
    name: userName,
    isGuestDemo: false,
  };
  setCurrentUser(user);
  return user;
}

export function enterDemoMode(): UserAccount {
  setCurrentUser(DEMO_GUEST_USER);
  return DEMO_GUEST_USER;
}

export function logOutUser(): UserAccount {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  return DEFAULT_USER;
}
