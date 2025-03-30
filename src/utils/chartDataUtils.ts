
import { PriceDifferenceRecord } from '@/types';

export const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getFormattedData = (records: PriceDifferenceRecord[], timeRange: string) => {
  if (!records.length) return [];

  // Filter data based on time range
  const now = new Date();
  let filteredRecords = [...records];

  if (timeRange === 'day') {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    filteredRecords = records.filter(record => new Date(record.timestamp) >= oneDayAgo);
  } else if (timeRange === 'week') {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filteredRecords = records.filter(record => new Date(record.timestamp) >= oneWeekAgo);
  } else if (timeRange === 'month') {
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filteredRecords = records.filter(record => new Date(record.timestamp) >= oneMonthAgo);
  }

  // Sort by timestamp (ensure timestamp is a Date object)
  filteredRecords.sort((a, b) => {
    const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
    return aTime - bTime;
  });

  // Group by 5-minute intervals
  const groupedData = new Map();
  
  filteredRecords.forEach(record => {
    // Ensure timestamp is a Date object
    const timestamp = record.timestamp instanceof Date ? record.timestamp : new Date(record.timestamp);
    
    // Round to the nearest 5-minute interval
    const minutes = timestamp.getMinutes();
    const roundedMinutes = Math.floor(minutes / 5) * 5;
    
    const roundedTimestamp = new Date(timestamp);
    roundedTimestamp.setMinutes(roundedMinutes);
    roundedTimestamp.setSeconds(0);
    roundedTimestamp.setMilliseconds(0);
    
    const timeKey = roundedTimestamp.getTime();
    
    // Calculate the price difference
    const diff = record.binancePrice - record.coinbasePrice;
    
    if (!groupedData.has(timeKey)) {
      // For the first record in this time interval, create a new entry
      groupedData.set(timeKey, {
        timestamp: roundedTimestamp,
        time: formatTime(roundedTimestamp),
        binancePrice: record.binancePrice,
        coinbasePrice: record.coinbasePrice,
        difference: diff,
        absoluteDifference: Math.abs(diff),
        spread: Math.abs(diff),
        binanceHigher: diff > 0 ? Math.abs(diff) : 0,
        coinbaseHigher: diff < 0 ? Math.abs(diff) : 0,
        count: 1
      });
    } else {
      // For subsequent records in the same time interval, update the entry
      const existing = groupedData.get(timeKey);
      
      // Update prices
      existing.binancePrice = record.binancePrice;
      existing.coinbasePrice = record.coinbasePrice;
      
      // Recalculate the difference metrics
      const diff = record.binancePrice - record.coinbasePrice;
      existing.difference = diff;
      existing.absoluteDifference = Math.abs(diff);
      existing.spread = Math.abs(diff);
      
      // Update the exchange-specific difference values
      existing.binanceHigher = diff > 0 ? Math.abs(diff) : 0;
      existing.coinbaseHigher = diff < 0 ? Math.abs(diff) : 0;
      
      existing.count += 1;
    }
  });

  // Convert Map to array
  const result = Array.from(groupedData.values());
  
  // Debug the data
  console.log('Processed chart data:', result);
  
  // Make sure all data points have the necessary properties
  result.forEach(item => {
    // Ensure both properties exist for every data point 
    if (item.binanceHigher === undefined) item.binanceHigher = 0;
    if (item.coinbaseHigher === undefined) item.coinbaseHigher = 0;
    if (item.binancePrice === undefined) console.error('Missing binancePrice in data point:', item);
    if (item.coinbasePrice === undefined) console.error('Missing coinbasePrice in data point:', item);
    
    // Round values to avoid floating point weirdness
    item.binancePrice = parseFloat(item.binancePrice.toFixed(2));
    item.coinbasePrice = parseFloat(item.coinbasePrice.toFixed(2));
    item.binanceHigher = parseFloat(item.binanceHigher.toFixed(2));
    item.coinbaseHigher = parseFloat(item.coinbaseHigher.toFixed(2));
    item.spread = parseFloat(item.spread.toFixed(2));
  });
  
  // Add dummy data if we have no actual data to visualize
  if (result.length === 0) {
    createDummyData(result);
  }
  
  return result;
};

// Function to create dummy/test data with both exchanges being higher at different times
const createDummyData = (result: any[]) => {
  const now = new Date();
  
  // First data point - Coinbase higher
  result.push({
    timestamp: now,
    time: formatTime(now),
    binancePrice: 2000,
    coinbasePrice: 2010,
    difference: -10,
    absoluteDifference: 10,
    spread: 10,
    binanceHigher: 0,
    coinbaseHigher: 10,
    count: 1
  });
  
  // Second data point - 5 min later - Binance higher
  const fiveMinLater = new Date(now.getTime() + 5 * 60 * 1000);
  result.push({
    timestamp: fiveMinLater,
    time: formatTime(fiveMinLater),
    binancePrice: 2020,
    coinbasePrice: 2005,
    difference: 15,
    absoluteDifference: 15,
    spread: 15,
    binanceHigher: 15,
    coinbaseHigher: 0,
    count: 1
  });
  
  // Third data point - 10 min later - Binance higher
  const tenMinLater = new Date(now.getTime() + 10 * 60 * 1000);
  result.push({
    timestamp: tenMinLater,
    time: formatTime(tenMinLater),
    binancePrice: 2025,
    coinbasePrice: 2015,
    difference: 10,
    absoluteDifference: 10,
    spread: 10,
    binanceHigher: 10,
    coinbaseHigher: 0,
    count: 1
  });
  
  // Fourth data point - 15 min later - Coinbase higher
  const fifteenMinLater = new Date(now.getTime() + 15 * 60 * 1000);
  result.push({
    timestamp: fifteenMinLater,
    time: formatTime(fifteenMinLater),
    binancePrice: 2010,
    coinbasePrice: 2030,
    difference: -20,
    absoluteDifference: 20,
    spread: 20,
    binanceHigher: 0,
    coinbaseHigher: 20,
    count: 1
  });
};

// Get maximum price for the Y-axis
export const getMaxPrice = (chartData: any[]) => {
  if (!chartData.length) return 2100;
  
  const maxBinance = Math.max(...chartData.map(d => d.binancePrice));
  const maxCoinbase = Math.max(...chartData.map(d => d.coinbasePrice));
  const max = Math.max(maxBinance, maxCoinbase);
  
  return Math.ceil(max * 1.02); // Add 2% padding
};

// Get minimum price for the Y-axis
export const getMinPrice = (chartData: any[], chartType: string) => {
  if (!chartData.length) return 1900;
  
  const minBinance = Math.min(...chartData.map(d => d.binancePrice));
  const minCoinbase = Math.min(...chartData.map(d => d.coinbasePrice));
  const min = Math.min(minBinance, minCoinbase);
  
  // Subtract 2% padding or set to 0 if showing absolute difference
  return chartType === 'sideBySide' ? Math.floor(min * 0.98) : 0;
};

// Get max spread for the Y-axis
export const getMaxSpread = (chartData: any[]) => {
  if (!chartData.length) return 100;
  
  const maxBinanceHigher = Math.max(...chartData.map(d => d.binanceHigher || 0));
  const maxCoinbaseHigher = Math.max(...chartData.map(d => d.coinbaseHigher || 0));
  const max = Math.max(maxBinanceHigher, maxCoinbaseHigher);
  
  // If both values are 0 or very small, return a default value for better visualization
  return max < 5 ? 10 : Math.ceil(max * 1.2); // Add 20% padding
};

// Format the Y-axis tick values
export const formatYAxisTick = (value: number) => {
  return `$${value.toFixed(0)}`;
};
