
import { useState, useEffect, useCallback, useRef } from 'react';
import { PriceData, PriceDifferenceRecord } from '@/types';
import { 
  fetchPrice, 
  initializeWebSockets, 
  closeWebSockets,
  getConnectionStatus
} from '@/services/priceService';
import { 
  calculatePriceDifference, 
  calculateDirectionalDifference,
  generateId,
  formatDateTime
} from '@/utils/priceUtils';
import PriceDisplay from './PriceDisplay';
import PriceHistory from './PriceHistory';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { ArrowDown, ArrowUp, Loader2, Wifi, WifiOff } from 'lucide-react';

// Constants
const DATA_COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const DATA_RETENTION_PERIOD = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const PRICE_REFRESH_INTERVAL = 2000; // 2 seconds

const PriceTracker = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [websocketsEnabled, setWebsocketsEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({
    binance: false,
    coinbase: false
  });
  
  // Price data
  const [binancePrice, setBinancePrice] = useState<PriceData | null>(null);
  const [coinbasePrice, setCoinbasePrice] = useState<PriceData | null>(null);
  const [previousBinancePrice, setPreviousBinancePrice] = useState<number | undefined>(undefined);
  const [previousCoinbasePrice, setPreviousCoinbasePrice] = useState<number | undefined>(undefined);
  
  // Price history tracking
  const [priceRecords, setPriceRecords] = useState<PriceDifferenceRecord[]>([]);
  const lastRecordTimeRef = useRef<Date | null>(null);
  
  // Handle WebSocket toggle
  const handleWebSocketToggle = (enabled: boolean) => {
    setWebsocketsEnabled(enabled);
    
    if (enabled) {
      toast({
        title: "WebSockets Enabled",
        description: "Connecting to exchange WebSockets...",
      });
      
      const status = initializeWebSockets();
      setConnectionStatus(status);
    } else {
      toast({
        title: "WebSockets Disabled",
        description: "Disconnected from exchange WebSockets. Using simulated data.",
      });
      
      closeWebSockets();
      setConnectionStatus({
        binance: false,
        coinbase: false
      });
    }
  };
  
  // Check if it's time to record a new data point (every 5 minutes)
  const shouldRecordDataPoint = useCallback((now: Date) => {
    if (!lastRecordTimeRef.current) return true;
    
    const timeSinceLastRecord = now.getTime() - lastRecordTimeRef.current.getTime();
    return timeSinceLastRecord >= DATA_COLLECTION_INTERVAL;
  }, []);
  
  // Record a new price difference data point
  const recordPriceDifferenceDataPoint = useCallback((binanceData: PriceData, coinbaseData: PriceData) => {
    const now = new Date();
    
    // Only record data every 5 minutes
    if (shouldRecordDataPoint(now)) {
      const difference = calculateDirectionalDifference(binanceData, coinbaseData);
      const absoluteDifference = calculatePriceDifference(binanceData, coinbaseData);
      
      const newRecord: PriceDifferenceRecord = {
        id: generateId(),
        timestamp: now,
        binancePrice: binanceData.price,
        coinbasePrice: coinbaseData.price,
        difference,
        absoluteDifference
      };
      
      setPriceRecords(prevRecords => {
        // Add new record
        const updatedRecords = [...prevRecords, newRecord];
        
        // Filter out records older than 30 days
        const cutoffTime = now.getTime() - DATA_RETENTION_PERIOD;
        const filteredRecords = updatedRecords.filter(
          record => record.timestamp.getTime() > cutoffTime
        );
        
        // If records were removed, log it
        if (filteredRecords.length < updatedRecords.length) {
          console.log(`Removed ${updatedRecords.length - filteredRecords.length} records older than 30 days`);
        }
        
        return filteredRecords;
      });
      
      lastRecordTimeRef.current = now;
      
      console.log(`Recorded price difference at ${formatDateTime(now)}: $${difference.toFixed(2)}`);
    }
  }, [shouldRecordDataPoint]);

  // Fetch prices from exchanges
  const fetchPrices = useCallback(async () => {
    try {
      const [binanceData, coinbaseData] = await Promise.all([
        fetchPrice('binance'),
        fetchPrice('coinbase')
      ]);
      
      // Update connection status
      if (websocketsEnabled) {
        const currentStatus = getConnectionStatus();
        setConnectionStatus(currentStatus);
      }
      
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
      setLoading(false);
      setError(null);
      
      // Record price data if both prices are available
      if (binanceData && coinbaseData) {
        recordPriceDifferenceDataPoint(binanceData, coinbaseData);
      }
    } catch (err) {
      setError("Failed to fetch price data. Retrying...");
      console.error("Error fetching prices:", err);
    }
  }, [binancePrice, coinbasePrice, recordPriceDifferenceDataPoint, websocketsEnabled]);

  // Initialize WebSockets and setup price fetching on component mount
  useEffect(() => {
    // Initialize WebSockets on first load
    if (websocketsEnabled) {
      const status = initializeWebSockets();
      setConnectionStatus(status);
    }
    
    // Fetch prices immediately
    fetchPrices();
    
    // Set up interval for regular price updates
    const intervalId = setInterval(fetchPrices, PRICE_REFRESH_INTERVAL);
    
    // Cleanup on component unmount
    return () => {
      clearInterval(intervalId);
      closeWebSockets();
    };
  }, [fetchPrices, websocketsEnabled]);

  // Load saved price records from localStorage on initial load
  useEffect(() => {
    try {
      const savedRecords = localStorage.getItem('priceRecords');
      if (savedRecords) {
        const parsedRecords = JSON.parse(savedRecords);
        
        // Convert string dates back to Date objects
        const recordsWithDates = parsedRecords.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }));
        
        // Filter out records older than retention period
        const now = new Date();
        const cutoffTime = now.getTime() - DATA_RETENTION_PERIOD;
        const filteredRecords = recordsWithDates.filter(
          (record: PriceDifferenceRecord) => record.timestamp.getTime() > cutoffTime
        );
        
        setPriceRecords(filteredRecords);
        console.log(`Loaded ${filteredRecords.length} price records from storage`);
        
        // Set last record time if we have records
        if (filteredRecords.length > 0) {
          const latestRecord = filteredRecords.reduce((latest, record) => 
            record.timestamp > latest.timestamp ? record : latest, filteredRecords[0]);
          lastRecordTimeRef.current = latestRecord.timestamp;
        }
      }
    } catch (error) {
      console.error('Error loading saved price records:', error);
      // If there's an error, we'll start with an empty array
    }
  }, []);
  
  // Save price records to localStorage whenever they change
  useEffect(() => {
    if (priceRecords.length > 0) {
      try {
        localStorage.setItem('priceRecords', JSON.stringify(priceRecords));
      } catch (error) {
        console.error('Error saving price records:', error);
        // If localStorage is full, we might need to trim older records
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          toast({
            title: "Storage limit reached",
            description: "Some older price data may be lost due to storage constraints",
            variant: "destructive",
          });
          
          // Remove oldest 20% of records
          const recordsToKeep = Math.floor(priceRecords.length * 0.8);
          const trimmedRecords = [...priceRecords]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, recordsToKeep);
          
          setPriceRecords(trimmedRecords);
        }
      }
    }
  }, [priceRecords, toast]);

  // Calculate current price difference for display
  const currentDifference = binancePrice && coinbasePrice
    ? calculatePriceDifference(binancePrice, coinbasePrice)
    : 0;
  
  // Determine directional difference (positive means Binance higher, negative means Coinbase higher)
  const directionalDifference = binancePrice && coinbasePrice
    ? calculateDirectionalDifference(binancePrice, coinbasePrice)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-4xl font-light tracking-tight">Ethereum Price Tracker</h1>
          <p className="text-sm text-muted-foreground">Tracking price differences between exchanges over time</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* WebSocket Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={websocketsEnabled}
              onCheckedChange={handleWebSocketToggle}
              id="websocket-mode"
            />
            <label
              htmlFor="websocket-mode"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {websocketsEnabled ? 'WebSockets Enabled' : 'Using Simulated Data'}
            </label>
          </div>
          
          {/* Connection Status Badges */}
          {websocketsEnabled && (
            <div className="flex space-x-2">
              <Badge variant={connectionStatus.binance ? "outline" : "secondary"} className="flex items-center gap-1">
                {connectionStatus.binance ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                Binance
              </Badge>
              <Badge variant={connectionStatus.coinbase ? "outline" : "secondary"} className="flex items-center gap-1">
                {connectionStatus.coinbase ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                Coinbase
              </Badge>
            </div>
          )}
          
          {/* Status Badge */}
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
            ) : (
              <Badge variant="outline" className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Tracking Active
              </Badge>
            )}
          </div>
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
      <Card className="p-6 glassmorphism transition-all duration-500">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center gap-2">
            {directionalDifference > 0 ? (
              <ArrowUp className="h-5 w-5 text-green-500" />
            ) : (
              <ArrowDown className="h-5 w-5 text-red-500" />
            )}
            <h3 className="text-lg font-medium">Current Price Difference</h3>
          </div>
          
          <span className="text-3xl font-light">
            {directionalDifference >= 0 ? '+' : '-'}${Math.abs(directionalDifference).toFixed(2)}
          </span>
          
          <span className="text-sm text-muted-foreground">
            {directionalDifference > 0 
              ? 'Binance price is higher than Coinbase' 
              : 'Coinbase price is higher than Binance'}
          </span>
          
          <div className="text-xs text-muted-foreground mt-2">
            <span>Data points collected: {priceRecords.length}</span>
            {lastRecordTimeRef.current && (
              <span> · Last record: {formatDateTime(lastRecordTimeRef.current)}</span>
            )}
          </div>
        </div>
      </Card>
      
      <Separator />
      
      {/* Price history chart */}
      <PriceHistory records={priceRecords} />
    </div>
  );
};

export default PriceTracker;
