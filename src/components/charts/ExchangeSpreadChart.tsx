
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {/* Binance Higher Chart */}
      <div className="h-full">
        <h4 className="text-sm font-medium text-center mb-2">Binance Higher</h4>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart 
            data={chartData} 
            margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis 
              domain={[0, getMaxSpread()]} 
              tickFormatter={formatYAxisTick}
              label={{ value: 'Spread (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
            />
            <Bar 
              dataKey="binanceHigher" 
              name="Binance Higher" 
              fill="#F0B90B" 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Coinbase Higher Chart */}
      <div className="h-full">
        <h4 className="text-sm font-medium text-center mb-2">Coinbase Higher</h4>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart 
            data={chartData} 
            margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis 
              domain={[0, getMaxSpread()]} 
              tickFormatter={formatYAxisTick}
              label={{ value: 'Spread (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
            />
            <Bar 
              dataKey="coinbaseHigher" 
              name="Coinbase Higher" 
              fill="#0052FF" 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExchangeSpreadChart;
