
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PriceChartTooltip from './PriceChartTooltip';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface ExchangeSpreadChartProps {
  chartData: any[];
  getMaxSpread: () => number;
  formatYAxisTick: (value: number) => string;
}

const ExchangeSpreadChart: React.FC<ExchangeSpreadChartProps> = ({ 
  chartData, 
  getMaxSpread, 
  formatYAxisTick 
}) => {
  console.log('ExchangeSpreadChart data:', chartData);
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={chartData} 
        margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
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
                {value === "Binance Higher" ? (
                  <p>When Binance price exceeds Coinbase</p>
                ) : (
                  <p>When Coinbase price exceeds Binance</p>
                )}
              </TooltipContent>
            </UITooltip>
          )}
        />
        <Bar 
          dataKey="binanceHigher" 
          name="Binance Higher" 
          fill="#F0B90B" 
          barSize={30}
        />
        <Bar 
          dataKey="coinbaseHigher" 
          name="Coinbase Higher" 
          fill="#0052FF" 
          barSize={30}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ExchangeSpreadChart;
