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
import { MyArea } from '@/components/MyArea';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, PartyPopper, Info } from 'lucide-react';
import { Cocktail, CUSTOM_TAGS } from '@/types/cocktail';
import { 
  searchCocktails, 
  filterByMultipleIngredients, 
  getCocktailsByIds,
  filterByAlcoholic,
  getCocktailsByLetter,
} from '@/lib/cocktaildb';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PAGE_SIZE = 12;
const getInitialLetter = () => {
  const params = new URLSearchParams(window.location.search);
  const letter = params.get('letter');
  const normalized = letter ? letter.trim().charAt(0).toUpperCase() : 'A';
  return ALPHABET.includes(normalized) ? normalized : 'A';
};

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>('cocktails');
  const [selectedCocktailId, setSelectedCocktailId] = useState<string | null>(null);
  const [activeLetter, setActiveLetter] = useState<string>(getInitialLetter);
  const [currentPage, setCurrentPage] = useState(1);
  const [letterCocktails, setLetterCocktails] = useState<Cocktail[]>([]);
  const [isLetterLoading, setIsLetterLoading] = useState(true);
  const [votedCocktailDetails, setVotedCocktailDetails] = useState<Cocktail[]>([]);
  
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
  
  const { cocktails: shortlistCocktails, getSimilar } = useCocktails(state.shortlist);
  
  const isLoading = isStateLoading || (!isUsingApiSearch && isLetterLoading);
  
  // Check if user has selected a name
  const hasUserName = useMemo(() => {
    return !!userId && !!state.users[userId];
  }, [userId, state.users]);
  
  const currentUserName = useMemo(() => {
    if (!userId) return '';
    return state.users[userId] || '';
  }, [state.users, userId]);
  
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
  
  // Fetch cocktails for the active letter
  useEffect(() => {
    let cancelled = false;
    const fetchLetter = async () => {
      setIsLetterLoading(true);
      try {
        const results = await getCocktailsByLetter(activeLetter);
        if (!cancelled) {
          setLetterCocktails(results);
        }
      } catch (error) {
        console.error('Error fetching cocktails by letter:', error);
        if (!cancelled) {
          setLetterCocktails([]);
        }
      } finally {
        if (!cancelled) {
          setIsLetterLoading(false);
        }
      }
    };
    
    fetchLetter();
    
    return () => {
      cancelled = true;
    };
  }, [activeLetter]);
  
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
  }, [filters.search, filters.ingredients, filters.alcoholic]);
  
  const updateUrlParams = useCallback(() => {
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
    
    params.set('letter', activeLetter.toLowerCase());
    
    // Ensure endpoint and view are preserved
    if (endpoint) {
      params.set('endpoint', endpoint);
    }
    if (view) {
      params.set('view', view);
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters, activeLetter]);
  
  useEffect(() => {
    const timeoutId = setTimeout(updateUrlParams, filters.search ? 500 : 0);
    return () => clearTimeout(timeoutId);
  }, [filters, updateUrlParams]);
  
  useEffect(() => {
    updateUrlParams();
  }, [activeLetter, updateUrlParams]);
  
  const sourceCocktails = useMemo(
    () => (isUsingApiSearch ? apiSearchResults : letterCocktails),
    [isUsingApiSearch, apiSearchResults, letterCocktails],
  );
  
  // Filter cocktails - use API results when searching, otherwise use letter list
  const filteredCocktails = useMemo(() => {
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
  }, [sourceCocktails, isUsingApiSearch, filters, state.tagsByCocktail]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.search,
    filters.alcoholic,
    filters.tags,
    filters.ingredients,
    isUsingApiSearch,
    activeLetter,
  ]);
  
  const totalPages = Math.max(1, Math.ceil(filteredCocktails.length / PAGE_SIZE));
  
  useEffect(() => {
    setCurrentPage(prev => Math.min(prev, totalPages));
  }, [totalPages]);
  
  const paginatedCocktails = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCocktails.slice(start, start + PAGE_SIZE);
  }, [filteredCocktails, currentPage]);
  
  const pageStart = filteredCocktails.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = filteredCocktails.length === 0 
    ? 0 
    : Math.min(filteredCocktails.length, currentPage * PAGE_SIZE);
  
  // Load voted cocktail details to keep shopping list and MyArea consistent
  useEffect(() => {
    let cancelled = false;
    const loadVotedCocktails = async () => {
      if (!userId) {
        setVotedCocktailDetails([]);
        return;
      }
      
      const votes = state.votesByUser[userId] || [];
      if (votes.length === 0) {
        setVotedCocktailDetails([]);
        return;
      }
      
      const lookup = new Map<string, Cocktail>();
      [...letterCocktails, ...apiSearchResults, ...shortlistCocktails].forEach(c => lookup.set(c.id, c));
      
      const missingIds = votes.filter(id => !lookup.has(id));
      let fetched: Cocktail[] = [];
      if (missingIds.length > 0) {
        fetched = await getCocktailsByIds(missingIds);
        fetched.forEach(c => lookup.set(c.id, c));
      }
      
      if (cancelled) return;
      const ordered = votes
        .map(id => lookup.get(id))
        .filter((c): c is Cocktail => Boolean(c));
      setVotedCocktailDetails(ordered);
    };
    
    loadVotedCocktails();
    
    return () => {
      cancelled = true;
    };
  }, [userId, state.votesByUser, letterCocktails, apiSearchResults, shortlistCocktails]);
  
  // Get voted cocktails for ingredients dashboard
  const votedCocktails = useMemo(() => votedCocktailDetails, [votedCocktailDetails]);
  
  const handleEditName = useCallback(() => {
    setShowNameDialog(true);
  }, []);
  
  const handleToggleVote = useCallback((cocktailId: string) => {
    toggleVote(userId, cocktailId);
  }, [toggleVote, userId]);
  
  const handleViewCocktail = useCallback((cocktailId: string) => {
    setSelectedCocktailId(cocktailId);
  }, []);
  
  const handleBrowseCocktails = useCallback(() => {
    setActiveTab('cocktails');
  }, []);
  
  // Selected cocktail for detail view - look across current lists and saved votes
  const cocktailLookup = useMemo(() => {
    const map = new Map<string, Cocktail>();
    [...sourceCocktails, ...votedCocktailDetails, ...shortlistCocktails].forEach(c => map.set(c.id, c));
    return map;
  }, [sourceCocktails, votedCocktailDetails, shortlistCocktails]);
  
  const selectedCocktail = useMemo(() => {
    if (!selectedCocktailId) return null;
    return cocktailLookup.get(selectedCocktailId) || null;
  }, [selectedCocktailId, cocktailLookup]);
  
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
                  : `${filteredCocktails.length} cocktails starting with "${activeLetter}"`
            )}
            {activeTab === 'ingredients' && `Shopping list for ${votedCocktails.length} selected cocktails`}
            {activeTab === 'my-area' && `Your profile and ${votedCocktails.length} liked cocktail${votedCocktails.length === 1 ? '' : 's'}`}
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
            
            <div className="space-y-3 p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Browse alphabetically</p>
                <span className="text-xs text-muted-foreground">Letter: {activeLetter}</span>
              </div>
              <div className="overflow-x-auto -mx-1">
                <div className="flex items-center gap-1 px-1 pb-1">
                  {ALPHABET.map(letter => {
                    const isActive = activeLetter === letter;
                    return (
                      <Button
                        key={letter}
                        size="sm"
                        variant={isActive ? 'default' : 'ghost'}
                        onClick={() => {
                          setActiveLetter(letter);
                          setCurrentPage(1);
                          setSelectedCocktailId(null);
                        }}
                      >
                        {letter}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
                <span>
                  {filteredCocktails.length === 0
                    ? `No cocktails for "${activeLetter}" with the current filters`
                    : `Showing ${pageStart}-${pageEnd} of ${filteredCocktails.length} for "${activeLetter}"`}
                </span>
                {filteredCocktails.length > 0 && totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <span className="px-2 py-1 rounded-md bg-muted text-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
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
                    : `No cocktails found for "${activeLetter}".`}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {paginatedCocktails.map((cocktail, idx) => (
                    <div 
                      key={cocktail.id}
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
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
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
        
        {/* My area tab */}
        {activeTab === 'my-area' && (
          <MyArea
            userName={currentUserName}
            hasUserName={hasUserName}
            likedCocktails={votedCocktails}
            onEditName={handleEditName}
            onViewCocktail={handleViewCocktail}
            onToggleVote={handleToggleVote}
            hasVoted={(cocktailId) => hasVoted(userId, cocktailId)}
            getVoteCount={getVoteCount}
            customTagsByCocktail={state.tagsByCocktail}
            onBrowseCocktails={handleBrowseCocktails}
          />
        )}
        
        {/* Admin tab */}
        {activeTab === 'admin' && isAdmin && (
          <AdminPanel
            state={state}
            cocktails={shortlistCocktails}
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
