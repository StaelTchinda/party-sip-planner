import { useState, useEffect, useCallback } from 'react';

const USERNAME_KEY = 'cocktail_vote_username';
const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export function isValidUsername(name: string): boolean {
  return USERNAME_REGEX.test(name.trim());
}

export function normalizeUsername(name: string): string {
  return name.trim().toLowerCase();
}

export function useUserName(): [string, (name: string) => void] {
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem(USERNAME_KEY);
    if (stored && isValidUsername(stored)) {
      setUsername(stored);
    }
  }, []);

  const saveUsername = useCallback((name: string) => {
    const normalized = normalizeUsername(name);
    if (!isValidUsername(normalized)) return;
    localStorage.setItem(USERNAME_KEY, normalized);
    setUsername(normalized);
  }, []);

  return [username, saveUsername];
}
