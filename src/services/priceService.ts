import { PriceData } from '@/types';

// Simulate API calls to exchanges with more realistic price movements
export const fetchPrice = async (exchange: string): Promise<PriceData> => {
  // In a real implementation, this would use the actual exchange APIs
  
  try {
    // Static base price to reduce volatility (more realistic for short timeframes)
    const basePrice = 3500;
    
    // Global variables to remember the last price for each exchange
    if (!(window as any).lastPrices) {
      (window as any).lastPrices = {
        binance: basePrice,
        coinbase: basePrice
      };
    }
    
    // Get the last price for this exchange
    let lastPrice = (window as any).lastPrices[exchange];
    
    // Small random walk (realistic market microstructure)
    const volatility = 0.05; // 0.05% volatility per update
    const randomWalk = lastPrice * (volatility / 100) * (Math.random() * 2 - 1);
    
    // Calculate new price with smaller variations
    let price = lastPrice + randomWalk;
    
    // Add exchange-specific bias (exchanges often have slight persistent differences)
    if (exchange === 'binance') {
      price += 0.05; // Slight upward bias for Binance
    } else if (exchange === 'coinbase') {
      price -= 0.05; // Slight downward bias for Coinbase
    }
    
    // Occasionally create larger arbitrage opportunities (about 5% of the time)
    if (Math.random() > 0.95) {
      console.log('Creating arbitrage opportunity');
      if (exchange === 'binance') {
        price += Math.random() * 10 + 5; // $5-15 sudden movement
      } else if (exchange === 'coinbase') {
        price -= Math.random() * 10 + 5; // $5-15 sudden movement
      }
    }
    
    // Save this price for next time
    (window as any).lastPrices[exchange] = price;
    
    // Format to 2 decimal places for consistency
    price = parseFloat(price.toFixed(2));
    
    // Add simulated network latency (20-100ms)
    const latency = Math.random() * 80 + 20;
    await new Promise(resolve => setTimeout(resolve, latency));
    
    return {
      exchange,
      price,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error(`Error fetching price from ${exchange}:`, error);
    throw new Error(`Failed to fetch price from ${exchange}`);
  }
};

// Simulate order execution with added latency and slippage
export const simulateOrderExecution = async (
  exchange: string,
  price: number,
  action: 'buy' | 'sell'
): Promise<{ success: boolean; executionPrice: number; latency: number }> => {
  // Simulate network and execution latency (200-800ms)
  const latency = Math.random() * 600 + 200;
  await new Promise(resolve => setTimeout(resolve, latency));
  
  // Simulate slippage (0.05% to 0.2%)
  const slippagePercent = Math.random() * 0.15 + 0.05;
  const slippage = price * (slippagePercent / 100);
  
  // Price impact depends on action (buy typically moves price up, sell moves it down)
  const executionPrice = action === 'buy' 
    ? price + slippage 
    : price - slippage;
  
  // 98% success rate for orders
  const success = Math.random() > 0.02;
  
  return {
    success,
    executionPrice: Math.round(executionPrice * 100) / 100,
    latency
  };
};

export const exportEvents = async (data: any): Promise<boolean> => {
  // In a real implementation, this would send data to another service
  // For demo purposes, we're just logging it to the console
  console.log('Exporting data:', data);
  
  // Simulate network request delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return true;
};
