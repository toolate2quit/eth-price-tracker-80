
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PriceChartTooltip from './PriceChartTooltip';

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
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis 
          domain={[0, getMaxSpread()]} 
          tickFormatter={formatYAxisTick}
          label={{ value: 'Price Spread (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
        />
        <Tooltip content={PriceChartTooltip} />
        <Legend />
        <Bar 
          dataKey="spread" 
          name="Price Spread" 
          fill="#10B981" 
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SpreadBarChart;
