
export interface PriceData {
  exchange: string;
  price: number;
  lastUpdated: Date;
}

export interface PriceEvent {
  id: string;
  startTime: Date;
  endTime?: Date;
  exchangeA: string;
  exchangeB: string;
  initialDifference: number;
  maxDifference: number;
  maxDifferenceTime?: Date;
  status: 'active' | 'completed';
  forcedExit?: boolean;
}

export interface PriceDifferenceRecord {
  id: string;
  timestamp: Date;
  binancePrice: number;
  coinbasePrice: number;
  difference: number;
  absoluteDifference: number;
}

export interface ExportData {
  events: PriceEvent[];
  priceRecords: PriceDifferenceRecord[];
  exportTime: Date;
  source: string;
}
