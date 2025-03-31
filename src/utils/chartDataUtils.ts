import { PriceDifferenceRecord } from '@/types';

export const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getFormattedData = (records: PriceDifferenceRecord[], timeRange: string, chartType: string) => {
  if (!records || records.length === 0) {
    console.log('No price records available');
    return [];
  }

  console.log(`Formatting ${records.length} records for ${chartType} chart with ${timeRange} time range`);
  
  // Filter records based on time range
  const filteredRecords = filterRecordsByTimeRange(records, timeRange);
  console.log(`After time filtering: ${filteredRecords.length} records`);
  
  // Format data based on chart type
  switch (chartType) {
    case 'spread':
      return formatSpreadData(filteredRecords);
    case 'exchangeSpread':
      return formatExchangeSpreadData(filteredRecords);
    case 'sideBySide':
    case 'prices':
      return formatPriceData(filteredRecords);
    default:
      return formatSpreadData(filteredRecords);
  }
};

const filterRecordsByTimeRange = (records: PriceDifferenceRecord[], timeRange: string): PriceDifferenceRecord[] => {
  const now = new Date();
  let cutoffTime: Date;
  
  switch (timeRange) {
    case 'hour':
      cutoffTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      break;
    case 'day':
      cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      break;
    case 'week':
      cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week ago
      break;
    case 'month':
      cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      break;
    case 'all':
    default:
      // Return all records
      return [...records];
  }
  
  return records.filter(record => new Date(record.timestamp) >= cutoffTime);
};

const formatSpreadData = (records: PriceDifferenceRecord[]) => {
  return records.map(record => {
    // Ensure each record always has both values set, even if they're zero
    return {
      time: formatTime(record.timestamp),
      maxBinanceSpread: record.difference > 0 ? Math.abs(record.difference) : 0,
      maxCoinbaseSpread: record.difference < 0 ? Math.abs(record.difference) : 0
    };
  });
};

const formatExchangeSpreadData = (records: PriceDifferenceRecord[]) => {
  return records.map(record => ({
    time: formatTime(record.timestamp),
    binanceHigher: record.difference > 0 ? record.difference : 0,
    coinbaseHigher: record.difference < 0 ? Math.abs(record.difference) : 0
  }));
};

const formatPriceData = (records: PriceDifferenceRecord[]) => {
  return records.map(record => ({
    time: formatTime(record.timestamp),
    binancePrice: record.binancePrice,
    coinbasePrice: record.coinbasePrice
  }));
};

export const getMaxSpread = (chartData: any[]) => {
  if (!chartData.length) return 100;
  const maxBinance = Math.max(...chartData.map(d => d.maxBinanceSpread || d.binanceHigher || 0));
  const maxCoinbase = Math.max(...chartData.map(d => d.maxCoinbaseSpread || d.coinbaseHigher || 0));
  return Math.max(maxBinance, maxCoinbase, 5) * 1.2; // Add 20% margin for better visualization
};

export const formatYAxisTick = (value: number) => `$${value.toFixed(0)}`;

// These functions are not used with our static data but need to be kept for reference 
// or in case we switch back to dynamic data later
export const getMaxPrice = (chartData: any[]) => {
  if (!chartData.length) return 2100;
  
  const maxBinance = Math.max(...chartData.map(d => d.binancePrice));
  const maxCoinbase = Math.max(...chartData.map(d => d.coinbasePrice));
  const max = Math.max(maxBinance, maxCoinbase);
  
  return Math.ceil(max * 1.02); // Add 2% padding
};

export const getMinPrice = (chartData: any[], chartType: string) => {
  if (!chartData.length) return 1900;
  
  const minBinance = Math.min(...chartData.map(d => d.binancePrice));
  const minCoinbase = Math.min(...chartData.map(d => d.coinbasePrice));
  const min = Math.min(minBinance, minCoinbase);
  
  // Subtract 2% padding or set to 0 if showing absolute difference
  return chartType === 'sideBySide' ? Math.floor(min * 0.98) : 0;
};
