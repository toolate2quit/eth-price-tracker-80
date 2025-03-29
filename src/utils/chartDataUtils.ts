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
    filteredRecords = records.filter(record => record.timestamp >= oneDayAgo);
  } else if (timeRange === 'week') {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filteredRecords = records.filter(record => record.timestamp >= oneWeekAgo);
  } else if (timeRange === 'month') {
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filteredRecords = records.filter(record => record.timestamp >= oneMonthAgo);
  }

  // Sort by timestamp
  filteredRecords.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Group by 5-minute intervals
  const groupedData = new Map();
  
  filteredRecords.forEach(record => {
    // Round to the nearest 5-minute interval
    const timestamp = record.timestamp;
    const minutes = timestamp.getMinutes();
    const roundedMinutes = Math.floor(minutes / 5) * 5;
    
    const roundedTimestamp = new Date(timestamp);
    roundedTimestamp.setMinutes(roundedMinutes);
    roundedTimestamp.setSeconds(0);
    roundedTimestamp.setMilliseconds(0);
    
    const timeKey = roundedTimestamp.getTime();
    
    if (!groupedData.has(timeKey)) {
      const diff = record.binancePrice - record.coinbasePrice;
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
      const existing = groupedData.get(timeKey);
      // Update the weighted average prices
      existing.binancePrice = (existing.binancePrice * existing.count + record.binancePrice) / (existing.count + 1);
      existing.coinbasePrice = (existing.coinbasePrice * existing.count + record.coinbasePrice) / (existing.count + 1);
      
      // Recalculate the difference and spread based on the current average prices
      const diff = existing.binancePrice - existing.coinbasePrice;
      existing.difference = diff;
      existing.absoluteDifference = Math.abs(diff);
      existing.spread = Math.abs(diff);
      
      // Ensure both binanceHigher and coinbaseHigher are properly calculated
      existing.binanceHigher = diff > 0 ? Math.abs(diff) : 0;
      existing.coinbaseHigher = diff < 0 ? Math.abs(diff) : 0;
      
      existing.count += 1;
    }
  });

  // Convert Map to array and ensure every item has both binanceHigher and coinbaseHigher defined
  const result = Array.from(groupedData.values());
  
  // Make sure all data points have the necessary properties
  result.forEach(item => {
    if (item.binanceHigher === undefined) item.binanceHigher = 0;
    if (item.coinbaseHigher === undefined) item.coinbaseHigher = 0;
  });
  
  return result;
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
  
  return Math.ceil(max * 1.2); // Add 20% padding
};

// Format the Y-axis tick values
export const formatYAxisTick = (value: number) => {
  return `$${value.toFixed(0)}`;
};
