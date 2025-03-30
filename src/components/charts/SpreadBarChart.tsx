
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface SpreadBarChartProps {
  chartData: { time: string; binanceHigher: number; coinbaseHigher: number }[];
  getMaxSpread: () => number;
  formatYAxisTick: (value: number) => string;
}

const SpreadBarChart: React.FC<SpreadBarChartProps> = ({ 
  chartData, 
  getMaxSpread, 
  formatYAxisTick 
}) => {
  console.log('SpreadBarChart data:', chartData);

  const maxSpread = getMaxSpread();
  const maxChartValue = Math.max(maxSpread, 5);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={chartData} 
        margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
        barSize={20}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis 
          domain={[0, maxChartValue]} 
          tickFormatter={formatYAxisTick}
          label={{ value: 'Spread (USD)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <Bar 
          dataKey="binanceHigher" 
          name="Binance > Coinbase" 
          fill="rgba(34, 197, 94, 0.6)" // Green
        />
        <Bar 
          dataKey="coinbaseHigher" 
          name="Coinbase > Binance" 
          fill="rgba(239, 68, 68, 0.6)" // Red
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SpreadBarChart;
