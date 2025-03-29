
import { useState } from 'react';
import { PriceDifferenceRecord } from '@/types';
import { Card } from '@/components/ui/card';
import { ChartLine } from 'lucide-react';
import { getFormattedData } from '@/utils/chartDataUtils';
import ChartOptions from './charts/ChartOptions';
import ChartRenderer from './charts/ChartRenderer';

interface PriceHistoryProps {
  records: PriceDifferenceRecord[];
}

const PriceHistory: React.FC<PriceHistoryProps> = ({ records }) => {
  const [timeRange, setTimeRange] = useState<string>('day');
  const [chartType, setChartType] = useState<string>('spread');

  const chartData = getFormattedData(records, timeRange);
  
  return (
    <Card className="p-4 glassmorphism">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-medium flex items-center gap-2">
            <ChartLine className="h-5 w-5" />
            Price Difference History
          </h3>
          
          <ChartOptions 
            chartType={chartType}
            setChartType={setChartType}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
          />
        </div>
        
        <div className="h-[500px] w-full mt-4">
          <ChartRenderer chartData={chartData} chartType={chartType} />
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
