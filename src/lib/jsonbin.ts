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
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const data = await response.json();
    return { ...DEFAULT_APP_STATE, ...data.record };
  } catch (error) {
    console.error('Error fetching app state:', error);
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
      throw new Error(`Failed to update: ${response.status}`);
    }
    
    const data = await response.json();
    return data.record;
  } catch (error) {
    console.error('Error updating app state:', error);
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
