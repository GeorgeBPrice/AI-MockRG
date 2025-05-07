import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

type DailyLimitState = {
  used: number;
  limit: number;
  remaining: number;
  resetTimestamp: number;
  loading: boolean;
  error: string | null;
  formattedTimeUntilReset: string;
  refreshUsage: () => Promise<void>;
};

export function useDailyLimit(userHasOwnApiKey: boolean = false): DailyLimitState {
  const { data: session } = useSession();
  const [state, setState] = useState<Omit<DailyLimitState, 'refreshUsage'>>({
    used: 0,
    limit: 5, // Default limit
    remaining: 5,
    resetTimestamp: 0,
    loading: true,
    error: null,
    formattedTimeUntilReset: '',
  });

  // Function to format time until reset
  const formatTimeUntilReset = (resetTimestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const secondsUntilReset = Math.max(0, resetTimestamp - now);
    
    if (secondsUntilReset <= 0) return 'Resetting soon';
    
    const hours = Math.floor(secondsUntilReset / 3600);
    const minutes = Math.floor((secondsUntilReset % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m until reset`;
    } else if (minutes > 0) {
      return `${minutes}m until reset`;
    } else {
      return 'Less than a minute until reset';
    }
  };

  // Create fetchUsage as a callback so we can both use it in useEffect and expose it
  const fetchUsage = useCallback(async () => {
    // If user has their own API key, no need to fetch usage
    if (userHasOwnApiKey) {
      setState({
        used: 0,
        limit: Infinity,
        remaining: Infinity,
        resetTimestamp: 0,
        loading: false,
        error: null,
        formattedTimeUntilReset: 'No limit with your own API key',
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Add timestamp to avoid potential caching issues
      const response = await fetch(`/api/usage/daily?_t=${Date.now()}`);
      
      if (!response.ok) {
        // If we hit a rate limit on the API itself, just show cached data
        if (response.status === 429) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Rate limited, showing cached data',
          }));
          return;
        }
        throw new Error('Failed to fetch daily usage');
      }
      
      const data = await response.json();
      
      setState({
        used: data.used,
        limit: data.limit,
        remaining: data.remaining,
        resetTimestamp: data.resetTimestamp,
        loading: false,
        error: null,
        formattedTimeUntilReset: formatTimeUntilReset(data.resetTimestamp),
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [userHasOwnApiKey]);

  useEffect(() => {
    fetchUsage();
    
    // Update the timer every minute
    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        formattedTimeUntilReset: formatTimeUntilReset(prev.resetTimestamp),
      }));
    }, 60000);
    
    return () => clearInterval(timer);
  }, [userHasOwnApiKey, session, fetchUsage]);

  // Return everything from state plus the refresh function
  return {
    ...state,
    refreshUsage: fetchUsage,
  };
} 