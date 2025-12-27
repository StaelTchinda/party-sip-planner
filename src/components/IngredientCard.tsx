import { IngredientSummary } from '@/types/cocktail';
import { Badge } from '@/components/ui/badge';
import { Beaker, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IngredientCardProps {
  ingredient: IngredientSummary;
  onSelect: (name: string) => void;
}

export function IngredientCard({ ingredient, onSelect }: IngredientCardProps) {
  return (
    <button
      onClick={() => onSelect(ingredient.name)}
      className="group relative bg-card border border-border rounded-xl overflow-hidden text-left shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="aspect-square bg-muted/50 overflow-hidden">
        <img
          src={ingredient.thumbnail}
          alt={ingredient.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-foreground line-clamp-1">{ingredient.name}</p>
          <Beaker className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          {ingredient.type && (
            <Badge variant="secondary" className="text-xs">
              {ingredient.type}
            </Badge>
          )}
          {ingredient.alcoholic !== null && (
            <Badge
              variant={ingredient.alcoholic ? 'default' : 'outline'}
              className={cn(
                "text-xs",
                ingredient.alcoholic ? "bg-primary/15 text-primary" : "text-muted-foreground"
              )}
            >
              <Droplets className="w-3 h-3 mr-1" />
              {ingredient.alcoholic ? 'Alcoholic' : 'Non-alcoholic'}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

