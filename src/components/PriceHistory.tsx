
import { useState, useMemo } from 'react';
import { PriceDifferenceRecord } from '@/types';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatDateTime, formatPrice } from '@/utils/priceUtils';
import { ArrowDown, ArrowUp, CalendarDays, ChartLine, Clock } from 'lucide-react';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Cell
} from 'recharts';

interface PriceHistoryProps {
  records: PriceDifferenceRecord[];
}

const PriceHistory: React.FC<PriceHistoryProps> = ({ records }) => {
  const [timeRange, setTimeRange] = useState<string>('day');
  const [chartType, setChartType] = useState<string>('difference');

  // Calculate max differences in each direction
  const { maxBinanceHigher, maxCoinbaseHigher } = useMemo(() => {
    if (!records.length) return { maxBinanceHigher: 0, maxCoinbaseHigher: 0 };
    
    let maxBinanceHigher = 0;
    let maxCoinbaseHigher = 0;
    
    records.forEach(record => {
      // Positive difference means Binance price is higher
      if (record.difference > 0 && record.difference > maxBinanceHigher) {
        maxBinanceHigher = record.difference;
      } 
      // Negative difference means Coinbase price is higher
      else if (record.difference < 0 && Math.abs(record.difference) > maxCoinbaseHigher) {
        maxCoinbaseHigher = Math.abs(record.difference);
      }
    });
    
    return { maxBinanceHigher, maxCoinbaseHigher };
  }, [records]);

  // Group data into 5-minute intervals
  const getFormattedData = () => {
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
        groupedData.set(timeKey, {
          timestamp: roundedTimestamp,
          time: formatTime(roundedTimestamp),
          binancePrice: record.binancePrice,
          coinbasePrice: record.coinbasePrice,
          difference: record.difference,
          absoluteDifference: record.absoluteDifference,
          count: 1
        });
      } else {
        const existing = groupedData.get(timeKey);
        existing.binancePrice = (existing.binancePrice * existing.count + record.binancePrice) / (existing.count + 1);
        existing.coinbasePrice = (existing.coinbasePrice * existing.count + record.coinbasePrice) / (existing.count + 1);
        
        // For difference, we want to keep the maximum difference in this interval
        if (Math.abs(record.difference) > Math.abs(existing.difference)) {
          existing.difference = record.difference;
        }
        
        if (record.absoluteDifference > existing.absoluteDifference) {
          existing.absoluteDifference = record.absoluteDifference;
        }
        
        existing.count += 1;
      }
    });

    // Convert Map to array
    return Array.from(groupedData.values());
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const chartData = getFormattedData();

  // Get maximum difference for the Y-axis
  const getMaxDifference = () => {
    if (!chartData.length) return 100;
    
    if (chartType === 'difference') {
      const max = Math.max(...chartData.map(d => Math.abs(d.difference)));
      return Math.ceil(max * 1.2); // Add 20% padding
    } else {
      const max = Math.max(...chartData.map(d => d.absoluteDifference));
      return Math.ceil(max * 1.2); // Add 20% padding
    }
  };

  // Get price range for Y-axis when showing prices
  const getPriceRange = () => {
    if (!chartData.length) return { min: 1900, max: 2100 };
    
    const binancePrices = chartData.map(d => d.binancePrice);
    const coinbasePrices = chartData.map(d => d.coinbasePrice);
    const allPrices = [...binancePrices, ...coinbasePrices];
    
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    
    // Add 2% padding
    const padding = (max - min) * 0.02;
    return {
      min: Math.floor(min - padding),
      max: Math.ceil(max + padding)
    };
  };

  return (
    <Card className="p-4 glassmorphism">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-medium flex items-center gap-2">
            <ChartLine className="h-5 w-5" />
            Price Difference History
          </h3>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="difference">Directional Difference</SelectItem>
                <SelectItem value="absoluteDifference">Absolute Difference</SelectItem>
                <SelectItem value="prices">Exchange Prices</SelectItem>
              </SelectContent>
            </Select>
            
            <Tabs defaultValue="day" value={timeRange} onValueChange={setTimeRange} className="w-[300px]">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="day" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> 24h
                </TabsTrigger>
                <TabsTrigger value="week" className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> 7d
                </TabsTrigger>
                <TabsTrigger value="month" className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> 30d
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Max difference indicators */}
        <div className="flex justify-between items-center px-4 py-2 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4 text-green-500" />
            <div>
              <span className="text-sm text-muted-foreground">Max Binance Higher:</span>
              <span className="ml-2 font-medium">+${maxBinanceHigher.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ArrowDown className="h-4 w-4 text-red-500" />
            <div>
              <span className="text-sm text-muted-foreground">Max Coinbase Higher:</span>
              <span className="ml-2 font-medium">+${maxCoinbaseHigher.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="h-[400px] w-full mt-4">
          {chartData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-muted-foreground">No data available for selected time range</p>
            </div>
          ) : chartType === 'prices' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[getPriceRange().min, getPriceRange().max]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <p className="font-medium">{formatDateTime(data.timestamp)}</p>
                          <p>Binance: {formatPrice(data.binancePrice)}</p>
                          <p>Coinbase: {formatPrice(data.coinbasePrice)}</p>
                          <p>Diff: {data.difference >= 0 ? '+' : ''}{formatPrice(data.difference)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="binancePrice" name="Binance" fill="#F0B90B" />
                <Bar dataKey="coinbasePrice" name="Coinbase" fill="#0052FF" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis 
                  domain={chartType === 'difference' ? 
                    [-(getMaxDifference()), getMaxDifference()] : 
                    [0, getMaxDifference()]} 
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <p className="font-medium">{formatDateTime(data.timestamp)}</p>
                          <p>Binance: {formatPrice(data.binancePrice)}</p>
                          <p>Coinbase: {formatPrice(data.coinbasePrice)}</p>
                          <p>Diff: {data.difference >= 0 ? '+' : ''}{formatPrice(data.difference)}</p>
                          <p>Samples: {data.count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#666" />
                {chartType === 'difference' ? (
                  <Bar dataKey={chartType} name="Price Difference" fill="#10B981">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.difference >= 0 ? "#10B981" : "#EF4444"} />
                    ))}
                  </Bar>
                ) : (
                  <Bar dataKey={chartType} name="Absolute Difference" fill="#10B981" />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>
            Showing {chartData.length} intervals with data grouped in 5-minute bars. 
            Data is collected every 5 minutes and stored for 30 days.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default PriceHistory;
