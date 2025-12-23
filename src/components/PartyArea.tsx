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
  onSelectCocktail: (cocktailId: string) => void;
}

export function PartyArea({ cocktails, memberCount, config, onSelectCocktail }: PartyAreaProps) {
  const cocktailList = cocktails.map(c => c.cocktail);
  const totalVotes = cocktails.reduce((sum, c) => sum + c.votes, 0);
  const { ingredients, spirits, totalIngredients, totalSpirits } = useIngredientStats(cocktailList);
  
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
              <span className="text-sm text-foreground">{ing.name}</span>
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
    </div>
  );
}

