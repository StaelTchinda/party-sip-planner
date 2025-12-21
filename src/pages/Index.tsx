import { useState, useEffect, useMemo, useCallback } from 'react';
import { initJsonBin } from '@/lib/jsonbin';
import { useAppState } from '@/hooks/useAppState';
import { useCocktails } from '@/hooks/useCocktails';
import { useUserId } from '@/hooks/useUserId';
import { CocktailCard } from '@/components/CocktailCard';
import { CocktailDetail } from '@/components/CocktailDetail';
import { FilterBar, FilterState } from '@/components/FilterBar';
import { IngredientsDashboard } from '@/components/IngredientsDashboard';
import { AdminPanel } from '@/components/AdminPanel';
import { Navigation, Tab } from '@/components/Navigation';
import { Loader2, AlertCircle, PartyPopper, Info } from 'lucide-react';
import { Cocktail, CUSTOM_TAGS } from '@/types/cocktail';

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>('cocktails');
  const [selectedCocktailId, setSelectedCocktailId] = useState<string | null>(null);
  
  // Initialize filters from URL params
  const getInitialFilters = useCallback((): FilterState => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search') || '';
    const alcoholic = (params.get('alcoholic') as FilterState['alcoholic']) || 'all';
    const tagsParam = params.get('tags');
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];
    
    return { search, alcoholic, tags };
  }, []);
  
  const [filters, setFilters] = useState<FilterState>(getInitialFilters);
  
  const userId = useUserId();
  
  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const binId = params.get('bin');
    const accessKey = params.get('access');
    
    if (binId && accessKey) {
      initJsonBin(binId, accessKey);
    }
  }, []);
  
  // Get view mode from URL
  const isAdmin = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'admin';
  }, []);
  
  const {
    state,
    isLoading: isStateLoading,
    isRefreshing,
    error: stateError,
    isDemoMode,
    refresh,
    toggleVote,
    updateShortlist,
    updateTags,
    updateConfig,
    hasVoted,
    getVoteCount,
  } = useAppState();
  
  const { cocktails, isLoading: isCocktailsLoading, getSimilar } = useCocktails(state.shortlist);
  
  const isLoading = isStateLoading || isCocktailsLoading;
  
  // Get available tags from data
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    Object.values(state.tagsByCocktail).forEach(tags => {
      tags.forEach(tag => tagsSet.add(tag));
    });
    return tagsSet.size > 0 ? Array.from(tagsSet) : CUSTOM_TAGS.slice(0, 6);
  }, [state.tagsByCocktail]);
  
  // Update URL when filters change (debounced for search)
  useEffect(() => {
    // Debounce search updates to URL
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      
      // Preserve endpoint and view params
      const endpoint = params.get('endpoint');
      const view = params.get('view');
      
      // Update filter params
      if (filters.search) {
        params.set('search', filters.search);
      } else {
        params.delete('search');
      }
      
      if (filters.alcoholic !== 'all') {
        params.set('alcoholic', filters.alcoholic);
      } else {
        params.delete('alcoholic');
      }
      
      if (filters.tags.length > 0) {
        params.set('tags', filters.tags.join(','));
      } else {
        params.delete('tags');
      }
      
      // Ensure endpoint and view are preserved
      if (endpoint) {
        params.set('endpoint', endpoint);
      }
      if (view) {
        params.set('view', view);
      }
      
      // Update URL without page reload
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }, filters.search ? 500 : 0); // Debounce search by 500ms, update other filters immediately
    
    return () => clearTimeout(timeoutId);
  }, [filters]);
  
  // Filter cocktails
  const filteredCocktails = useMemo(() => {
    return cocktails.filter(c => {
      // Search filter
      if (filters.search && !c.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Alcoholic filter
      if (filters.alcoholic === 'alcoholic' && !c.alcoholic) return false;
      if (filters.alcoholic === 'non-alcoholic' && c.alcoholic) return false;
      
      // Tags filter
      if (filters.tags.length > 0) {
        const cocktailTags = state.tagsByCocktail[c.id] || [];
        if (!filters.tags.some(tag => cocktailTags.includes(tag))) {
          return false;
        }
      }
      
      return true;
    });
  }, [cocktails, filters, state.tagsByCocktail]);
  
  // Get voted cocktails for ingredients dashboard
  const votedCocktails = useMemo(() => {
    if (!userId) return [];
    const userVotes = state.votesByUser[userId] || [];
    return cocktails.filter(c => userVotes.includes(c.id));
  }, [cocktails, state.votesByUser, userId]);
  
  // Selected cocktail for detail view
  const selectedCocktail = useMemo(() => {
    if (!selectedCocktailId) return null;
    return cocktails.find(c => c.id === selectedCocktailId) || null;
  }, [selectedCocktailId, cocktails]);
  
  // Remove blocking configuration screen - app works in demo mode now
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading cocktails...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (stateError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground">{stateError}</p>
        </div>
      </div>
    );
  }
  
  // Detail view
  if (selectedCocktail) {
    return (
      <CocktailDetail
        cocktail={selectedCocktail}
        hasVoted={hasVoted(userId, selectedCocktail.id)}
        voteCount={getVoteCount(selectedCocktail.id)}
        customTags={state.tagsByCocktail[selectedCocktail.id]}
        similarCocktails={getSimilar(selectedCocktail)}
        onVote={() => toggleVote(userId, selectedCocktail.id)}
        onBack={() => setSelectedCocktailId(null)}
        onViewSimilar={(id) => setSelectedCocktailId(id)}
      />
    );
  }
  
  return (
    <div className="min-h-screen pb-24">
      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
          <div className="max-w-2xl mx-auto flex items-center gap-2 text-sm text-primary">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>Demo mode - add <code className="bg-primary/20 px-1 rounded">?bin=BIN_ID&access=ACCESS_KEY</code> to save votes</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <PartyPopper className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold text-gradient-gold">
              Cocktail Vote
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeTab === 'cocktails' && `${filteredCocktails.length} cocktails to choose from`}
            {activeTab === 'ingredients' && `Shopping list for ${votedCocktails.length} selected cocktails`}
            {activeTab === 'admin' && 'Manage your party menu'}
          </p>
        </div>
      </header>
      
      {/* Main content */}
      <main className="px-4 py-4 max-w-2xl mx-auto">
        {/* Cocktails tab */}
        {activeTab === 'cocktails' && (
          <div className="space-y-4">
            <FilterBar
              filters={filters}
              onChange={setFilters}
              availableTags={availableTags}
            />
            
            {filteredCocktails.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No cocktails match your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCocktails.map((cocktail, idx) => (
                  <div 
                    key={cocktail.id}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <CocktailCard
                      cocktail={cocktail}
                      hasVoted={hasVoted(userId, cocktail.id)}
                      voteCount={getVoteCount(cocktail.id)}
                      customTags={state.tagsByCocktail[cocktail.id]}
                      onVote={() => toggleVote(userId, cocktail.id)}
                      onView={() => setSelectedCocktailId(cocktail.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Ingredients tab */}
        {activeTab === 'ingredients' && (
          <IngredientsDashboard
            cocktails={votedCocktails}
            config={state.config}
          />
        )}
        
        {/* Admin tab */}
        {activeTab === 'admin' && isAdmin && (
          <AdminPanel
            state={state}
            cocktails={cocktails}
            onUpdateShortlist={updateShortlist}
            onUpdateTags={updateTags}
            onUpdateConfig={updateConfig}
            getVoteCount={getVoteCount}
          />
        )}
      </main>
      
      {/* Bottom navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={isAdmin}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
      />
    </div>
  );
}
