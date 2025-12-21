import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Wine, GlassWater, Filter } from 'lucide-react';
import { CUSTOM_TAGS } from '@/types/cocktail';
import { cn } from '@/lib/utils';

export interface FilterState {
  search: string;
  alcoholic: 'all' | 'alcoholic' | 'non-alcoholic';
  tags: string[];
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableTags?: string[];
}

export function FilterBar({ filters, onChange, availableTags = CUSTOM_TAGS }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };
  
  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    updateFilter('tags', newTags);
  };
  
  const clearFilters = () => {
    onChange({ search: '', alcoholic: 'all', tags: [] });
  };
  
  const hasActiveFilters = filters.alcoholic !== 'all' || filters.tags.length > 0;
  
  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search cocktails..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'glass'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
          )}
        </Button>
      </div>
      
      {/* Expanded filters */}
      {showFilters && (
        <div className="space-y-3 p-3 bg-card rounded-lg border border-border animate-fade-in">
          {/* Alcoholic toggle */}
          <div className="flex gap-2">
            <Button
              variant={filters.alcoholic === 'all' ? 'default' : 'glass'}
              size="sm"
              onClick={() => updateFilter('alcoholic', 'all')}
            >
              All
            </Button>
            <Button
              variant={filters.alcoholic === 'alcoholic' ? 'default' : 'glass'}
              size="sm"
              onClick={() => updateFilter('alcoholic', 'alcoholic')}
              className="gap-1"
            >
              <Wine className="w-3 h-3" />
              Alcoholic
            </Button>
            <Button
              variant={filters.alcoholic === 'non-alcoholic' ? 'default' : 'glass'}
              size="sm"
              onClick={() => updateFilter('alcoholic', 'non-alcoholic')}
              className="gap-1"
            >
              <GlassWater className="w-3 h-3" />
              Non-Alc
            </Button>
          </div>
          
          {/* Tags */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Filter by taste</p>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map(tag => (
                <Badge
                  key={tag}
                  variant={filters.tags.includes(tag) ? 'default' : 'secondary'}
                  className={cn(
                    "cursor-pointer capitalize transition-colors",
                    filters.tags.includes(tag) && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
