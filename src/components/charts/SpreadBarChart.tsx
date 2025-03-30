
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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
  console.log('SpreadBarChart data:', chartData); // Debug the input data
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={chartData} 
        margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
        barSize={20}
        barGap={5}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis 
          domain={[0, getMaxSpread()]} 
          tickFormatter={formatYAxisTick}
          label={{ value: 'Price Spread (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
        />
        <Tooltip 
          formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '10px' }}
          formatter={(value) => (
            <UITooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium cursor-help hover:text-primary transition-colors">{value}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{value === 'Binance > Coinbase' ? 'Spread when Binance price is higher' : 'Spread when Coinbase price is higher'}</p>
              </TooltipContent>
            </UITooltip>
          )}
        />
        <Bar 
          dataKey="binanceHigher" 
          name="Binance > Coinbase" 
          fill="rgba(34, 197, 94, 0.8)" 
        />
        <Bar 
          dataKey="coinbaseHigher" 
          name="Coinbase > Binance" 
          fill="rgba(239, 68, 68, 0.8)" 
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SpreadBarChart;
