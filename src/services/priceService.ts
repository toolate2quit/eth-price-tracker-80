
import { PriceData } from '@/types';

// Simple simulation of fetching price data from exchanges
export const fetchPrice = async (exchange: string): Promise<PriceData> => {
  // Simulate API call latency (100-500ms)
  const latency = Math.random() * 400 + 100;
  await new Promise(resolve => setTimeout(resolve, latency));
  
  // Base price centered around $2000 (current ETH price)
  const basePrice = 2000;
  
  // Random price variation between exchanges (up to $30)
  let price = basePrice;
  
  // Add static bias per exchange for more consistent differences
  if (exchange === 'binance') {
    price += 15; // Binance consistently higher
  } else if (exchange === 'coinbase') {
    price -= 15; // Coinbase consistently lower
  }
  
  // Add small random fluctuation (up to $10)
  price += (Math.random() * 20 - 10);
  
  // Occasional larger random price spike (5% chance)
  if (Math.random() > 0.95) {
    console.log('Adding price spike for', exchange);
    const spikeAmount = Math.random() * 30 + 10; // $10-40 spike
    
    // Each exchange can spike in either direction
    if (Math.random() > 0.5) {
      price += spikeAmount;
    } else {
      price -= spikeAmount;
    }
  }
  
  return {
    exchange,
    price,
    lastUpdated: new Date()
  };
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
