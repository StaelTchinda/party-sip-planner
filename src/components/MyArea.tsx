import { Cocktail } from '@/types/cocktail';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CocktailCard } from '@/components/CocktailCard';
import { Heart, Pencil, Sparkles, SmilePlus } from 'lucide-react';

interface MyAreaProps {
  userName?: string;
  hasUserName: boolean;
  likedCocktails: Cocktail[];
  onEditName: () => void;
  onViewCocktail: (cocktailId: string) => void;
  onToggleVote: (cocktailId: string) => void;
  hasVoted: (cocktailId: string) => boolean;
  getVoteCount: (cocktailId: string) => number;
  customTagsByCocktail: Record<string, string[]>;
  onBrowseCocktails: () => void;
}

function getInitials(name?: string) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  const initials = parts.slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('');
  return initials || '??';
}

export function MyArea({
  userName,
  hasUserName,
  likedCocktails,
  onEditName,
  onViewCocktail,
  onToggleVote,
  hasVoted,
  getVoteCount,
  customTagsByCocktail,
  onBrowseCocktails,
}: MyAreaProps) {
  const initials = getInitials(userName);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 shadow-inner">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                My area
                <Badge variant="secondary" className="text-xs">Profile</Badge>
              </CardTitle>
              <CardDescription>Update your name and keep your votes in sync.</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onEditName}>
            <Pencil className="w-4 h-4 mr-2" />
            {hasUserName ? 'Change name' : 'Choose name'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Current name</p>
              <p className="text-lg font-semibold">
                {hasUserName ? userName : 'No name selected yet'}
              </p>
            </div>
            {!hasUserName && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                Needed to vote
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Pick a name so your votes are saved and your friends can see who picked what.
            You can change it anytime.
          </p>
          {!hasUserName && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <SmilePlus className="w-4 h-4" />
              <span>Choose a name to unlock voting.</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              Your liked cocktails
              <Heart className="w-4 h-4 text-primary" />
            </CardTitle>
            <CardDescription>Everything you have voted for in one place.</CardDescription>
          </div>
          <Badge variant="secondary" className="self-start">
            {likedCocktails.length} saved
          </Badge>
        </CardHeader>
        <CardContent>
          {likedCocktails.length === 0 ? (
            <div className="text-center py-10 space-y-4">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
              <div className="space-y-1">
                <p className="font-medium">No favorites yet</p>
                <p className="text-sm text-muted-foreground">
                  Like cocktails to see them here for quick access.
                </p>
              </div>
              <Button onClick={onBrowseCocktails} variant="default">
                Browse cocktails
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {likedCocktails.map((cocktail, idx) => (
                <div
                  key={cocktail.id}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  className="animate-fade-in"
                >
                  <CocktailCard
                    cocktail={cocktail}
                    hasVoted={hasVoted(cocktail.id)}
                    voteCount={getVoteCount(cocktail.id)}
                    customTags={customTagsByCocktail[cocktail.id]}
                    hasUserName={hasUserName}
                    onVote={() => onToggleVote(cocktail.id)}
                    onView={() => onViewCocktail(cocktail.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

