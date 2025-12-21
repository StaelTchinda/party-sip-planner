import { Cocktail, AppConfig, BASE_SPIRITS } from '@/types/cocktail';
import { useIngredientStats } from '@/hooks/useCocktails';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Beaker, Wine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IngredientsDashboardProps {
  cocktails: Cocktail[];
  config: AppConfig;
}

export function IngredientsDashboard({ cocktails, config }: IngredientsDashboardProps) {
  const { ingredients, spirits, totalIngredients, totalSpirits } = useIngredientStats(cocktails);
  
  const ingredientPercent = Math.min((totalIngredients / config.maxIngredients) * 100, 100);
  const spiritPercent = Math.min((totalSpirits / config.maxLiquors) * 100, 100);
  
  const ingredientOverLimit = totalIngredients > config.maxIngredients;
  const spiritOverLimit = totalSpirits > config.maxLiquors;
  
  if (cocktails.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Beaker className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No cocktails selected yet.</p>
        <p className="text-sm mt-1">Vote for cocktails to see ingredient analysis.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Ingredients count */}
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
        
        {/* Spirits count */}
        <div className={cn(
          "bg-card rounded-xl p-4 border",
          spiritOverLimit ? "border-destructive/50" : "border-border"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wine className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Base Spirits</span>
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
      
      {/* Warning messages */}
      {(ingredientOverLimit || spiritOverLimit) && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Over budget!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {ingredientOverLimit && `You have ${totalIngredients - config.maxIngredients} too many ingredients. `}
                {spiritOverLimit && `You have ${totalSpirits - config.maxLiquors} too many base spirits. `}
                Consider removing some cocktails from the selection.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Base spirits list */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <Wine className="w-4 h-4 text-primary" />
          Base Spirits to Buy
        </h3>
        <div className="flex flex-wrap gap-2">
          {spirits.map(spirit => (
            <Badge 
              key={spirit.name} 
              variant="default"
              className="bg-primary/20 text-primary border border-primary/30"
            >
              {spirit.name}
              <span className="ml-1 opacity-70">×{spirit.count}</span>
              {spirit.aggregatedMeasure && (
                <span className="ml-1.5 font-medium">
                  ({spirit.aggregatedMeasure.display})
                </span>
              )}
            </Badge>
          ))}
          {spirits.length === 0 && (
            <p className="text-sm text-muted-foreground">No spirits detected</p>
          )}
        </div>
      </div>
      
      {/* Full ingredients list */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <Beaker className="w-4 h-4 text-primary" />
          Full Ingredient List
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
      </div>
      
      {/* Cocktails included */}
      <div className="text-sm text-muted-foreground text-center">
        Based on {cocktails.length} selected cocktail{cocktails.length !== 1 && 's'}
      </div>
    </div>
  );
}
