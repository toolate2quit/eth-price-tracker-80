
import { useState, useEffect, useCallback } from 'react';
import { PriceData, PriceEvent } from '@/types';
import { fetchPrice } from '@/services/priceService';
import { 
  isPriceDifferenceSignificant, 
  hasPriceDifferenceInverted,
  calculatePriceDifference, 
  calculateDirectionalDifference,
  generateId,
  hasCooldownPassed
} from '@/utils/priceUtils';
import PriceDisplay from './PriceDisplay';
import EventList from './EventList';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowUpDown } from 'lucide-react';

// Refresh interval in milliseconds
const REFRESH_INTERVAL = 5000;

const PriceTracker = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Price data
  const [binancePrice, setBinancePrice] = useState<PriceData | null>(null);
  const [coinbasePrice, setCoinbasePrice] = useState<PriceData | null>(null);
  const [previousBinancePrice, setPreviousBinancePrice] = useState<number | undefined>(undefined);
  const [previousCoinbasePrice, setPreviousCoinbasePrice] = useState<number | undefined>(undefined);
  
  // Event tracking
  const [events, setEvents] = useState<PriceEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<PriceEvent | null>(null);
  const [lastEventEndTime, setLastEventEndTime] = useState<Date | null>(null);
  const [isInCooldown, setIsInCooldown] = useState(false);

  // Fetch prices from exchanges
  const fetchPrices = useCallback(async () => {
    try {
      const [binanceData, coinbaseData] = await Promise.all([
        fetchPrice('binance'),
        fetchPrice('coinbase')
      ]);
      
      // Store previous prices for animation
      if (binancePrice) {
        setPreviousBinancePrice(binancePrice.price);
      }
      if (coinbasePrice) {
        setPreviousCoinbasePrice(coinbasePrice.price);
      }
      
      // Update current prices
      setBinancePrice(binanceData);
      setCoinbasePrice(coinbaseData);
      
      // Clear loading and error states
      setLoading(false);
      setError(null);
      
      // Process price data for event tracking
      processPriceData(binanceData, coinbaseData);
    } catch (err) {
      setError("Failed to fetch price data. Retrying...");
      console.error("Error fetching prices:", err);
    }
  }, [binancePrice, coinbasePrice]);

  // Process price data to detect and track events
  const processPriceData = useCallback((binanceData: PriceData, coinbaseData: PriceData) => {
    const difference = calculatePriceDifference(binanceData, coinbaseData);
    const directionalDifference = calculateDirectionalDifference(binanceData, coinbaseData);
    const priceDifferenceSignificant = isPriceDifferenceSignificant(binanceData, coinbaseData);
    
    // Check if cooldown period has passed
    const cooldownPassed = hasCooldownPassed(lastEventEndTime);
    
    // Update cooldown state for UI
    if (isInCooldown && cooldownPassed) {
      setIsInCooldown(false);
    }
    
    // Case 1: No current event, cooldown has passed, and price difference is significant - start new event
    if (!currentEvent && cooldownPassed && priceDifferenceSignificant) {
      const higherExchange = directionalDifference > 0 ? 'binance' : 'coinbase';
      const lowerExchange = directionalDifference > 0 ? 'coinbase' : 'binance';
      
      const newEvent: PriceEvent = {
        id: generateId(),
        startTime: new Date(),
        exchangeA: higherExchange,
        exchangeB: lowerExchange,
        initialDifference: difference,
        maxDifference: difference,
        maxDifferenceTime: new Date(),
        status: 'active'
      };
      
      setCurrentEvent(newEvent);
      setEvents(prev => [newEvent, ...prev]);
      
      toast({
        title: "Price event detected",
        description: `${higherExchange.charAt(0).toUpperCase() + higherExchange.slice(1)} price is $${Math.abs(directionalDifference).toFixed(2)} higher than ${lowerExchange}`,
        variant: "default",
      });
    }
    
    // Case 2: Current event exists and price difference is still significant but not inverted - update max difference if needed
    else if (currentEvent && !hasPriceDifferenceInverted(currentEvent.exchangeA, binanceData, coinbaseData)) {
      if (difference > currentEvent.maxDifference) {
        const updatedEvent: PriceEvent = {
          ...currentEvent,
          maxDifference: difference,
          maxDifferenceTime: new Date()
        };
        
        setCurrentEvent(updatedEvent);
        setEvents(prev => prev.map(e => e.id === currentEvent.id ? updatedEvent : e));
        
        toast({
          title: "New maximum difference",
          description: `New maximum price difference of $${difference.toFixed(2)} detected`,
          variant: "default",
        });
      }
    }
    
    // Case 3: Current event exists and price difference has inverted - close event and start cooldown
    else if (currentEvent && hasPriceDifferenceInverted(currentEvent.exchangeA, binanceData, coinbaseData)) {
      const now = new Date();
      const completedEvent: PriceEvent = {
        ...currentEvent,
        endTime: now,
        status: 'completed'
      };
      
      setCurrentEvent(null);
      setLastEventEndTime(now);
      setIsInCooldown(true);
      setEvents(prev => prev.map(e => e.id === currentEvent.id ? completedEvent : e));
      
      toast({
        title: "Price event completed",
        description: `Price difference inverted: now ${currentEvent.exchangeB.charAt(0).toUpperCase() + currentEvent.exchangeB.slice(1)} is significantly higher than ${currentEvent.exchangeA}. Next event detection in 5 seconds.`,
        variant: "default",
      });
    }
  }, [currentEvent, toast, lastEventEndTime, isInCooldown]);

  // Initial fetch and setup interval
  useEffect(() => {
    fetchPrices();
    
    const intervalId = setInterval(fetchPrices, REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [fetchPrices]);

  // Calculate current price difference for display
  const currentDifference = binancePrice && coinbasePrice
    ? calculatePriceDifference(binancePrice, coinbasePrice)
    : 0;
  
  // Determine directional difference (positive means Binance higher, negative means Coinbase higher)
  const directionalDifference = binancePrice && coinbasePrice
    ? calculateDirectionalDifference(binancePrice, coinbasePrice)
    : 0;
  
  // Determine if current difference meets our tracking condition
  const isPriceSignificant = binancePrice && coinbasePrice && 
    isPriceDifferenceSignificant(binancePrice, coinbasePrice);

  return (
    <div className="space-y-8">
      {/* Header with status indicator */}
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <h1 className="text-4xl font-light tracking-tight">Ethereum Price Tracker</h1>
        
        <div className="flex items-center space-x-2">
          {loading ? (
            <Badge variant="outline" className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Initializing
            </Badge>
          ) : error ? (
            <Badge variant="destructive" className="flex items-center gap-2">
              Error
            </Badge>
          ) : isInCooldown ? (
            <Badge variant="outline" className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cooldown (5s)
            </Badge>
          ) : currentEvent ? (
            <Badge variant="secondary" className="animate-pulse flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning-foreground"></span>
              Active Event
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Monitoring
            </Badge>
          )}
        </div>
      </div>
      
      {/* Price displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <>
            <Card className="h-40 glassmorphism animate-pulse"></Card>
            <Card className="h-40 glassmorphism animate-pulse"></Card>
          </>
        ) : (
          <>
            {binancePrice && (
              <PriceDisplay 
                data={binancePrice} 
                previousPrice={previousBinancePrice}
              />
            )}
            
            {coinbasePrice && (
              <PriceDisplay 
                data={coinbasePrice}
                previousPrice={previousCoinbasePrice}
              />
            )}
          </>
        )}
      </div>
      
      {/* Price difference indicator */}
      <Card className={`p-6 glassmorphism transition-all duration-500 ${
        isPriceSignificant ? 'border-warning' : ''
      }`}>
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center gap-2">
            <ArrowUpDown className={`h-5 w-5 ${
              isPriceSignificant ? 'text-warning' : 'text-muted-foreground'
            }`} />
            <h3 className="text-lg font-medium">Current Price Difference</h3>
          </div>
          
          <span className={`text-3xl font-light ${
            isPriceSignificant ? 'text-warning animate-pulse-once' : ''
          }`}>
            {directionalDifference >= 0 ? '+' : '-'}${Math.abs(directionalDifference).toFixed(2)}
          </span>
          
          <span className="text-sm text-muted-foreground">
            {isInCooldown 
              ? "Cooldown period: Waiting 5 seconds before the next event"
              : isPriceSignificant 
                ? `${directionalDifference > 0 ? 'Binance' : 'Coinbase'} price is significantly higher than ${directionalDifference > 0 ? 'Coinbase' : 'Binance'}`
                : 'Prices are within normal range'}
          </span>
        </div>
      </Card>
      
      <Separator />
      
      {/* Event list */}
      <EventList events={events} />
    </div>
  );
};

export default PriceTracker;
