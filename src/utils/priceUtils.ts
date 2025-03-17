
import { PriceData } from '@/types';

/**
 * Generates a unique identifier
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Calculates the absolute price difference between two exchanges
 */
export const calculatePriceDifference = (dataA: PriceData, dataB: PriceData): number => {
  return Math.abs(dataA.price - dataB.price);
};

/**
 * Calculates the directional price difference (A - B)
 */
export const calculateDirectionalDifference = (dataA: PriceData, dataB: PriceData): number => {
  return dataA.price - dataB.price;
};

/**
 * Determines if the price difference is significant enough to track
 * Specifically checks if Binance price is $12 higher than Coinbase
 */
export const isBinanceHigherThanCoinbase = (binanceData: PriceData, coinbaseData: PriceData): boolean => {
  const difference = calculateDirectionalDifference(binanceData, coinbaseData);
  return difference >= 12; // Binance is $12 or more higher than Coinbase
};

/**
 * Determines if the price difference is significant enough to end tracking
 * Specifically checks if Coinbase price is $12 higher than Binance
 */
export const isCoinbaseHigherThanBinance = (binanceData: PriceData, coinbaseData: PriceData): boolean => {
  const difference = calculateDirectionalDifference(coinbaseData, binanceData);
  return difference >= 12; // Coinbase is $12 or more higher than Binance
};

/**
 * Formats a date for display
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleString();
};

/**
 * Format price with currency symbol
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

/**
 * Format timestamp
 */
export const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};

/**
 * Format full date and time
 */
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};

/**
 * Calculate duration between two timestamps
 */
export const calculateDuration = (start: Date, end: Date): string => {
  const durationMs = end.getTime() - start.getTime();
  const seconds = Math.floor(durationMs / 1000) % 60;
  const minutes = Math.floor(durationMs / (1000 * 60)) % 60;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};
