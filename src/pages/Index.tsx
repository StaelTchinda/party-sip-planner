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
import { UserNameDialog } from '@/components/UserNameDialog';
import { Loader2, AlertCircle, PartyPopper, Info } from 'lucide-react';
import { Cocktail, CUSTOM_TAGS } from '@/types/cocktail';
import { 
  searchCocktails, 
  filterByMultipleIngredients, 
  getCocktailsByIds,
  searchCocktailsWithFilters,
  filterByAlcoholic 
} from '@/lib/cocktaildb';

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
    const ingredientsParam = params.get('ingredients');
    const ingredients = ingredientsParam ? ingredientsParam.split(',').filter(Boolean) : [];
    
    return { search, ingredients, alcoholic, tags };
  }, []);
  
  const [filters, setFilters] = useState<FilterState>(getInitialFilters);
  
  // State for API search results
  const [apiSearchResults, setApiSearchResults] = useState<Cocktail[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUsingApiSearch, setIsUsingApiSearch] = useState(false);
  
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
    setUserName,
    hasVoted,
    getVoteCount,
  } = useAppState();
  
  const { cocktails, isLoading: isCocktailsLoading, getSimilar } = useCocktails(state.shortlist);
  
  const isLoading = isStateLoading || (isCocktailsLoading && !isUsingApiSearch);
  
  // Check if user has selected a name
  const hasUserName = useMemo(() => {
    return !!userId && !!state.users[userId];
  }, [userId, state.users]);
  
  // State for name dialog
  const [showNameDialog, setShowNameDialog] = useState(false);
  
  // Show name dialog when user hasn't selected a name (after state loads)
  useEffect(() => {
    if (!isLoading && userId && !hasUserName) {
      setShowNameDialog(true);
    }
  }, [isLoading, userId, hasUserName]);
  
  // Get existing user names for the dialog
  const existingNames = useMemo(() => {
    return Object.values(state.users);
  }, [state.users]);
  
  const handleSelectName = useCallback(async (name: string) => {
    if (userId) {
      await setUserName(userId, name);
      setShowNameDialog(false);
    }
  }, [userId, setUserName]);
  
  const handleSkipName = useCallback(() => {
    setShowNameDialog(false);
  }, []);
  
  // Get available tags from data
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    Object.values(state.tagsByCocktail).forEach(tags => {
      tags.forEach(tag => tagsSet.add(tag));
    });
    return tagsSet.size > 0 ? Array.from(tagsSet) : CUSTOM_TAGS.slice(0, 6);
  }, [state.tagsByCocktail]);
  
  // API search logic - triggered when search query or ingredients are present
  useEffect(() => {
    const hasSearchQuery = filters.search.trim().length > 0;
    const hasIngredients = filters.ingredients.length > 0;
    const shouldUseApi = hasSearchQuery || hasIngredients;
    
    setIsUsingApiSearch(shouldUseApi);
    
    if (!shouldUseApi) {
      setApiSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    // Debounce API calls
    const timeoutId = setTimeout(async () => {
      try {
        let results: Cocktail[] = [];
        
        if (hasSearchQuery && hasIngredients) {
          // Both name search and ingredient filter
          const searchResults = await searchCocktails(filters.search);
          const ingredientIds = await filterByMultipleIngredients(filters.ingredients);
          const ingredientIdsSet = new Set(ingredientIds);
          
          // Intersect: cocktails that match search AND contain all ingredients
          results = searchResults.filter(c => ingredientIdsSet.has(c.id));
        } else if (hasSearchQuery) {
          // Name search only
          results = await searchCocktails(filters.search);
        } else if (hasIngredients) {
          // Ingredient filter only
          const ingredientIds = await filterByMultipleIngredients(filters.ingredients);
          results = await getCocktailsByIds(ingredientIds);
        }
        
        // Apply alcoholic filter via API if needed
        if (filters.alcoholic !== 'all' && results.length > 0) {
          const alcoholicType = filters.alcoholic === 'alcoholic' ? 'Alcoholic' : 'Non_Alcoholic';
          const alcoholicIds = await filterByAlcoholic(alcoholicType);
          const alcoholicIdsSet = new Set(alcoholicIds);
          results = results.filter(c => alcoholicIdsSet.has(c.id));
        }
        
        setApiSearchResults(results);
      } catch (error) {
        console.error('Error performing API search:', error);
        setApiSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, filters.search ? 500 : 0); // Debounce search by 500ms
    
    return () => clearTimeout(timeoutId);
  }, [filters.search, filters.ingredients.join(','), filters.alcoholic]);
  
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
      
      if (filters.ingredients.length > 0) {
        params.set('ingredients', filters.ingredients.join(','));
      } else {
        params.delete('ingredients');
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
  
  // Filter cocktails - use API results when searching, otherwise use shortlist
  const filteredCocktails = useMemo(() => {
    // Use API search results if we're searching
    const sourceCocktails = isUsingApiSearch ? apiSearchResults : cocktails;
    
    // Apply client-side filters (tags, and alcoholic if not using API search)
    return sourceCocktails.filter(c => {
      // Alcoholic filter (only apply client-side if not using API search)
      // API search already applies alcoholic filter
      if (!isUsingApiSearch) {
        if (filters.alcoholic === 'alcoholic' && !c.alcoholic) return false;
        if (filters.alcoholic === 'non-alcoholic' && c.alcoholic) return false;
      }
      
      // Tags filter (always client-side, as tags are custom)
      if (filters.tags.length > 0) {
        const cocktailTags = state.tagsByCocktail[c.id] || [];
        if (!filters.tags.some(tag => cocktailTags.includes(tag))) {
          return false;
        }
      }
      
      return true;
    });
  }, [cocktails, apiSearchResults, isUsingApiSearch, filters, state.tagsByCocktail]);
  
  // Get voted cocktails for ingredients dashboard
  const votedCocktails = useMemo(() => {
    if (!userId) return [];
    const userVotes = state.votesByUser[userId] || [];
    return cocktails.filter(c => userVotes.includes(c.id));
  }, [cocktails, state.votesByUser, userId]);
  
  // Selected cocktail for detail view - check both cocktails and API search results
  const selectedCocktail = useMemo(() => {
    if (!selectedCocktailId) return null;
    return cocktails.find(c => c.id === selectedCocktailId) 
      || apiSearchResults.find(c => c.id === selectedCocktailId)
      || null;
  }, [selectedCocktailId, cocktails, apiSearchResults]);
  
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
      <>
        <CocktailDetail
          cocktail={selectedCocktail}
          hasVoted={hasVoted(userId, selectedCocktail.id)}
          voteCount={getVoteCount(selectedCocktail.id)}
          customTags={state.tagsByCocktail[selectedCocktail.id]}
          similarCocktails={getSimilar(selectedCocktail)}
          hasUserName={hasUserName}
          onVote={() => toggleVote(userId, selectedCocktail.id)}
          onBack={() => setSelectedCocktailId(null)}
          onViewSimilar={(id) => setSelectedCocktailId(id)}
        />
        <UserNameDialog
          open={showNameDialog}
          existingNames={existingNames}
          onSelectName={handleSelectName}
          onSkip={handleSkipName}
        />
      </>
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
            {activeTab === 'cocktails' && (
              isSearching 
                ? 'Searching...'
                : isUsingApiSearch
                  ? `${filteredCocktails.length} result${filteredCocktails.length !== 1 ? 's' : ''} from database`
                  : `${filteredCocktails.length} cocktails to choose from`
            )}
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
            
            {isSearching ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <p>Searching cocktails...</p>
              </div>
            ) : filteredCocktails.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>
                  {isUsingApiSearch 
                    ? 'No cocktails found matching your search.' 
                    : 'No cocktails match your filters.'}
                </p>
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
                      hasUserName={hasUserName}
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
      
      {/* User name dialog */}
      <UserNameDialog
        open={showNameDialog}
        existingNames={existingNames}
        onSelectName={handleSelectName}
        onSkip={handleSkipName}
      />
    </div>
  );
}
