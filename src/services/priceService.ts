import { PriceData } from '@/types';

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

// Initialize WebSocket connections
export const initializeWebSockets = (): { binance: boolean; coinbase: boolean } => {
  try {
    // Close existing connections if any
    if (binanceSocket) {
      binanceSocket.close();
    }
    if (coinbaseSocket) {
      coinbaseSocket.close();
    }
    
    // Initialize Binance WebSocket
    binanceSocket = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@ticker');
    
    binanceSocket.onopen = () => {
      console.log('Binance WebSocket connected');
      connectionStatus.binance = true;
    };
    
    binanceSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        latestBinancePrice = parseFloat(data.c); // Current price is in the 'c' field
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
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (!connectionStatus.binance) {
          console.log('Attempting to reconnect to Binance...');
          initializeWebSockets();
        }
      }, 5000);
    };
    
    // Initialize Coinbase WebSocket
    coinbaseSocket = new WebSocket('wss://ws-feed.exchange.coinbase.com');
    
    coinbaseSocket.onopen = () => {
      console.log('Coinbase WebSocket connected');
      connectionStatus.coinbase = true;
      
      // Subscribe to ETH-USD ticker
      const subscribeMsg = {
        type: 'subscribe',
        product_ids: ['ETH-USD'],
        channels: ['ticker']
      };
      
      coinbaseSocket.send(JSON.stringify(subscribeMsg));
    };
    
    coinbaseSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ticker' && data.product_id === 'ETH-USD') {
          latestCoinbasePrice = parseFloat(data.price);
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
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (!connectionStatus.coinbase) {
          console.log('Attempting to reconnect to Coinbase...');
          initializeWebSockets();
        }
      }, 5000);
    };
    
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
