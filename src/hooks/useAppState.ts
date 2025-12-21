import { useState, useEffect, useCallback } from 'react';
import { AppState, DEFAULT_APP_STATE } from '@/types/cocktail';
import { getAppState, updateWithRetry, isConfigured } from '@/lib/jsonbin';
import { toast } from '@/hooks/use-toast';

interface UseAppStateReturn {
  state: AppState;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
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
  
  const refresh = useCallback(async () => {
    if (!isConfigured()) {
      setError('JSONBin not configured. Add ?bin=YOUR_BIN_ID&access=YOUR_ACCESS_KEY to the URL.');
      setIsLoading(false);
      return;
    }
    
    setIsRefreshing(true);
    try {
      const data = await getAppState();
      setState(data);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  
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
      
      toast({
        title: 'Error',
        description: 'Failed to save vote. Please try again.',
        variant: 'destructive',
      });
    }
  }, [state.votesByUser]);
  
  const updateShortlist = useCallback(async (shortlist: string[]) => {
    const previous = state.shortlist;
    
    setState(prev => ({ ...prev, shortlist }));
    
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
    refresh,
    toggleVote,
    updateShortlist,
    updateTags,
    updateConfig,
    hasVoted,
    getVoteCount,
  };
}
