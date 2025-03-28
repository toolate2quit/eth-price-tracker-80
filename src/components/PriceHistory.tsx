
import { useState } from 'react';
import { PriceDifferenceRecord } from '@/types';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatDateTime, formatPrice } from '@/utils/priceUtils';
import { CalendarDays, ChartLine, Clock } from 'lucide-react';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface PriceHistoryProps {
  records: PriceDifferenceRecord[];
}

const PriceHistory: React.FC<PriceHistoryProps> = ({ records }) => {
  const [timeRange, setTimeRange] = useState<string>('day');
  const [chartType, setChartType] = useState<string>('difference');

  // Format data for the chart
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

    // Map to chart format
    return filteredRecords.map(record => ({
      timestamp: record.timestamp,
      time: formatTime(record.timestamp),
      difference: record.difference,
      absoluteDifference: record.absoluteDifference,
      binancePrice: record.binancePrice,
      coinbasePrice: record.coinbasePrice,
    }));
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
        
        <div className="h-[400px] w-full mt-4">
          {chartData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-muted-foreground">No data available for selected time range</p>
            </div>
          ) : chartType === 'prices' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="binanceColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F0B90B" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#F0B90B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="coinbaseColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0052FF" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0052FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" />
                <YAxis domain={[getPriceRange().min, getPriceRange().max]} />
                <CartesianGrid strokeDasharray="3 3" />
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
                <Area
                  type="monotone"
                  dataKey="binancePrice"
                  name="Binance"
                  stroke="#F0B90B"
                  fillOpacity={1}
                  fill="url(#binanceColor)"
                />
                <Area
                  type="monotone"
                  dataKey="coinbasePrice"
                  name="Coinbase"
                  stroke="#0052FF"
                  fillOpacity={1}
                  fill="url(#coinbaseColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="differenceColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={chartType}
                  name={chartType === 'difference' ? 'Price Difference' : 'Absolute Difference'}
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#differenceColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>
            Showing {chartData.length} data points. 
            Data is collected every 5 minutes and stored for 30 days.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default PriceHistory;
