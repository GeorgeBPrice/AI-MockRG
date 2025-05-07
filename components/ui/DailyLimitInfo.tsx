import React, { forwardRef, useImperativeHandle } from 'react';
import { useDailyLimit } from '@/hooks/useDailyLimit';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface DailyLimitInfoProps {
  hasOwnApiKey?: boolean;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export type DailyLimitInfoRef = {
  refreshUsage: () => Promise<void>;
};

export const DailyLimitInfo = forwardRef<DailyLimitInfoRef, DailyLimitInfoProps>(
  function DailyLimitInfo({ hasOwnApiKey = false, variant = 'compact', className = '' }, ref) {
    const { 
      remaining, 
      limit, 
      used, 
      formattedTimeUntilReset, 
      loading,
      refreshUsage
    } = useDailyLimit(hasOwnApiKey);
    
    // Expose the refreshUsage function to the parent component
    useImperativeHandle(ref, () => ({
      refreshUsage
    }));

    // Return nothing if loading or has own API key in compact mode
    if (loading) {
      return <div className={`text-sm text-muted-foreground ${className}`}>Loading usage data...</div>;
    }

    if (hasOwnApiKey && variant === 'compact') {
      return null;
    }

    // If user has their own API key
    if (hasOwnApiKey) {
      return (
        <div className={`text-sm text-green-600 ${className}`}>
          Using your own API key - no generation limits apply
        </div>
      );
    }

    // Color coding based on remaining uses
    const getStatusColor = () => {
      if (remaining === 0) return 'text-red-600';
      if (remaining <= 2) return 'text-amber-600';
      return 'text-green-600';
    };

    // Detailed variant with progress bar
    if (variant === 'detailed') {
      const progress = Math.max(0, Math.min(100, (used / limit) * 100));
      
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Daily Free Generations</div>
            <div className={`text-sm font-medium ${getStatusColor()}`}>
              {remaining} of {limit} remaining
            </div>
          </div>
          
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full ${remaining === 0 ? 'bg-red-600' : 'bg-primary'}`} 
              style={{ width: `${progress}%` }} 
            />
          </div>
          
          <div className="text-xs text-muted-foreground">
            {remaining === 0 ? 
              `Limit reached. Resets in ${formattedTimeUntilReset}` : 
              `Resets in ${formattedTimeUntilReset}`
            }
          </div>
        </div>
      );
    }

    // Compact variant (default)
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1.5 text-sm ${getStatusColor()} ${className}`}>
              <span>{remaining} free {remaining === 1 ? 'generation' : 'generations'} left</span>
              <InfoIcon className="h-4 w-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>You have {remaining} of {limit} free daily generations remaining.</p>
            <p className="mt-1 text-xs text-muted-foreground">Limit resets in {formattedTimeUntilReset}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
); 