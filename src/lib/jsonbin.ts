import { AppState, DEFAULT_APP_STATE } from '@/types/cocktail';

interface JsonBinConfig {
  binId: string;
  accessKey: string;
}

let config: JsonBinConfig | null = null;

export function initJsonBin(binId: string, accessKey: string): void {
  config = { binId, accessKey };
}

export function isConfigured(): boolean {
  return config !== null && config.binId !== 'YOUR_BIN_ID' && config.accessKey !== 'YOUR_ACCESS_KEY';
}

export function hasValidCredentials(): boolean {
  return isConfigured();
}

export async function getAppState(): Promise<AppState> {
  if (!config) {
    throw new Error('JSONBin not configured. Provide bin and access URL params.');
  }
  
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Access-Key': config.accessKey,
      },
    });
    
    if (!response.ok) {
      // If bin doesn't exist (404), return default state
      if (response.status === 404) {
        return DEFAULT_APP_STATE;
      }
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { ...DEFAULT_APP_STATE, ...data.record };
  } catch (error) {
    console.error('Error fetching app state:', error);
    // Return default state on error to allow app to continue
    return DEFAULT_APP_STATE;
  }
}

export async function updateAppState(state: Partial<AppState>): Promise<AppState> {
  if (!config) {
    throw new Error('JSONBin not configured. Provide bin and access URL params.');
  }
  
  // Fetch current state first (for merge)
  const current = await getAppState();
  const merged = { ...current, ...state };
  
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': config.accessKey,
      },
      body: JSON.stringify(merged),
    });
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Failed to update: ${response.status} ${response.statusText}`;
      let detailedError = '';
      
      try {
        const errorData = await response.text();
        if (errorData) {
          detailedError = errorData;
          try {
            const parsed = JSON.parse(errorData);
            errorMessage = parsed.message || parsed.error || errorMessage;
          } catch {
            errorMessage += ` - ${errorData}`;
          }
        }
      } catch (e) {
        // Ignore if we can't parse error response
      }
      
      // Provide more helpful error messages based on status code
      if (response.status === 403) {
        errorMessage = 'Access forbidden. Please verify your access key is correct and has write permissions.';
      } else if (response.status === 401) {
        errorMessage = 'Authentication failed. Please verify your access key is correct.';
      } else if (response.status === 404) {
        errorMessage = 'Bin not found. Please verify your bin ID is correct.';
      } else if (response.status === 400) {
        errorMessage = `Bad request: ${detailedError || 'Invalid data format'}`;
      }
      
      console.error('JSONBin PUT error:', {
        status: response.status,
        statusText: response.statusText,
        url: `https://api.jsonbin.io/v3/b/${config.binId}`,
        binId: config.binId,
        errorBody: detailedError,
        suggestion: response.status === 401 || response.status === 403
          ? 'Check your access key in the JSONBin.io dashboard and ensure it has write permissions.'
          : 'Check the browser console and network tab for more details.',
      });
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.record;
  } catch (error) {
    console.error('Error updating app state:', error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        binId: config.binId,
        url: `https://api.jsonbin.io/v3/b/${config.binId}`,
      });
    }
    throw error;
  }
}

// Retry logic for concurrent updates
export async function updateWithRetry(
  updater: (current: AppState) => Partial<AppState>,
  maxRetries: number = 2
): Promise<AppState> {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      const current = await getAppState();
      const updates = updater(current);
      return await updateAppState(updates);
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        throw error;
      }
      // Small delay before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new Error('Max retries exceeded');
}

