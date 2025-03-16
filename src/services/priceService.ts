
import { PriceData } from '@/types';

// Simulate API calls to exchanges (in a real app, these would connect to actual APIs)
export const fetchPrice = async (exchange: string): Promise<PriceData> => {
  // In a real implementation, this would use the actual exchange APIs
  // For demo purposes, we're simulating prices with small random variations
  
  try {
    // Base price with slight randomization to simulate market movement
    const basePrice = 3500 + Math.random() * 20;
    
    // Add exchange-specific variation to simulate price differences
    let price = basePrice;
    
    if (exchange === 'binance') {
      price += Math.random() * 5 - 2.5; // +/- $2.50 variation
    } else if (exchange === 'coinbase') {
      price += Math.random() * 5 - 2.5; // +/- $2.50 variation
    }
    
    // Once every 10 calls (approximately), create a larger price difference for demo purposes
    if (Math.random() > 0.9) {
      if (exchange === 'binance') {
        price += 3; // Add $3 to create a noticeable difference
      } else if (exchange === 'coinbase') {
        price -= 3; // Subtract $3 to create a noticeable difference
      }
    }
    
    // Format to 2 decimal places
    price = Math.round(price * 100) / 100;
    
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

export const exportEvents = async (data: any): Promise<boolean> => {
  // In a real implementation, this would send data to another service
  // For demo purposes, we're just logging it to the console
  console.log('Exporting data:', data);
  
  // Simulate network request delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return true;
};
