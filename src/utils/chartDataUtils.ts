import { PriceDifferenceRecord } from '@/types';

export const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getFormattedData = (records: PriceDifferenceRecord[], timeRange: string, chartType?: string) => {
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

  // Sort by timestamp
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
    
    // Calculate spreads in both directions
    const binanceSpread = record.binancePrice - record.coinbasePrice; // Binance over Coinbase
    const coinbaseSpread = record.coinbasePrice - record.binancePrice; // Coinbase over Binance
    
    if (!groupedData.has(timeKey)) {
      // For the first record in this time interval, create a new entry
      groupedData.set(timeKey, {
        timestamp: roundedTimestamp,
        time: formatTime(roundedTimestamp),
        binancePrice: record.binancePrice,
        coinbasePrice: record.coinbasePrice,
        difference: binanceSpread,
        absoluteDifference: Math.abs(binanceSpread),
        spread: Math.abs(binanceSpread),
        maxBinanceSpread: binanceSpread > 0 ? binanceSpread : 0,
        maxCoinbaseSpread: coinbaseSpread > 0 ? coinbaseSpread : 0,
        count: 1
      });
    } else {
      // For subsequent records in the same time interval, update the entry
      const existing = groupedData.get(timeKey);
      
      // Update prices
      existing.binancePrice = record.binancePrice;
      existing.coinbasePrice = record.coinbasePrice;
      
      // Recalculate the difference metrics
      existing.difference = binanceSpread;
      existing.absoluteDifference = Math.abs(binanceSpread);
      existing.spread = Math.abs(binanceSpread);
      
      // Track maximum spreads in each direction
      existing.maxBinanceSpread = Math.max(existing.maxBinanceSpread, binanceSpread > 0 ? binanceSpread : 0);
      existing.maxCoinbaseSpread = Math.max(existing.maxCoinbaseSpread, coinbaseSpread > 0 ? coinbaseSpread : 0);
      
      existing.count += 1;
    }
  });

  // Convert Map to array
  const result = Array.from(groupedData.values());
  
  // Debug the data
  console.log('Processed chart data:', result);
  
  // Make sure all data points have the necessary properties
  result.forEach(item => {
    // Round values to avoid floating point weirdness
    if (item.binancePrice !== undefined) item.binancePrice = parseFloat(item.binancePrice.toFixed(2));
    if (item.coinbasePrice !== undefined) item.coinbasePrice = parseFloat(item.coinbasePrice.toFixed(2));
    item.maxBinanceSpread = parseFloat(item.maxBinanceSpread.toFixed(2));
    item.maxCoinbaseSpread = parseFloat(item.maxCoinbaseSpread.toFixed(2));
    if (item.spread !== undefined) item.spread = parseFloat(item.spread.toFixed(2));
  });
  
  // Force dummy data for testing if no data is available
  if (result.length === 0) {
    createDummyData(result);
    console.log('Created dummy data:', result);
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
    maxBinanceSpread: 0,
    maxCoinbaseSpread: 10,
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
    maxBinanceSpread: 15,
    maxCoinbaseSpread: 0,
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
    maxBinanceSpread: 10,
    maxCoinbaseSpread: 0,
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
    maxBinanceSpread: 0,
    maxCoinbaseSpread: 20,
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
  
  const maxBinanceSpread = Math.max(...chartData.map(d => d.maxBinanceSpread || 0));
  const maxCoinbaseSpread = Math.max(...chartData.map(d => d.maxCoinbaseSpread || 0));
  const max = Math.max(maxBinanceSpread, maxCoinbaseSpread);
  
  // If both values are 0 or very small, return a default value for better visualization
  return max < 5 ? 10 : Math.ceil(max * 1.2); // Add 20% padding
};

// Format the Y-axis tick values
export const formatYAxisTick = (value: number) => {
  return `$${value.toFixed(0)}`;
};
