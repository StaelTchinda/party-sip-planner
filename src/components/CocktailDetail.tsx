import { Cocktail } from '@/types/cocktail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Heart, ArrowLeft, Wine, GlassWater, Martini } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CocktailDetailProps {
  cocktail: Cocktail;
  hasVoted: boolean;
  voteCount: number;
  customTags?: string[];
  similarCocktails?: Cocktail[];
  hasUserName: boolean;
  onVote: () => void;
  onBack: () => void;
  onViewSimilar?: (id: string) => void;
}

export function CocktailDetail({
  cocktail,
  hasVoted,
  voteCount,
  customTags = [],
  similarCocktails = [],
  hasUserName,
  onVote,
  onBack,
  onViewSimilar,
}: CocktailDetailProps) {
  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      {/* Header image */}
      <div className="relative h-72 sm:h-96">
        <img
          src={cocktail.thumbnail}
          alt={cocktail.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back button */}
        <Button
          variant="glass"
          size="icon"
          className="absolute top-4 left-4"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {/* Vote count */}
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm gap-1 text-sm px-3 py-1">
            <Heart className={cn("w-4 h-4", hasVoted && "fill-accent text-accent")} />
            {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
          </Badge>
        </div>
        
        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant={cocktail.alcoholic ? 'default' : 'secondary'}
              className={cn(
                "gap-1",
                cocktail.alcoholic 
                  ? "bg-primary/80 backdrop-blur-sm" 
                  : "bg-success/80 backdrop-blur-sm"
              )}
            >
              {cocktail.alcoholic ? <Wine className="w-3 h-3" /> : <GlassWater className="w-3 h-3" />}
              {cocktail.alcoholic ? 'Alcoholic' : 'Non-Alcoholic'}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Martini className="w-3 h-3" />
              {cocktail.glass}
            </Badge>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            {cocktail.name}
          </h1>
          <p className="text-muted-foreground mt-1">{cocktail.category}</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 sm:px-6 space-y-6 mt-4">
        {/* Vote button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="w-full">
                <Button
                  variant={hasVoted ? 'voted' : 'vote'}
                  size="lg"
                  className="w-full"
                  onClick={onVote}
                  disabled={!hasUserName}
                >
                  <Heart className={cn("w-5 h-5", hasVoted && "fill-current")} />
                  {hasVoted ? 'Remove Vote' : 'Vote for this Cocktail'}
                </Button>
              </span>
            </TooltipTrigger>
            {!hasUserName && (
              <TooltipContent>
                <p>Please select your name to vote</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        
        {/* Custom tags */}
        {customTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customTags.map(tag => (
              <Badge key={tag} variant="secondary" className="capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Ingredients */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-display text-xl font-semibold mb-3">Ingredients</h2>
          <ul className="space-y-2">
            {cocktail.ingredients.map((ing, idx) => (
              <li key={idx} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                <span className="text-foreground">{ing.name}</span>
                {ing.measure && (
                  <span className="text-muted-foreground text-sm">{ing.measure}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Instructions */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-display text-xl font-semibold mb-3">Instructions</h2>
          <p className="text-secondary-foreground leading-relaxed">{cocktail.instructions}</p>
        </div>
        
        {/* Similar cocktails */}
        {similarCocktails.length > 0 && (
          <div>
            <h2 className="font-display text-xl font-semibold mb-3">Similar Options</h2>
            <div className="grid grid-cols-2 gap-3">
              {similarCocktails.map(similar => (
                <button
                  key={similar.id}
                  onClick={() => onViewSimilar?.(similar.id)}
                  className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="aspect-square">
                    <img
                      src={similar.thumbnail}
                      alt={similar.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                    <p className="absolute bottom-2 left-2 right-2 text-sm font-medium text-foreground line-clamp-2">
                      {similar.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
