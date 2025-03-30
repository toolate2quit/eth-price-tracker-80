
import { PriceDifferenceRecord } from '@/types';

export const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getFormattedData = (records: PriceDifferenceRecord[], timeRange: string, chartType: string) => {
  const now = new Date();
  const result = [
    { time: formatTime(now), maxBinanceSpread: 10, maxCoinbaseSpread: 5 },
    { time: formatTime(new Date(now.getTime() + 5 * 60 * 1000)), maxBinanceSpread: 15, maxCoinbaseSpread: 8 },
    { time: formatTime(new Date(now.getTime() + 10 * 60 * 1000)), maxBinanceSpread: 7, maxCoinbaseSpread: 12 },
  ];

  console.log('Forced chart data:', result);
  return result;
};

export const getMaxSpread = (chartData: any[]) => {
  if (!chartData.length) return 100;
  const maxBinance = Math.max(...chartData.map(d => d.maxBinanceSpread || 0));
  const maxCoinbase = Math.max(...chartData.map(d => d.maxCoinbaseSpread || 0));
  return Math.max(maxBinance, maxCoinbase, 5) * 1.2;
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
