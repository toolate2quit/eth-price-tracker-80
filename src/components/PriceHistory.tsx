import { useState, useMemo } from 'react';
import { PriceDifferenceRecord } from '@/types';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatDateTime, formatPrice } from '@/utils/priceUtils';
import { CalendarDays, ChartLine, Clock } from 'lucide-react';
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
  Cell,
  Line,
  LineChart,
  Area,
  AreaChart
} from 'recharts';

interface PriceHistoryProps {
  records: PriceDifferenceRecord[];
}

const PriceHistory: React.FC<PriceHistoryProps> = ({ records }) => {
  const [timeRange, setTimeRange] = useState<string>('day');
  const [chartType, setChartType] = useState<string>('spread');

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
          absoluteDifference: Math.abs(record.difference),
          spread: Math.abs(record.difference),
          count: 1
        });
      } else {
        const existing = groupedData.get(timeKey);
        // Update the weighted average prices
        existing.binancePrice = (existing.binancePrice * existing.count + record.binancePrice) / (existing.count + 1);
        existing.coinbasePrice = (existing.coinbasePrice * existing.count + record.coinbasePrice) / (existing.count + 1);
        
        // Recalculate the difference and spread based on the current average prices
        existing.difference = existing.binancePrice - existing.coinbasePrice;
        existing.absoluteDifference = Math.abs(existing.difference);
        existing.spread = Math.abs(existing.difference);
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

  // Get maximum price for the Y-axis
  const getMaxPrice = () => {
    if (!chartData.length) return 2100;
    
    const maxBinance = Math.max(...chartData.map(d => d.binancePrice));
    const maxCoinbase = Math.max(...chartData.map(d => d.coinbasePrice));
    const max = Math.max(maxBinance, maxCoinbase);
    
    return Math.ceil(max * 1.02); // Add 2% padding
  };

  // Get minimum price for the Y-axis
  const getMinPrice = () => {
    if (!chartData.length) return 1900;
    
    const minBinance = Math.min(...chartData.map(d => d.binancePrice));
    const minCoinbase = Math.min(...chartData.map(d => d.coinbasePrice));
    const min = Math.min(minBinance, minCoinbase);
    
    // Subtract 2% padding or set to 0 if showing absolute difference
    return chartType === 'sideBySide' ? Math.floor(min * 0.98) : 0;
  };

  // Get max spread for the Y-axis
  const getMaxSpread = () => {
    if (!chartData.length) return 100;
    
    const max = Math.max(...chartData.map(d => d.spread));
    return Math.ceil(max * 1.2); // Add 20% padding
  };

  // Format the Y-axis tick values
  const formatYAxisTick = (value: number) => {
    return `$${value.toFixed(0)}`;
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
                <SelectItem value="spread">Price Spread</SelectItem>
                <SelectItem value="sideBySide">Side by Side Prices</SelectItem>
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
        
        <div className="h-[400px] w-full mt-4">
          {chartData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-muted-foreground">No data available for selected time range</p>
            </div>
          ) : chartType === 'spread' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis 
                  domain={[0, getMaxSpread()]} 
                  tickFormatter={formatYAxisTick}
                  label={{ value: 'Price Spread (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
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
                          <p>Spread: {formatPrice(data.spread)}</p>
                          <p>Samples: {data.count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="spread" 
                  name="Price Spread" 
                  fill="#10B981" 
                />
              </BarChart>
            </ResponsiveContainer>
          ) : chartType === 'sideBySide' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                barGap={0} // Set the gap between bars to 0
                barCategoryGap={8} // Set the gap between categories (time intervals)
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis 
                  domain={[getMinPrice(), getMaxPrice()]} 
                  tickFormatter={formatYAxisTick}
                  label={{ value: 'Price (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
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
                <Legend />
                <Bar dataKey="binancePrice" name="Binance" fill="#F0B90B" />
                <Bar dataKey="coinbasePrice" name="Coinbase" fill="#0052FF" />
              </BarChart>
            </ResponsiveContainer>
          ) : chartType === 'prices' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis 
                  domain={[getMinPrice(), getMaxPrice()]} 
                  tickFormatter={formatYAxisTick}
                  label={{ value: 'Price (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
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
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis 
                  domain={[0, getMaxSpread()]} 
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  label={{ value: 'Price Difference (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
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
                <Bar dataKey="absoluteDifference" name="Absolute Difference" fill="#10B981" />
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
