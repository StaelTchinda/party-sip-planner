// CocktailDB API Types
export interface CocktailDBDrink {
  idDrink: string;
  strDrink: string;
  strDrinkAlternate: string | null;
  strTags: string | null;
  strVideo: string | null;
  strCategory: string;
  strIBA: string | null;
  strAlcoholic: string;
  strGlass: string;
  strInstructions: string;
  strDrinkThumb: string;
  strIngredient1: string | null;
  strIngredient2: string | null;
  strIngredient3: string | null;
  strIngredient4: string | null;
  strIngredient5: string | null;
  strIngredient6: string | null;
  strIngredient7: string | null;
  strIngredient8: string | null;
  strIngredient9: string | null;
  strIngredient10: string | null;
  strIngredient11: string | null;
  strIngredient12: string | null;
  strIngredient13: string | null;
  strIngredient14: string | null;
  strIngredient15: string | null;
  strMeasure1: string | null;
  strMeasure2: string | null;
  strMeasure3: string | null;
  strMeasure4: string | null;
  strMeasure5: string | null;
  strMeasure6: string | null;
  strMeasure7: string | null;
  strMeasure8: string | null;
  strMeasure9: string | null;
  strMeasure10: string | null;
  strMeasure11: string | null;
  strMeasure12: string | null;
  strMeasure13: string | null;
  strMeasure14: string | null;
  strMeasure15: string | null;
}

export interface Ingredient {
  name: string;
  measure: string | null;
}

export interface Cocktail {
  id: string;
  name: string;
  thumbnail: string;
  alcoholic: boolean;
  category: string;
  glass: string;
  instructions: string;
  ingredients: Ingredient[];
  tags: string[];
}

// App State Types (stored in JSONBin)
export interface AppState {
  shortlist: string[];
  votesByUser: Record<string, string[]>;
  tagsByCocktail: Record<string, string[]>;
  config: AppConfig;
}

export interface AppConfig {
  maxIngredients: number;
  maxLiquors: number;
}

// Default base spirits for detection
export const BASE_SPIRITS = [
  'vodka',
  'gin',
  'rum',
  'tequila',
  'whiskey',
  'whisky',
  'bourbon',
  'brandy',
  'cognac',
  'scotch',
  'mezcal',
];

export const DEFAULT_CONFIG: AppConfig = {
  maxIngredients: 30,
  maxLiquors: 3,
};

export const DEFAULT_APP_STATE: AppState = {
  shortlist: [],
  votesByUser: {},
  tagsByCocktail: {},
  config: DEFAULT_CONFIG,
};

export const CUSTOM_TAGS = [
  'sweet',
  'sour',
  'bitter',
  'refreshing',
  'citrusy',
  'creamy',
  'fruity',
  'spicy',
  'herbal',
  'smoky',
  'tropical',
  'classic',
];
