import { useState, useEffect, useCallback } from 'react';
import { AppState, DEFAULT_APP_STATE } from '@/types/cocktail';
import { getAppState, updateWithRetry, hasValidCredentials } from '@/lib/jsonbin';
import { isValidUsername, normalizeUsername } from '@/hooks/useUserId';
import { getPopularCocktails } from '@/lib/cocktaildb';
import { toast } from '@/hooks/use-toast';

interface UseAppStateReturn {
  state: AppState;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  isDemoMode: boolean;
  refresh: () => Promise<void>;
  toggleVote: (username: string, cocktailId: string) => Promise<void>;
  updateShortlist: (shortlist: string[]) => Promise<void>;
  updateTags: (cocktailId: string, tags: string[]) => Promise<void>;
  updateConfig: (config: AppState['config']) => Promise<void>;
  setUserName: (username: string) => Promise<void>;
  hasVoted: (username: string, cocktailId: string) => boolean;
  getVoteCount: (cocktailId: string) => number;
}

export function useAppState(): UseAppStateReturn {
  const [state, setState] = useState<AppState>(DEFAULT_APP_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    
    // If JSONBin is configured, try to fetch from there
    if (hasValidCredentials()) {
      try {
        const data = await getAppState();
        setState(data);
        setError(null);
        setIsDemoMode(false);
      } catch (err) {
        console.error('Failed to load from JSONBin:', err);
        // Fall back to demo mode
        await loadDemoMode();
      }
    } else {
      // No credentials - use demo mode
      await loadDemoMode();
    }
    
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);
  
  const loadDemoMode = async () => {
    try {
      const popularCocktails = await getPopularCocktails();
      const shortlist = popularCocktails.map(c => c.id);
      setState({
        ...DEFAULT_APP_STATE,
        shortlist,
      });
      setIsDemoMode(true);
      setError(null);
    } catch (err) {
      setError('Failed to load cocktails');
      console.error(err);
    }
  };
  
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  const toggleVote = useCallback(async (username: string, cocktailId: string) => {
    const normalized = normalizeUsername(username);
    if (!normalized || !isValidUsername(normalized)) {
      toast({
        title: 'Name required',
        description: 'Please select or enter your name to vote',
        variant: 'destructive',
      });
      return;
    }
    
    const currentVotes = state.votesByUser[normalized] || [];
    const hasVoted = currentVotes.includes(cocktailId);
    const newVotes = hasVoted
      ? currentVotes.filter(id => id !== cocktailId)
      : [...currentVotes, cocktailId];
    
    // Optimistic update
    setState(prev => ({
      ...prev,
      votesByUser: {
        ...prev.votesByUser,
        [normalized]: newVotes,
      },
    }));
    
    // If in demo mode, just show toast and keep local state
    if (!hasValidCredentials()) {
      toast({
        title: hasVoted ? 'Vote removed (demo)' : 'Vote added! (demo)',
        description: 'Add JSONBin credentials to save permanently',
      });
      return;
    }
    
    try {
      await updateWithRetry(current => ({
        votesByUser: {
          ...current.votesByUser,
          [normalized]: newVotes,
        },
      }));
      
      toast({
        title: hasVoted ? 'Vote removed' : 'Vote added!',
        description: hasVoted ? 'You unvoted this cocktail' : 'Your vote has been recorded',
      });
    } catch (err) {
      // Revert on failure
      setState(prev => ({
        ...prev,
        votesByUser: {
          ...prev.votesByUser,
          [normalized]: currentVotes,
        },
      }));
      
      // Log detailed error for debugging
      console.error('Failed to save vote:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      toast({
        title: 'Error',
        description: `Failed to save vote: ${errorMessage}. Check console for details.`,
        variant: 'destructive',
      });
    }
  }, [state.votesByUser]);
  
  const updateShortlist = useCallback(async (shortlist: string[]) => {
    const previous = state.shortlist;
    
    setState(prev => ({ ...prev, shortlist }));
    
    if (!hasValidCredentials()) {
      toast({
        title: 'Demo mode',
        description: 'Add JSONBin credentials to save changes',
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, shortlist: previous }));
      return;
    }
    
    try {
      await updateWithRetry(() => ({ shortlist }));
      toast({
        title: 'Shortlist updated',
        description: 'Changes saved successfully',
      });
    } catch (err) {
      setState(prev => ({ ...prev, shortlist: previous }));
      toast({
        title: 'Error',
        description: 'Failed to update shortlist',
        variant: 'destructive',
      });
    }
  }, [state.shortlist]);
  
  const updateTags = useCallback(async (cocktailId: string, tags: string[]) => {
    const previous = state.tagsByCocktail;
    
    setState(prev => ({
      ...prev,
      tagsByCocktail: {
        ...prev.tagsByCocktail,
        [cocktailId]: tags,
      },
    }));
    
    if (!hasValidCredentials()) {
      toast({
        title: 'Demo mode',
        description: 'Add JSONBin credentials to save changes',
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, tagsByCocktail: previous }));
      return;
    }
    
    try {
      await updateWithRetry(current => ({
        tagsByCocktail: {
          ...current.tagsByCocktail,
          [cocktailId]: tags,
        },
      }));
    } catch (err) {
      setState(prev => ({ ...prev, tagsByCocktail: previous }));
      toast({
        title: 'Error',
        description: 'Failed to update tags',
        variant: 'destructive',
      });
    }
  }, [state.tagsByCocktail]);
  
  const updateConfig = useCallback(async (config: AppState['config']) => {
    const previous = state.config;
    
    setState(prev => ({ ...prev, config }));
    
    if (!hasValidCredentials()) {
      toast({
        title: 'Demo mode',
        description: 'Add JSONBin credentials to save changes',
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, config: previous }));
      return;
    }
    
    try {
      await updateWithRetry(() => ({ config }));
      toast({
        title: 'Config updated',
        description: 'Settings saved successfully',
      });
    } catch (err) {
      setState(prev => ({ ...prev, config: previous }));
      toast({
        title: 'Error',
        description: 'Failed to update config',
        variant: 'destructive',
      });
    }
  }, [state.config]);
  
  const setUserName = useCallback(async (userName: string) => {
    const normalized = normalizeUsername(userName);
    if (!normalized || !isValidUsername(normalized)) {
      toast({
        title: 'Invalid username',
        description: 'Use 3-30 chars: lowercase letters, numbers, underscores',
        variant: 'destructive',
      });
      return;
    }
    
    // Username is stored locally via useUserName hook
    // It will be persisted to votesByUser when the user votes
    toast({
      title: 'Name saved',
      description: 'Your name is ready. Start voting to save it!',
    });
  }, []);
  
  const hasVoted = useCallback((username: string, cocktailId: string): boolean => {
    const normalized = normalizeUsername(username);
    if (!normalized) return false;
    return (state.votesByUser[normalized] || []).includes(cocktailId);
  }, [state.votesByUser]);
  
  const getVoteCount = useCallback((cocktailId: string): number => {
    let count = 0;
    for (const votes of Object.values(state.votesByUser)) {
      if (votes.includes(cocktailId)) {
        count++;
      }
    }
    return count;
  }, [state.votesByUser]);
  
  return {
    state,
    isLoading,
    isRefreshing,
    error,
    isDemoMode,
    refresh,
    toggleVote,
    updateShortlist,
    updateTags,
    updateConfig,
    setUserName,
    hasVoted,
    getVoteCount,
  };
}
