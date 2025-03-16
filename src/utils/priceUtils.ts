
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
 * Determines if the price difference is significant enough to track
 * Now using a 6 dollar threshold instead of the previous 2 dollar threshold
 */
export const isDifferenceSignificant = (dataA: PriceData, dataB: PriceData): boolean => {
  const difference = calculatePriceDifference(dataA, dataB);
  return difference >= 6; // Changed from 2 to 6 dollars
};

/**
 * Formats a date for display
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleString();
};
