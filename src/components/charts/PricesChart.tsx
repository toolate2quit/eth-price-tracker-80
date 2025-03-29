
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PriceChartTooltip from './PriceChartTooltip';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface PricesChartProps {
  chartData: any[];
  getMinPrice: () => number;
  getMaxPrice: () => number;
  formatYAxisTick: (value: number) => string;
}

const PricesChart: React.FC<PricesChartProps> = ({ 
  chartData, 
  getMinPrice, 
  getMaxPrice, 
  formatYAxisTick 
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%" className="animate-fade-in">
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis 
          domain={[getMinPrice(), getMaxPrice()]} 
          tickFormatter={formatYAxisTick}
          label={{ value: 'Price (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
        />
        <Tooltip content={PriceChartTooltip} />
        <Legend 
          wrapperStyle={{ paddingTop: '10px' }}
          formatter={(value) => (
            <UITooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium cursor-help hover:text-primary transition-colors">{value}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{value} Bitcoin price</p>
              </TooltipContent>
            </UITooltip>
          )}
        />
        <Bar 
          dataKey="binancePrice" 
          name="Binance" 
          fill="#F0B90B"
          animationDuration={1500}
          animationEasing="ease-in-out"
          className="hover:opacity-80 transition-opacity" 
        />
        <Bar 
          dataKey="coinbasePrice" 
          name="Coinbase" 
          fill="#0052FF"
          animationDuration={1500}
          animationEasing="ease-in-out"
          className="hover:opacity-80 transition-opacity" 
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PricesChart;
