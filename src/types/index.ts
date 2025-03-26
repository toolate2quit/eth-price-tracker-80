
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
  forcedExit?: boolean; // New property to track if the trade was forcibly exited
}

export interface ExportData {
  events: PriceEvent[];
  exportTime: Date;
  source: string;
}
