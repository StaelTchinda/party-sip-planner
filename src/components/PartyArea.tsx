import { useMemo } from 'react';
import { Cocktail, AppConfig } from '@/types/cocktail';
import { useIngredientStats } from '@/hooks/useCocktails';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PartyPopper, Users, Trophy, Beaker, Wine, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PartyCocktail {
  cocktail: Cocktail;
  votes: number;
}

interface PartyAreaProps {
  cocktails: PartyCocktail[];
  memberCount: number;
  config: AppConfig;
  candidateCocktails: Cocktail[];
  onSelectCocktail: (cocktailId: string) => void;
  onSelectIngredient?: (ingredient: string) => void;
}

export function PartyArea({ cocktails, memberCount, config, candidateCocktails, onSelectCocktail, onSelectIngredient }: PartyAreaProps) {
  const cocktailList = useMemo(() => cocktails.map(c => c.cocktail), [cocktails]);
  const totalVotes = cocktails.reduce((sum, c) => sum + c.votes, 0);
  const { ingredients, spirits, totalIngredients, totalSpirits } = useIngredientStats(cocktailList);
  const availableIngredients = useMemo(() => {
    const set = new Set<string>();
    cocktailList.forEach(cocktail => {
      cocktail.ingredients.forEach(ing => set.add(ing.name.trim().toLowerCase()));
    });
    return set;
  }, [cocktailList]);
  const recommendations = useMemo(() => {
    if (candidateCocktails.length === 0 || availableIngredients.size === 0) {
      return [];
    }
    const votedIds = new Set(cocktailList.map(c => c.id));
    return candidateCocktails.filter(cocktail => {
      if (votedIds.has(cocktail.id)) return false;
      return cocktail.ingredients.every(ing => availableIngredients.has(ing.name.trim().toLowerCase()));
    });
  }, [candidateCocktails, availableIngredients, cocktailList]);
  
  const ingredientPercent = Math.min((totalIngredients / config.maxIngredients) * 100, 100);
  const spiritPercent = Math.min((totalSpirits / config.maxLiquors) * 100, 100);
  const ingredientOverLimit = totalIngredients > config.maxIngredients;
  const spiritOverLimit = totalSpirits > config.maxLiquors;
  
  if (cocktails.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <PartyPopper className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No votes yet.</p>
        <p className="text-sm mt-1">When guests vote, the party summary will appear here.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Members</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {memberCount}
            <span className="text-sm font-normal text-muted-foreground"> total</span>
          </p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Voted cocktails</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {cocktails.length}
            <span className="text-sm font-normal text-muted-foreground"> unique</span>
          </p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PartyPopper className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total votes</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {totalVotes}
            <span className="text-sm font-normal text-muted-foreground"> cast</span>
          </p>
        </div>
      </div>
      
      {/* Cocktails list */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Cocktail votes
        </h3>
        <div className="space-y-2">
          {cocktails.map(item => (
            <button
              key={item.cocktail.id}
              onClick={() => onSelectCocktail(item.cocktail.id)}
              className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div>
                <p className="font-medium text-foreground">{item.cocktail.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.cocktail.ingredients.length} ingredients • {item.cocktail.glass}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {item.votes} vote{item.votes === 1 ? '' : 's'}
              </Badge>
            </button>
          ))}
        </div>
      </div>
      
      {/* Ingredient summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={cn(
          "bg-card rounded-xl p-4 border",
          ingredientOverLimit ? "border-destructive/50" : "border-border"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Beaker className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Ingredients</span>
            </div>
            {ingredientOverLimit ? (
              <AlertTriangle className="w-4 h-4 text-destructive" />
            ) : (
              <CheckCircle className="w-4 h-4 text-success" />
            )}
          </div>
          <p className={cn(
            "text-2xl font-bold",
            ingredientOverLimit ? "text-destructive" : "text-foreground"
          )}>
            {totalIngredients}
            <span className="text-sm font-normal text-muted-foreground"> / {config.maxIngredients}</span>
          </p>
          <Progress 
            value={ingredientPercent} 
            className={cn("h-1.5 mt-2", ingredientOverLimit && "[&>div]:bg-destructive")}
          />
        </div>
        
        <div className={cn(
          "bg-card rounded-xl p-4 border",
          spiritOverLimit ? "border-destructive/50" : "border-border"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wine className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Base spirits</span>
            </div>
            {spiritOverLimit ? (
              <AlertTriangle className="w-4 h-4 text-destructive" />
            ) : (
              <CheckCircle className="w-4 h-4 text-success" />
            )}
          </div>
          <p className={cn(
            "text-2xl font-bold",
            spiritOverLimit ? "text-destructive" : "text-foreground"
          )}>
            {totalSpirits}
            <span className="text-sm font-normal text-muted-foreground"> / {config.maxLiquors}</span>
          </p>
          <Progress 
            value={spiritPercent} 
            className={cn("h-1.5 mt-2", spiritOverLimit && "[&>div]:bg-destructive")}
          />
        </div>
      </div>
      
      {/* Full ingredient list */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <Beaker className="w-4 h-4 text-primary" />
          Full ingredient list
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {ingredients.map(ing => (
            <div 
              key={ing.name}
              className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-secondary/50"
            >
              <button
                type="button"
                onClick={() => onSelectIngredient?.(ing.name)}
                className="text-sm text-left text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                {ing.name}
              </button>
              <div className="flex items-center gap-2">
                {ing.aggregatedMeasure && (
                  <span className="text-xs text-muted-foreground">
                    {ing.aggregatedMeasure.display}
                  </span>
                )}
                <Badge variant="secondary" className="text-xs">
                  ×{ing.count}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center mt-3">
          Based on {cocktails.length} cocktail{cocktails.length === 1 ? '' : 's'} and {totalVotes} vote{totalVotes === 1 ? '' : 's'}
        </p>
      </div>

      {/* Ready-to-make recommendations */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary" />
          Cocktails you can make now
        </h3>
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No extra cocktails fit the current shopping list yet. Add more overlapping votes to unlock ready-to-make ideas.
          </p>
        ) : (
          <div className="space-y-3">
            {recommendations.map(cocktail => (
              <div
                key={cocktail.id}
                className="p-3 rounded-lg border border-border/60 bg-secondary/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{cocktail.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cocktail.ingredients.length} ingredients • {cocktail.glass}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Ready with current list
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {cocktail.ingredients.map(ing => (
                    <span
                      key={`${cocktail.id}-${ing.name}`}
                      className="text-xs px-2 py-1 rounded-full bg-background border border-border text-foreground"
                    >
                      {ing.name}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Uses only ingredients already on the shopping list—no extras needed.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

