import { useState, useEffect, useCallback, useMemo } from 'react';
import { Cocktail, BASE_SPIRITS } from '@/types/cocktail';
import { getCocktailsByIds, getCocktailById, findSimilarCocktails, getPopularCocktails } from '@/lib/cocktaildb';

interface UseCocktailsReturn {
  cocktails: Cocktail[];
  isLoading: boolean;
  error: string | null;
  getCocktail: (id: string) => Promise<Cocktail | null>;
  getSimilar: (cocktail: Cocktail) => Cocktail[];
}

export function useCocktails(ids: string[]): UseCocktailsReturn {
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setIsLoading(true);
    
    if (ids.length === 0) {
      // When shortlist is empty, fetch popular cocktails
      getPopularCocktails()
        .then(data => {
          setCocktails(data);
          setError(null);
        })
        .catch(err => {
          setError('Failed to load cocktails');
          console.error(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }
    
    getCocktailsByIds(ids)
      .then(data => {
        setCocktails(data);
        setError(null);
      })
      .catch(err => {
        setError('Failed to load cocktails');
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ids.join(',')]);
  
  const getCocktail = useCallback(async (id: string): Promise<Cocktail | null> => {
    const existing = cocktails.find(c => c.id === id);
    if (existing) return existing;
    return getCocktailById(id);
  }, [cocktails]);
  
  const getSimilar = useCallback((cocktail: Cocktail): Cocktail[] => {
    return findSimilarCocktails(cocktail, cocktails);
  }, [cocktails]);
  
  return {
    cocktails,
    isLoading,
    error,
    getCocktail,
    getSimilar,
  };
}

interface IngredientStats {
  name: string;
  count: number;
  isSpirit: boolean;
}

export function useIngredientStats(cocktails: Cocktail[]): {
  ingredients: IngredientStats[];
  spirits: IngredientStats[];
  totalIngredients: number;
  totalSpirits: number;
} {
  return useMemo(() => {
    const ingredientMap = new Map<string, IngredientStats>();
    
    for (const cocktail of cocktails) {
      for (const ing of cocktail.ingredients) {
        const normalized = ing.name.toLowerCase().trim();
        const isSpirit = BASE_SPIRITS.some(spirit => 
          normalized.includes(spirit) || spirit.includes(normalized)
        );
        
        if (ingredientMap.has(normalized)) {
          const existing = ingredientMap.get(normalized)!;
          existing.count++;
        } else {
          ingredientMap.set(normalized, {
            name: ing.name,
            count: 1,
            isSpirit,
          });
        }
      }
    }
    
    const allIngredients = Array.from(ingredientMap.values())
      .sort((a, b) => b.count - a.count);
    
    const spirits = allIngredients.filter(i => i.isSpirit);
    const ingredients = allIngredients.filter(i => !i.isSpirit);
    
    return {
      ingredients,
      spirits,
      totalIngredients: allIngredients.length,
      totalSpirits: spirits.length,
    };
  }, [cocktails]);
}
