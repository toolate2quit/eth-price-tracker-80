
import { useState, useEffect, useCallback } from 'react';
import { PriceData, PriceEvent } from '@/types';
import { fetchPrice, simulateOrderExecution } from '@/services/priceService';
import { 
  isPriceDifferenceSignificant, 
  hasPriceDifferenceInverted,
  calculatePriceDifference, 
  calculateDirectionalDifference,
  generateId,
  hasCooldownPassed,
  calculateArbitrageProfitability
} from '@/utils/priceUtils';
import PriceDisplay from './PriceDisplay';
import EventList from './EventList';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowUpDown, Clock, AlertTriangle } from 'lucide-react';

// Slower refresh interval for more realistic API behavior (10 seconds)
const REFRESH_INTERVAL = 10000;

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
  
  // Trading simulation
  const [simulatingTrade, setSimulatingTrade] = useState(false);
  const [profitEstimate, setProfitEstimate] = useState<number | null>(null);
  
  // Fetch prices from exchanges with simulated network delays
  const fetchPrices = useCallback(async () => {
    try {
      // Each fetch has its own random latency (20-100ms)
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
    
    // Calculate potential profit for UI display
    if (difference > 0) {
      const buyExchange = directionalDifference < 0 ? 'binance' : 'coinbase';
      const sellExchange = directionalDifference < 0 ? 'coinbase' : 'binance';
      const buyPrice = directionalDifference < 0 ? binanceData.price : coinbaseData.price;
      const sellPrice = directionalDifference < 0 ? coinbaseData.price : binanceData.price;
      
      const { isProfit, profitLoss } = calculateArbitrageProfitability(
        buyExchange, 
        sellExchange,
        buyPrice,
        sellPrice
      );
      
      if (isProfit) {
        setProfitEstimate(profitLoss);
      } else {
        setProfitEstimate(null);
      }
    } else {
      setProfitEstimate(null);
    }
    
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
      
      // Simulate trade execution at the beginning of the event
      simulateTrade(higherExchange, lowerExchange, binanceData.price, coinbaseData.price);
      
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

  // Simulate trade execution with latency and slippage
  const simulateTrade = async (
    sellExchange: string, 
    buyExchange: string,
    binancePrice: number,
    coinbasePrice: number
  ) => {
    setSimulatingTrade(true);
    
    try {
      // Determine prices based on exchanges
      const sellPrice = sellExchange === 'binance' ? binancePrice : coinbasePrice;
      const buyPrice = buyExchange === 'binance' ? binancePrice : coinbasePrice;
      
      // Simulate order execution (with latency)
      const [sellResult, buyResult] = await Promise.all([
        simulateOrderExecution(sellExchange, sellPrice, 'sell'),
        simulateOrderExecution(buyExchange, buyPrice, 'buy')
      ]);
      
      // Calculate actual profit/loss based on execution results
      const totalLatency = Math.max(sellResult.latency, buyResult.latency);
      const tradingAmount = 1000; // $1000
      const tokensSold = tradingAmount / sellResult.executionPrice;
      const cost = buyResult.executionPrice * tokensSold;
      const actualProfit = tradingAmount - cost;
      
      // Log the trade simulation results
      console.log('Trade simulation results:', {
        sellExchange,
        buyExchange,
        sellPrice,
        buyPrice,
        sellExecutionPrice: sellResult.executionPrice,
        buyExecutionPrice: buyResult.executionPrice,
        totalLatency: `${totalLatency}ms`,
        actualProfit: actualProfit.toFixed(2),
        sellSuccess: sellResult.success,
        buySuccess: buyResult.success
      });
      
      if (!sellResult.success || !buyResult.success) {
        toast({
          title: "Trade execution failed",
          description: `One or more orders failed to execute. This happens in real markets due to liquidity issues.`,
          variant: "destructive",
        });
      } else if (actualProfit > 0) {
        toast({
          title: "Arbitrage trade profitable",
          description: `Profit: $${actualProfit.toFixed(2)} (Execution time: ${totalLatency}ms)`,
          variant: "default",
        });
      } else {
        toast({
          title: "Arbitrage trade unprofitable",
          description: `Loss: $${Math.abs(actualProfit).toFixed(2)} due to slippage and fees`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error simulating trade:', error);
      toast({
        title: "Trade simulation error",
        description: "Failed to simulate trade execution",
        variant: "destructive",
      });
    } finally {
      setSimulatingTrade(false);
    }
  };

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
        <div>
          <h1 className="text-4xl font-light tracking-tight">Ethereum Price Tracker</h1>
          <p className="text-sm text-muted-foreground">Example B: Enhanced Trading Simulation (refreshes every {REFRESH_INTERVAL/1000}s)</p>
        </div>
        
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
          ) : simulatingTrade ? (
            <Badge variant="secondary" className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Simulating Trade
            </Badge>
          ) : isInCooldown ? (
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
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
          
          {profitEstimate !== null && (
            <div className="mt-2 flex items-center gap-2 text-sm bg-muted p-2 rounded">
              <span className="text-green-500 font-medium">
                Estimated profit: ${profitEstimate.toFixed(2)}
              </span>
              <AlertTriangle className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Before execution latency
              </span>
            </div>
          )}
        </div>
      </Card>
      
      <Separator />
      
      {/* Event list */}
      <EventList events={events} />
    </div>
  );
};

export default PriceTracker;
