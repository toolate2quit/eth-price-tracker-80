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

// Start with simulated data by default
let forceSimulatedData = true;

// Record why we're using simulated data for user feedback
let simulatedDataReason = "WebSockets are disabled";

// Helper for exponential backoff
const getReconnectDelay = (attempts: number): number => {
  const delay = Math.min(
    RECONNECT_DELAY_MS * Math.pow(1.5, attempts),
    MAX_RECONNECT_DELAY_MS
  );
  return delay;
};

// Initialize Binance WebSocket with improved error handling
const initBinanceWebSocket = (): void => {
  try {
    if (binanceSocket) {
      binanceSocket.close();
    }
    
    // If simulated data is forced, don't attempt connection
    if (forceSimulatedData) {
      console.log('Simulated data mode is enabled. Not connecting to Binance WebSocket.');
      connectionStatus.binance = false;
      return;
    }
    
    simulatedDataReason = "Connecting to exchanges...";
    
    // Using wss:// to address security issues
    console.log('Attempting to connect to Binance WebSocket...');
    binanceSocket = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@ticker');
    
    binanceSocket.onopen = () => {
      console.log('Binance WebSocket connected');
      connectionStatus.binance = true;
      binanceReconnectAttempts = 0; // Reset reconnect attempts on successful connection
      
      toast({
        title: "Binance Connected",
        description: "Successfully connected to Binance WebSocket stream.",
      });
      
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
          console.log('Received real price from Binance:', latestBinancePrice);
        }
      } catch (error) {
        console.error('Error parsing Binance data:', error);
      }
    };
    
    binanceSocket.onerror = (error) => {
      console.error('Binance WebSocket error:', error);
      connectionStatus.binance = false;
      simulatedDataReason = "Connection error with Binance";
      
      // Try an alternative connection if this is the first error
      if (binanceReconnectAttempts === 0) {
        console.log('Trying alternative Binance connection...');
        binanceSocket?.close(); // Close the existing connection
        binanceSocket = new WebSocket('wss://data-stream.binance.com/ws/ethusdt@ticker');
      }
    };
    
    binanceSocket.onclose = () => {
      console.log('Binance WebSocket disconnected');
      connectionStatus.binance = false;
      
      // Attempt to reconnect with exponential backoff
      if (binanceReconnectAttempts < MAX_RECONNECT_ATTEMPTS && !forceSimulatedData) {
        const delay = getReconnectDelay(binanceReconnectAttempts);
        binanceReconnectAttempts++;
        
        simulatedDataReason = `Reconnecting to Binance (Attempt ${binanceReconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`;
        console.log(`Attempting to reconnect to Binance in ${delay/1000} seconds... (Attempt ${binanceReconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        
        setTimeout(() => {
          if (!connectionStatus.binance && !forceSimulatedData) {
            initBinanceWebSocket();
          }
        }, delay);
      } else {
        simulatedDataReason = "Max reconnection attempts reached for Binance";
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
    simulatedDataReason = "Error initializing Binance connection";
  }
};

// Initialize Coinbase WebSocket with improved error handling
const initCoinbaseWebSocket = (): void => {
  try {
    if (coinbaseSocket) {
      coinbaseSocket.close();
    }
    
    // If simulated data is forced, don't attempt connection
    if (forceSimulatedData) {
      console.log('Simulated data mode is enabled. Not connecting to Coinbase WebSocket.');
      connectionStatus.coinbase = false;
      return;
    }
    
    // Updated Coinbase WebSocket URL using wss:// protocol
    console.log('Attempting to connect to Coinbase WebSocket...');
    coinbaseSocket = new WebSocket('wss://ws-feed.exchange.coinbase.com');
    
    coinbaseSocket.onopen = () => {
      console.log('Coinbase WebSocket connected');
      connectionStatus.coinbase = true;
      coinbaseReconnectAttempts = 0; // Reset reconnect attempts on successful connection
      
      toast({
        title: "Coinbase Connected",
        description: "Successfully connected to Coinbase WebSocket stream.",
      });
      
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
          console.log('Received real price from Coinbase:', latestCoinbasePrice);
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
      simulatedDataReason = "Connection error with Coinbase";
      
      // Try an alternative connection if this is the first error
      if (coinbaseReconnectAttempts === 0) {
        console.log('Trying alternative Coinbase connection...');
        coinbaseSocket?.close(); // Close the existing connection
        coinbaseSocket = new WebSocket('wss://advanced-trade-ws.coinbase.com');
      }
    };
    
    coinbaseSocket.onclose = () => {
      console.log('Coinbase WebSocket disconnected');
      connectionStatus.coinbase = false;
      
      // Attempt to reconnect with exponential backoff
      if (coinbaseReconnectAttempts < MAX_RECONNECT_ATTEMPTS && !forceSimulatedData) {
        const delay = getReconnectDelay(coinbaseReconnectAttempts);
        coinbaseReconnectAttempts++;
        
        simulatedDataReason = `Reconnecting to Coinbase (Attempt ${coinbaseReconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`;
        console.log(`Attempting to reconnect to Coinbase in ${delay/1000} seconds... (Attempt ${coinbaseReconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        
        setTimeout(() => {
          if (!connectionStatus.coinbase && !forceSimulatedData) {
            initCoinbaseWebSocket();
          }
        }, delay);
      } else {
        simulatedDataReason = "Max reconnection attempts reached for Coinbase";
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
    simulatedDataReason = "Error initializing Coinbase connection";
  }
};

// Initialize WebSocket connections
export const initializeWebSockets = (): { binance: boolean; coinbase: boolean } => {
  try {
    // Don't try to initialize if simulated data is forced
    if (forceSimulatedData) {
      console.log('Simulated data mode is enabled. Not initializing WebSockets.');
      connectionStatus.binance = false;
      connectionStatus.coinbase = false;
      return { ...connectionStatus };
    }
    
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
  
  console.log('WebSocket connections closed');
};

// Get latest price from the WebSocket connections
export const fetchPrice = async (exchange: string): Promise<PriceData> => {
  // If forced simulated data or WebSocket is not connected or no price is available yet, use simulated data
  if (forceSimulatedData || 
      (exchange === 'binance' && (!connectionStatus.binance || latestBinancePrice === null)) ||
      (exchange === 'coinbase' && (!connectionStatus.coinbase || latestCoinbasePrice === null))) {
    return fallbackFetchPrice(exchange);
  }
  
  console.log(`Using real data for ${exchange}`);
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

// Get the reason for using simulated data
export const getSimulatedDataReason = (): string => {
  return simulatedDataReason;
};

// Reset connection states and attempt to reconnect
export const resetConnections = (): void => {
  // If simulated data is forced, don't attempt to reconnect
  if (forceSimulatedData) {
    console.log('Simulated data mode is enabled. Not resetting connections.');
    toast({
      title: "Simulated Data Mode",
      description: "Cannot reset connections while in simulated data mode.",
    });
    return;
  }
  
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

// Toggle between real and simulated data
export const toggleSimulatedData = (useSimulated: boolean): void => {
  console.log(`Setting simulated data mode to: ${useSimulated}`);
  
  // Only take action if the state is actually changing
  if (forceSimulatedData !== useSimulated) {
    forceSimulatedData = useSimulated;
    
    if (useSimulated) {
      simulatedDataReason = "Simulated data mode enabled by user";
      // Close any existing connections
      closeWebSockets();
      toast({
        title: "Simulated Data Mode",
        description: "Now using simulated data for price information.",
      });
    } else {
      simulatedDataReason = "Attempting to connect to exchanges...";
      // Reset connection status
      latestBinancePrice = null;
      latestCoinbasePrice = null;
      toast({
        title: "Real Data Mode",
        description: "Attempting to connect to exchange WebSockets for real-time data.",
      });
    }
  }
};

// Check if simulated data is being used
export const isUsingSimulatedData = (): boolean => {
  return forceSimulatedData || (!connectionStatus.binance && !connectionStatus.coinbase);
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
