import { CocktailDBDrink, Cocktail, Ingredient } from '@/types/cocktail';

const API_BASE = 'https://www.thecocktaildb.com/api/json/v1/1';

// In-memory cache for cocktail data
const cocktailCache = new Map<string, Cocktail>();

function extractIngredients(drink: CocktailDBDrink): Ingredient[] {
  const ingredients: Ingredient[] = [];
  
  for (let i = 1; i <= 15; i++) {
    const ingredientKey = `strIngredient${i}` as keyof CocktailDBDrink;
    const measureKey = `strMeasure${i}` as keyof CocktailDBDrink;
    
    const ingredient = drink[ingredientKey];
    const measure = drink[measureKey];
    
    if (ingredient && typeof ingredient === 'string' && ingredient.trim()) {
      ingredients.push({
        name: ingredient.trim(),
        measure: measure && typeof measure === 'string' ? measure.trim() : null,
      });
    }
  }
  
  return ingredients;
}

function transformDrink(drink: CocktailDBDrink): Cocktail {
  return {
    id: drink.idDrink,
    name: drink.strDrink,
    thumbnail: drink.strDrinkThumb,
    alcoholic: drink.strAlcoholic === 'Alcoholic',
    category: drink.strCategory,
    glass: drink.strGlass,
    instructions: drink.strInstructions,
    ingredients: extractIngredients(drink),
    tags: drink.strTags ? drink.strTags.split(',').map(t => t.trim()) : [],
  };
}

export async function getCocktailById(id: string): Promise<Cocktail | null> {
  // Check cache first
  if (cocktailCache.has(id)) {
    return cocktailCache.get(id)!;
  }
  
  try {
    const response = await fetch(`${API_BASE}/lookup.php?i=${id}`);
    const data = await response.json();
    
    if (data.drinks && data.drinks[0]) {
      const cocktail = transformDrink(data.drinks[0]);
      cocktailCache.set(id, cocktail);
      return cocktail;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching cocktail:', error);
    return null;
  }
}

export async function getCocktailsByIds(ids: string[]): Promise<Cocktail[]> {
  const cocktails: Cocktail[] = [];
  const uncachedIds: string[] = [];
  
  // Get cached cocktails first
  for (const id of ids) {
    if (cocktailCache.has(id)) {
      cocktails.push(cocktailCache.get(id)!);
    } else {
      uncachedIds.push(id);
    }
  }
  
  // Fetch uncached cocktails in parallel (batched)
  if (uncachedIds.length > 0) {
    const fetchPromises = uncachedIds.map(id => getCocktailById(id));
    const results = await Promise.all(fetchPromises);
    
    for (const cocktail of results) {
      if (cocktail) {
        cocktails.push(cocktail);
      }
    }
  }
  
  return cocktails;
}

export async function searchCocktails(query: string): Promise<Cocktail[]> {
  if (!query.trim()) return [];
  
  try {
    const response = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.drinks) {
      const cocktails = data.drinks.map(transformDrink);
      // Cache the results
      for (const cocktail of cocktails) {
        cocktailCache.set(cocktail.id, cocktail);
      }
      return cocktails;
    }
    
    return [];
  } catch (error) {
    console.error('Error searching cocktails:', error);
    return [];
  }
}

export async function filterByIngredient(ingredient: string): Promise<string[]> {
  if (!ingredient.trim()) return [];
  
  try {
    const response = await fetch(`${API_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
    const data = await response.json();
    
    if (data.drinks) {
      return data.drinks.map((d: { idDrink: string }) => d.idDrink);
    }
    
    return [];
  } catch (error) {
    console.error('Error filtering by ingredient:', error);
    return [];
  }
}

export async function filterByAlcoholic(alcoholic: 'Alcoholic' | 'Non_Alcoholic'): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/filter.php?a=${encodeURIComponent(alcoholic)}`);
    const data = await response.json();
    
    if (data.drinks) {
      return data.drinks.map((d: { idDrink: string }) => d.idDrink);
    }
    
    return [];
  } catch (error) {
    console.error('Error filtering by alcohol content:', error);
    return [];
  }
}

export async function getCocktailsByIngredientFilter(ingredient: string): Promise<Cocktail[]> {
  const ids = await filterByIngredient(ingredient);
  if (ids.length === 0) return [];
  return getCocktailsByIds(ids);
}

export async function filterByMultipleIngredients(ingredients: string[]): Promise<string[]> {
  if (ingredients.length === 0) return [];
  if (ingredients.length === 1) return filterByIngredient(ingredients[0]);
  
  // Get IDs for each ingredient
  const ingredientIdSets = await Promise.all(
    ingredients.map(ing => filterByIngredient(ing))
  );
  
  if (ingredientIdSets.length === 0) return [];
  
  // Find intersection - cocktails that contain ALL ingredients
  const intersection = ingredientIdSets.reduce((acc, ids) => {
    const idsSet = new Set(ids);
    return acc.filter(id => idsSet.has(id));
  }, ingredientIdSets[0]);
  
  return intersection;
}

export async function searchCocktailsWithFilters(
  query: string,
  alcoholic?: 'Alcoholic' | 'Non_Alcoholic'
): Promise<Cocktail[]> {
  if (!query.trim()) return [];
  
  try {
    // First search by name
    const searchResults = await searchCocktails(query);
    
    // If no alcoholic filter, return search results as-is
    if (!alcoholic) {
      return searchResults;
    }
    
    // Get IDs of cocktails matching the alcoholic filter
    const alcoholicIds = await filterByAlcoholic(alcoholic);
    const alcoholicIdsSet = new Set(alcoholicIds);
    
    // Filter search results to only include those that match alcoholic filter
    return searchResults.filter(c => alcoholicIdsSet.has(c.id));
  } catch (error) {
    console.error('Error searching cocktails with filters:', error);
    return [];
  }
}

export function calculateSimilarity(cocktail1: Cocktail, cocktail2: Cocktail): number {
  const ingredients1 = new Set(cocktail1.ingredients.map(i => i.name.toLowerCase()));
  const ingredients2 = new Set(cocktail2.ingredients.map(i => i.name.toLowerCase()));
  
  let overlap = 0;
  for (const ing of ingredients1) {
    if (ingredients2.has(ing)) {
      overlap++;
    }
  }
  
  const totalUnique = new Set([...ingredients1, ...ingredients2]).size;
  return totalUnique > 0 ? overlap / totalUnique : 0;
}

export function findSimilarCocktails(
  targetCocktail: Cocktail,
  allCocktails: Cocktail[],
  limit: number = 4
): Cocktail[] {
  const scored = allCocktails
    .filter(c => c.id !== targetCocktail.id)
    .map(c => ({
      cocktail: c,
      score: calculateSimilarity(targetCocktail, c),
    }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);
  
  return scored.slice(0, limit).map(s => s.cocktail);
}

export function clearCache(): void {
  cocktailCache.clear();
}

// Fetch popular cocktails for demo mode
export async function getPopularCocktails(): Promise<Cocktail[]> {
  // Fetch a few popular cocktails by searching common terms
  const searches = ['margarita', 'mojito', 'martini', 'old fashioned', 'daiquiri'];
  const allCocktails: Cocktail[] = [];
  const seenIds = new Set<string>();
  
  for (const term of searches) {
    try {
      const results = await searchCocktails(term);
      for (const cocktail of results.slice(0, 4)) {
        if (!seenIds.has(cocktail.id)) {
          seenIds.add(cocktail.id);
          allCocktails.push(cocktail);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${term}:`, error);
    }
  }
  
  return allCocktails;
}
