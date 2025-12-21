import { useState, useEffect, useCallback } from 'react';
import { AppState, DEFAULT_APP_STATE } from '@/types/cocktail';
import { getAppState, updateWithRetry, isConfigured, hasValidCredentials } from '@/lib/jsonbin';
import { getPopularCocktails } from '@/lib/cocktaildb';
import { toast } from '@/hooks/use-toast';

interface UseAppStateReturn {
  state: AppState;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  isDemoMode: boolean;
  refresh: () => Promise<void>;
  toggleVote: (userId: string, cocktailId: string) => Promise<void>;
  updateShortlist: (shortlist: string[]) => Promise<void>;
  updateTags: (cocktailId: string, tags: string[]) => Promise<void>;
  updateConfig: (config: AppState['config']) => Promise<void>;
  hasVoted: (userId: string, cocktailId: string) => boolean;
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
  
  const toggleVote = useCallback(async (userId: string, cocktailId: string) => {
    if (!userId) return;
    
    const currentVotes = state.votesByUser[userId] || [];
    const hasVoted = currentVotes.includes(cocktailId);
    const newVotes = hasVoted
      ? currentVotes.filter(id => id !== cocktailId)
      : [...currentVotes, cocktailId];
    
    // Optimistic update
    setState(prev => ({
      ...prev,
      votesByUser: {
        ...prev.votesByUser,
        [userId]: newVotes,
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
          [userId]: newVotes,
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
          [userId]: currentVotes,
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
  
  const hasVoted = useCallback((userId: string, cocktailId: string): boolean => {
    if (!userId) return false;
    return (state.votesByUser[userId] || []).includes(cocktailId);
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
    hasVoted,
    getVoteCount,
  };
}
