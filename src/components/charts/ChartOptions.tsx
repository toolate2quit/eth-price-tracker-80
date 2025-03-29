
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Clock } from 'lucide-react';

interface ChartOptionsProps {
  chartType: string;
  setChartType: (value: string) => void;
  timeRange: string;
  setTimeRange: (value: string) => void;
}

const ChartOptions: React.FC<ChartOptionsProps> = ({
  chartType,
  setChartType,
  timeRange,
  setTimeRange
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={chartType} onValueChange={setChartType}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Chart Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="spread">Price Spread</SelectItem>
          <SelectItem value="exchangeSpread">Exchange Spread</SelectItem>
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
  );
};

export default ChartOptions;
