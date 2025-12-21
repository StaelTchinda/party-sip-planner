import { useState } from 'react';
import { Cocktail, AppState, CUSTOM_TAGS } from '@/types/cocktail';
import { searchCocktails } from '@/lib/cocktaildb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Search, Plus, X, Crown, Settings, Tag, List, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminPanelProps {
  state: AppState;
  cocktails: Cocktail[];
  onUpdateShortlist: (shortlist: string[]) => Promise<void>;
  onUpdateTags: (cocktailId: string, tags: string[]) => Promise<void>;
  onUpdateConfig: (config: AppState['config']) => Promise<void>;
  getVoteCount: (cocktailId: string) => number;
}

export function AdminPanel({
  state,
  cocktails,
  onUpdateShortlist,
  onUpdateTags,
  onUpdateConfig,
  getVoteCount,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'shortlist' | 'tags' | 'config' | 'leaderboard'>('shortlist');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Cocktail[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchCocktails(searchQuery);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };
  
  const addToShortlist = async (id: string) => {
    if (!state.shortlist.includes(id)) {
      await onUpdateShortlist([...state.shortlist, id]);
    }
  };
  
  const removeFromShortlist = async (id: string) => {
    await onUpdateShortlist(state.shortlist.filter(i => i !== id));
  };
  
  const toggleTag = async (cocktailId: string, tag: string) => {
    const currentTags = state.tagsByCocktail[cocktailId] || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    await onUpdateTags(cocktailId, newTags);
  };
  
  const leaderboard = [...cocktails]
    .map(c => ({ ...c, votes: getVoteCount(c.id) }))
    .sort((a, b) => b.votes - a.votes);
  
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Admin header */}
      <div className="flex items-center gap-2 text-primary">
        <Crown className="w-5 h-5" />
        <h2 className="font-display text-xl font-semibold">Admin Tools</h2>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'shortlist', icon: List, label: 'Shortlist' },
          { id: 'tags', icon: Tag, label: 'Tags' },
          { id: 'config', icon: Settings, label: 'Config' },
          { id: 'leaderboard', icon: Crown, label: 'Leaderboard' },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'glass'}
            size="sm"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="shrink-0"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>
      
      {/* Shortlist management */}
      {activeTab === 'shortlist' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search CocktailDB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-card"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          
          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-3 space-y-2">
              <p className="text-sm text-muted-foreground">Search results</p>
              {searchResults.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={c.thumbnail} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                    <span className="text-sm truncate">{c.name}</span>
                  </div>
                  {state.shortlist.includes(c.id) ? (
                    <Badge variant="secondary">Added</Badge>
                  ) : (
                    <Button size="sm" variant="gold" onClick={() => addToShortlist(c.id)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Current shortlist */}
          <div className="bg-card rounded-lg border border-border p-3">
            <p className="text-sm text-muted-foreground mb-2">
              Current shortlist ({state.shortlist.length} cocktails)
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cocktails.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2 py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={c.thumbnail} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                    <span className="text-sm truncate">{c.name}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeFromShortlist(c.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {cocktails.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No cocktails in shortlist. Search to add some!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Tags management */}
      {activeTab === 'tags' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a cocktail to edit its tags
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            {cocktails.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCocktail(c)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border text-left transition-colors",
                  selectedCocktail?.id === c.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <img src={c.thumbnail} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                <span className="text-sm truncate">{c.name}</span>
              </button>
            ))}
          </div>
          
          {selectedCocktail && (
            <div className="bg-card rounded-lg border border-border p-4 space-y-3">
              <p className="font-medium">{selectedCocktail.name}</p>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_TAGS.map(tag => {
                  const currentTags = state.tagsByCocktail[selectedCocktail.id] || [];
                  const isSelected = currentTags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? 'default' : 'secondary'}
                      className={cn(
                        "cursor-pointer capitalize transition-colors",
                        isSelected && "bg-primary"
                      )}
                      onClick={() => toggleTag(selectedCocktail.id, tag)}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Config */}
      {activeTab === 'config' && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxIngredients">Max Ingredients</Label>
            <Input
              id="maxIngredients"
              type="number"
              value={state.config.maxIngredients}
              onChange={(e) => onUpdateConfig({ 
                ...state.config, 
                maxIngredients: parseInt(e.target.value) || 30 
              })}
              className="bg-secondary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxLiquors">Max Base Spirits</Label>
            <Input
              id="maxLiquors"
              type="number"
              value={state.config.maxLiquors}
              onChange={(e) => onUpdateConfig({ 
                ...state.config, 
                maxLiquors: parseInt(e.target.value) || 3 
              })}
              className="bg-secondary"
            />
          </div>
        </div>
      )}
      
      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="bg-card rounded-lg border border-border">
          {leaderboard.map((c, idx) => (
            <div 
              key={c.id}
              className="flex items-center gap-3 p-3 border-b border-border/50 last:border-0"
            >
              <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                idx === 0 && "bg-primary text-primary-foreground",
                idx === 1 && "bg-muted text-foreground",
                idx === 2 && "bg-accent/30 text-accent",
                idx > 2 && "bg-secondary text-secondary-foreground"
              )}>
                {idx + 1}
              </span>
              <img src={c.thumbnail} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.votes} votes</p>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No votes yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
