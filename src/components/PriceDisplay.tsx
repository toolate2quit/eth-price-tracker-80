
import { useState, useEffect } from 'react';
import { PriceData } from '@/types';
import { formatPrice } from '@/utils/priceUtils';
import { Card } from '@/components/ui/card';

interface PriceDisplayProps {
  data: PriceData;
  previousPrice?: number;
}

const PriceDisplay = ({ data, previousPrice }: PriceDisplayProps) => {
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  
  useEffect(() => {
    // Determine if price went up or down
    if (previousPrice !== undefined && previousPrice !== data.price) {
      setPriceDirection(data.price > previousPrice ? 'up' : 'down');
      
      // Reset direction after animation
      const timer = setTimeout(() => {
        setPriceDirection(null);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [data.price, previousPrice]);

  // Format the last updated time
  const lastUpdated = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(data.lastUpdated);

  return (
    <Card className="flex flex-col glassmorphism p-6 h-full transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium capitalize">{data.exchange}</h3>
        <span className="text-xs text-muted-foreground">{lastUpdated}</span>
      </div>
      
      <div className="flex-1 flex items-center justify-center my-4">
        <span 
          className={`text-4xl font-light numeric ${
            priceDirection === 'up' 
              ? 'price-increase animate-pulse-once' 
              : priceDirection === 'down' 
                ? 'price-decrease animate-pulse-once' 
                : ''
          }`}
        >
          {formatPrice(data.price)}
        </span>
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        Last updated {data.lastUpdated.toLocaleTimeString()}
      </div>
    </Card>
  );
};

export default PriceDisplay;
