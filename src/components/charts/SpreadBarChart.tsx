
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

interface SpreadBarChartProps {
  chartData: { time: string; maxBinanceSpread: number; maxCoinbaseSpread: number }[];
  getMaxSpread: () => number;
  formatYAxisTick: (value: number) => string;
}

const SpreadBarChart: React.FC<SpreadBarChartProps> = ({ 
  chartData, 
  getMaxSpread, 
  formatYAxisTick 
}) => {
  console.log('SpreadBarChart data:', chartData);
  console.log('Sample data point:', chartData?.[0]);

  const maxSpread = getMaxSpread();

  if (!chartData || chartData.length === 0) {
    return <div>No data available for the chart</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={chartData} 
        margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
        barGap={2} // Space between bars in the same category
        barCategoryGap={8} // Space between categories (time intervals)
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis 
          domain={[0, maxSpread]} 
          tickFormatter={formatYAxisTick}
          label={{ value: 'Max Spread (USD)', angle: -90, position: 'insideLeft' }}
        />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
        <Bar 
          dataKey="maxBinanceSpread" 
          name="Binance Higher" 
          fill="#F0B90B" // Binance yellow
          isAnimationActive={false}
        />
        <Bar 
          dataKey="maxCoinbaseSpread" 
          name="Coinbase Higher" 
          fill="#0052FF" // Coinbase blue
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SpreadBarChart;
