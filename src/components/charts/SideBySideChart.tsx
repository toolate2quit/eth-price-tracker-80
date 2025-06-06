
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface SideBySideChartProps {
  chartData: any[];
  getMinPrice: () => number;
  getMaxPrice: () => number;
  formatYAxisTick: (value: number) => string;
}

const SideBySideChart: React.FC<SideBySideChartProps> = ({ 
  chartData, 
  getMinPrice, 
  getMaxPrice, 
  formatYAxisTick 
}) => {
  console.log('Rendering SideBySideChart with data:', chartData);
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={chartData} 
        margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
        barSize={20}
        barGap={8}
        barCategoryGap={20}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis 
          domain={[getMinPrice(), getMaxPrice()]} 
          tickFormatter={formatYAxisTick}
          label={{ value: 'Price (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
        />
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
        />
        <Bar 
          dataKey="coinbasePrice" 
          name="Coinbase" 
          fill="#0052FF" 
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SideBySideChart;
