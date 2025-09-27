// Utility to detect Lace Midnight wallet provider injected into window.cardano
// Tries common keys and provides diagnostics

export type MidnightEnableApi = {
  // Standard wallet methods (may not exist in Lace Preview)
  getChangeAddress?: () => Promise<string>
  getAddress?: () => Promise<string>
  getUsedAddresses?: () => Promise<string[]>
  getUnusedAddresses?: () => Promise<string[]>
  getPublicKey?: () => Promise<string>
  signData?: (address: string, message: string) => Promise<string>
  
  // Lace Midnight Preview methods (actual API)
  balanceAndProveTransaction?: any
  state?: any // Can be object or function
  submitTransaction?: any
  proveTransaction?: any
  balanceTransaction?: any
};

export type MidnightProvider = {
  enable: () => Promise<MidnightEnableApi>
  isEnabled?: () => Promise<boolean>
};

declare global {
  interface Window {
    cardano?: Record<string, any>;
  }
}

export function detectMidnightProvider(): { provider: MidnightProvider | null; providerKey?: string; diagnostics: any } {
  const diagnostics: any = {
    hasWindow: typeof window !== 'undefined',
    hasCardano: false,
    providerKeys: [] as string[],
    hasEthereum: false,
    userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'N/A',
    location: typeof window !== 'undefined' ? window.location?.href : 'N/A',
  };

  if (typeof window === 'undefined') {
    return { provider: null, diagnostics };
  }

  const w = window as any;
  
  // Check for ethereum (MetaMask, etc.)
  diagnostics.hasEthereum = !!w.ethereum;

  // Check for direct midnight injection (Lace Preview might use this)
  diagnostics.hasMidnight = !!w.midnight;
  diagnostics.hasLace = !!w.lace;

  // Check all window keys for wallet-related objects
  const allKeys = Object.keys(window);
  diagnostics.windowKeys = allKeys.filter(k => 
    k.toLowerCase().includes('cardano') || 
    k.toLowerCase().includes('lace') || 
    k.toLowerCase().includes('midnight') ||
    k.toLowerCase().includes('wallet')
  );

  // Check for objects with enable() method anywhere on window
  const enableObjects: string[] = [];
  allKeys.forEach(key => {
    try {
      const obj = w[key];
      if (obj && typeof obj === 'object' && typeof obj.enable === 'function') {
        enableObjects.push(key);
      }
    } catch (e) {
      // Ignore access errors
    }
  });
  diagnostics.enableObjects = enableObjects;

  // Try direct midnight injection first (Lace Preview)
  if (w.midnight) {
    // Check for Lace Midnight Preview structure: window.midnight.mnLace
    if (w.midnight.mnLace && typeof w.midnight.mnLace.enable === 'function') {
      return { provider: w.midnight.mnLace as MidnightProvider, providerKey: 'midnight.mnLace', diagnostics };
    }
    
    // Fallback: check if midnight itself has enable
    if (typeof w.midnight.enable === 'function') {
      return { provider: w.midnight as MidnightProvider, providerKey: 'midnight', diagnostics };
    }
  }

  // Try direct lace injection
  if (w.lace && typeof w.lace.enable === 'function') {
    return { provider: w.lace as MidnightProvider, providerKey: 'lace', diagnostics };
  }

  // Standard cardano wallet API
  const c = w.cardano;
  diagnostics.hasCardano = !!c;
  
  if (c) {
    const keys = Object.keys(c);
    diagnostics.providerKeys = keys;
    
    // Log details about each provider
    diagnostics.providerDetails = {};
    keys.forEach(k => {
      const p = c[k];
      diagnostics.providerDetails[k] = {
        exists: !!p,
        hasEnable: !!(p && typeof p.enable === 'function'),
        type: typeof p,
        keys: p ? Object.keys(p) : []
      };
    });

    // Check standard cardano providers
    if (c.midnight && typeof c.midnight.enable === 'function') {
      return { provider: c.midnight as MidnightProvider, providerKey: 'cardano.midnight', diagnostics };
    }

    if (c.lace && typeof c.lace.enable === 'function') {
      return { provider: c.lace as MidnightProvider, providerKey: 'cardano.lace', diagnostics };
    }

    // Fallback: find any provider entry with enable()
    for (const k of keys) {
      const p = c[k];
      if (p && typeof p.enable === 'function') {
        return { provider: p as MidnightProvider, providerKey: `cardano.${k}`, diagnostics };
      }
    }
  }

  // Last resort: check any object with enable() method
  for (const key of enableObjects) {
    try {
      const obj = w[key];
      if (obj && typeof obj.enable === 'function') {
        return { provider: obj as MidnightProvider, providerKey: key, diagnostics };
      }
    } catch (e) {
      // Ignore
    }
  }

  return { provider: null, diagnostics };
}

