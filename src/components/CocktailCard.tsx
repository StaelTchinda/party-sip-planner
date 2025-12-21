import { Cocktail } from '@/types/cocktail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Heart, Eye, Wine, GlassWater } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CocktailCardProps {
  cocktail: Cocktail;
  hasVoted: boolean;
  voteCount: number;
  customTags?: string[];
  hasUserName: boolean;
  onVote: () => void;
  onView: () => void;
}

export function CocktailCard({
  cocktail,
  hasVoted,
  voteCount,
  customTags = [],
  hasUserName,
  onVote,
  onView,
}: CocktailCardProps) {
  return (
    <div className="group relative bg-card rounded-xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={cocktail.thumbnail}
          alt={cocktail.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        
        {/* Alcoholic badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            variant={cocktail.alcoholic ? 'default' : 'secondary'}
            className={cn(
              "gap-1 text-xs",
              cocktail.alcoholic 
                ? "bg-primary/80 backdrop-blur-sm" 
                : "bg-success/80 backdrop-blur-sm text-success-foreground"
            )}
          >
            {cocktail.alcoholic ? <Wine className="w-3 h-3" /> : <GlassWater className="w-3 h-3" />}
            {cocktail.alcoholic ? 'Alcoholic' : 'Non-Alc'}
          </Badge>
        </div>
        
        {/* Vote count */}
        {voteCount > 0 && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm gap-1">
              <Heart className={cn("w-3 h-3", hasVoted && "fill-accent text-accent")} />
              {voteCount}
            </Badge>
          </div>
        )}
        
        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-xl font-semibold text-foreground leading-tight">
            {cocktail.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{cocktail.category}</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Custom tags */}
        {customTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {customTags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Ingredients preview */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {cocktail.ingredients.slice(0, 4).map(i => i.name).join(' · ')}
          {cocktail.ingredients.length > 4 && ` +${cocktail.ingredients.length - 4} more`}
        </p>
        
        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex-1">
                  <Button
                    variant={hasVoted ? 'voted' : 'vote'}
                    size="sm"
                    className="w-full"
                    onClick={onVote}
                    disabled={!hasUserName}
                  >
                    <Heart className={cn("w-4 h-4", hasVoted && "fill-current")} />
                    {hasVoted ? 'Voted' : 'Vote'}
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
          <Button
            variant="glass"
            size="sm"
            onClick={onView}
          >
            <Eye className="w-4 h-4" />
            View
          </Button>
        </div>
      </div>
    </div>
  );
}
