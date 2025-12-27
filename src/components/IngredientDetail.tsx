import { Cocktail, IngredientDetail as IngredientDetailType } from '@/types/cocktail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Droplets, Martini, Beaker, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IngredientDetailProps {
  ingredient: IngredientDetailType;
  cocktails: Cocktail[];
  onBack: () => void;
  onViewCocktail: (id: string) => void;
}

export function IngredientDetail({ ingredient, cocktails, onBack, onViewCocktail }: IngredientDetailProps) {
  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <div className="relative h-64 sm:h-80 bg-muted">
        <img
          src={ingredient.thumbnail}
          alt={ingredient.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <Button
          variant="glass"
          size="icon"
          className="absolute top-4 left-4"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="gap-1 bg-background/80 backdrop-blur-sm">
              <Beaker className="w-3 h-3" />
              Ingredient
            </Badge>
            {ingredient.type && (
              <Badge variant="secondary" className="gap-1 bg-background/70 backdrop-blur-sm">
                <Martini className="w-3 h-3" />
                {ingredient.type}
              </Badge>
            )}
            {ingredient.alcoholic !== null && (
              <Badge
                variant={ingredient.alcoholic ? 'default' : 'outline'}
                className={cn(
                  "gap-1",
                  ingredient.alcoholic ? "bg-primary/80 backdrop-blur-sm" : "bg-background/70 backdrop-blur-sm"
                )}
              >
                <Droplets className="w-3 h-3" />
                {ingredient.alcoholic ? 'Alcoholic' : 'Non-alcoholic'}
              </Badge>
            )}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            {ingredient.name}
          </h1>
          {ingredient.abv && (
            <p className="text-muted-foreground mt-1">ABV: {ingredient.abv}%</p>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 space-y-6 mt-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-display text-xl font-semibold mb-3">About</h2>
          <p className="text-secondary-foreground leading-relaxed">
            {ingredient.description || 'No description available for this ingredient.'}
          </p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-display text-xl font-semibold mb-3">
            Cocktails using {ingredient.name}
          </h2>
          {cocktails.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No cocktails found with this ingredient.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cocktails.map(cocktail => (
                <div
                  key={cocktail.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg bg-secondary/30"
                >
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted/50 flex-shrink-0">
                    <img
                      src={cocktail.thumbnail}
                      alt={cocktail.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{cocktail.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {cocktail.category} • {cocktail.glass}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewCocktail(cocktail.id)}
                    className="flex-shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

