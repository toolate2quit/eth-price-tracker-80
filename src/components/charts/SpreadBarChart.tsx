
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PriceChartTooltip from './PriceChartTooltip';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface SpreadBarChartProps {
  chartData: any[];
  getMaxSpread: () => number;
  formatYAxisTick: (value: number) => string;
}

const SpreadBarChart: React.FC<SpreadBarChartProps> = ({ 
  chartData, 
  getMaxSpread, 
  formatYAxisTick 
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={chartData} 
        margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
        barGap={0}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis 
          domain={[0, getMaxSpread()]} 
          tickFormatter={formatYAxisTick}
          label={{ value: 'Price Spread (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
        />
        <Tooltip content={<PriceChartTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: '10px' }}
          formatter={(value) => (
            <UITooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium cursor-help hover:text-primary transition-colors">{value}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Price difference between exchanges</p>
              </TooltipContent>
            </UITooltip>
          )}
        />
        <Bar 
          dataKey="spread" 
          name="Price Spread" 
          fill="#10B981" 
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SpreadBarChart;
