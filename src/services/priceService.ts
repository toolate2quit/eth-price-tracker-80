import { PriceData } from '@/types';
import { toast } from '@/hooks/use-toast';

// WebSocket connections
let binanceSocket: WebSocket | null = null;
let coinbaseSocket: WebSocket | null = null;

// Latest price data
let latestBinancePrice: number | null = null;
let latestCoinbasePrice: number | null = null;

// Connection status
const connectionStatus = {
  binance: false,
  coinbase: false
};

// Reconnection attempts tracking
let binanceReconnectAttempts = 0;
let coinbaseReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 3000; // 3 seconds initial delay
const MAX_RECONNECT_DELAY_MS = 30000; // 30 seconds max delay

// Helper for exponential backoff
const getReconnectDelay = (attempts: number): number => {
  const delay = Math.min(
    RECONNECT_DELAY_MS * Math.pow(1.5, attempts),
    MAX_RECONNECT_DELAY_MS
  );
  return delay;
};

// Initialize Binance WebSocket with better error handling
const initBinanceWebSocket = (): void => {
  try {
    if (binanceSocket) {
      binanceSocket.close();
    }
    
    binanceSocket = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@ticker');
    
    binanceSocket.onopen = () => {
      console.log('Binance WebSocket connected');
      connectionStatus.binance = true;
      binanceReconnectAttempts = 0; // Reset reconnect attempts on successful connection
      
      // Heartbeat to keep connection alive (every 30 seconds)
      const heartbeat = setInterval(() => {
        if (binanceSocket && binanceSocket.readyState === WebSocket.OPEN) {
          binanceSocket.send(JSON.stringify({ method: 'ping' }));
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);
    };
    
    binanceSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle pong response or ticker data
        if (data.c) { // If it contains the 'c' field, it's ticker data
          latestBinancePrice = parseFloat(data.c); // Current price is in the 'c' field
        }
      } catch (error) {
        console.error('Error parsing Binance data:', error);
      }
    };
    
    binanceSocket.onerror = (error) => {
      console.error('Binance WebSocket error:', error);
      connectionStatus.binance = false;
    };
    
    binanceSocket.onclose = () => {
      console.log('Binance WebSocket disconnected');
      connectionStatus.binance = false;
      
      // Attempt to reconnect with exponential backoff
      if (binanceReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = getReconnectDelay(binanceReconnectAttempts);
        binanceReconnectAttempts++;
        
        console.log(`Attempting to reconnect to Binance in ${delay/1000} seconds... (Attempt ${binanceReconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        
        setTimeout(() => {
          if (!connectionStatus.binance) {
            initBinanceWebSocket();
          }
        }, delay);
      } else {
        console.log('Max reconnection attempts reached for Binance. Falling back to simulated data.');
        toast({
          title: "Binance Connection Failed",
          description: "Unable to connect to Binance WebSocket. Using simulated data instead.",
          variant: "destructive",
        });
      }
    };
  } catch (error) {
    console.error('Error initializing Binance WebSocket:', error);
    connectionStatus.binance = false;
  }
};

// Initialize Coinbase WebSocket with better error handling
const initCoinbaseWebSocket = (): void => {
  try {
    if (coinbaseSocket) {
      coinbaseSocket.close();
    }
    
    coinbaseSocket = new WebSocket('wss://ws-feed.pro.coinbase.com'); // Updated to use the correct endpoint
    
    coinbaseSocket.onopen = () => {
      console.log('Coinbase WebSocket connected');
      connectionStatus.coinbase = true;
      coinbaseReconnectAttempts = 0; // Reset reconnect attempts on successful connection
      
      // Subscribe to ETH-USD ticker
      const subscribeMsg = {
        type: 'subscribe',
        product_ids: ['ETH-USD'],
        channels: ['ticker']
      };
      
      coinbaseSocket.send(JSON.stringify(subscribeMsg));
      
      // Heartbeat to keep connection alive (every 30 seconds)
      const heartbeat = setInterval(() => {
        if (coinbaseSocket && coinbaseSocket.readyState === WebSocket.OPEN) {
          coinbaseSocket.send(JSON.stringify({ type: 'ping' }));
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);
    };
    
    coinbaseSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        if (data.type === 'ticker' && data.product_id === 'ETH-USD') {
          latestCoinbasePrice = parseFloat(data.price);
        } else if (data.type === 'pong') {
          // Heartbeat response, connection is still alive
          console.log('Received heartbeat from Coinbase');
        }
      } catch (error) {
        console.error('Error parsing Coinbase data:', error);
      }
    };
    
    coinbaseSocket.onerror = (error) => {
      console.error('Coinbase WebSocket error:', error);
      connectionStatus.coinbase = false;
    };
    
    coinbaseSocket.onclose = () => {
      console.log('Coinbase WebSocket disconnected');
      connectionStatus.coinbase = false;
      
      // Attempt to reconnect with exponential backoff
      if (coinbaseReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = getReconnectDelay(coinbaseReconnectAttempts);
        coinbaseReconnectAttempts++;
        
        console.log(`Attempting to reconnect to Coinbase in ${delay/1000} seconds... (Attempt ${coinbaseReconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        
        setTimeout(() => {
          if (!connectionStatus.coinbase) {
            initCoinbaseWebSocket();
          }
        }, delay);
      } else {
        console.log('Max reconnection attempts reached for Coinbase. Falling back to simulated data.');
        toast({
          title: "Coinbase Connection Failed",
          description: "Unable to connect to Coinbase WebSocket. Using simulated data instead.",
          variant: "destructive",
        });
      }
    };
  } catch (error) {
    console.error('Error initializing Coinbase WebSocket:', error);
    connectionStatus.coinbase = false;
  }
};

// Initialize WebSocket connections
export const initializeWebSockets = (): { binance: boolean; coinbase: boolean } => {
  try {
    // Reset reconnection attempts
    binanceReconnectAttempts = 0;
    coinbaseReconnectAttempts = 0;
    
    // Initialize WebSockets
    initBinanceWebSocket();
    initCoinbaseWebSocket();
    
    return { ...connectionStatus };
  } catch (error) {
    console.error('Error initializing WebSockets:', error);
    return { ...connectionStatus };
  }
};

// Close WebSocket connections
export const closeWebSockets = (): void => {
  if (binanceSocket) {
    binanceSocket.close();
    binanceSocket = null;
  }
  if (coinbaseSocket) {
    coinbaseSocket.close();
    coinbaseSocket = null;
  }
  
  connectionStatus.binance = false;
  connectionStatus.coinbase = false;
};

// Get latest price from the WebSocket connections
export const fetchPrice = async (exchange: string): Promise<PriceData> => {
  // If WebSocket is not connected or no price is available yet, fall back to simulated data
  if ((exchange === 'binance' && (!connectionStatus.binance || latestBinancePrice === null)) ||
      (exchange === 'coinbase' && (!connectionStatus.coinbase || latestCoinbasePrice === null))) {
    return fallbackFetchPrice(exchange);
  }
  
  return {
    exchange,
    price: exchange === 'binance' ? latestBinancePrice! : latestCoinbasePrice!,
    lastUpdated: new Date()
  };
};

// Fallback to simulated data when WebSockets are not available
const fallbackFetchPrice = async (exchange: string): Promise<PriceData> => {
  console.log(`Using fallback data for ${exchange}`);
  
  // Simulate API call latency (100-300ms)
  const latency = Math.random() * 200 + 100;
  await new Promise(resolve => setTimeout(resolve, latency));
  
  // Base price centered around $2000 (current ETH price)
  const basePrice = 2000;
  
  // Random price variation between exchanges (up to $30)
  let price = basePrice;
  
  // Add small random fluctuation (up to $10)
  price += (Math.random() * 20 - 10);
  
  return {
    exchange,
    price,
    lastUpdated: new Date()
  };
};

// Get WebSocket connection status
export const getConnectionStatus = (): { binance: boolean; coinbase: boolean } => {
  return { ...connectionStatus };
};

// Reset connection states and attempt to reconnect
export const resetConnections = (): void => {
  // Reset reconnect attempts
  binanceReconnectAttempts = 0;
  coinbaseReconnectAttempts = 0;
  
  // Close existing connections if any
  closeWebSockets();
  
  // Initialize new connections
  initializeWebSockets();
  
  toast({
    title: "WebSocket Connections Reset",
    description: "Attempting to establish new connections to exchanges...",
  });
};

// Simulate order execution
export const simulateOrderExecution = async (
  exchange: string,
  price: number,
  action: 'buy' | 'sell'
): Promise<{ success: boolean; executionPrice: number }> => {
  // Simulate network delay (300-800ms)
  const latency = Math.random() * 500 + 300;
  await new Promise(resolve => setTimeout(resolve, latency));
  
  // Simulate minor slippage (0.1% - 0.5%)
  const slippagePercent = Math.random() * 0.4 + 0.1;
  const slippage = price * (slippagePercent / 100);
  
  // Buy orders typically execute slightly higher, sell orders slightly lower
  const executionPrice = action === 'buy' 
    ? price + slippage 
    : price - slippage;
  
  // 99% success rate for orders
  const success = Math.random() > 0.01;
  
  return {
    success,
    executionPrice: Math.round(executionPrice * 100) / 100
  };
};

export const exportEvents = async (data: any): Promise<boolean> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('Exporting data:', data);
  return true;
};
