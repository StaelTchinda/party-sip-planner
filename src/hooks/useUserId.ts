import { useState, useEffect } from 'react';

const USER_ID_KEY = 'cocktail_vote_user_id';

function generateUserId(): string {
  return `u_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;
}

export function useUserId(): string {
  const [userId, setUserId] = useState<string>('');
  
  useEffect(() => {
    let storedId = localStorage.getItem(USER_ID_KEY);
    
    if (!storedId) {
      storedId = generateUserId();
      localStorage.setItem(USER_ID_KEY, storedId);
    }
    
    setUserId(storedId);
  }, []);
  
  return userId;
}
