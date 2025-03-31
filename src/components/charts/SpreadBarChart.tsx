
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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
  //console.log('SpreadBarChart data:', chartData);
  //console.log('Sample data point:', chartData?.[0]);

  if (!chartData || chartData.length === 0) {
    return <div>No data available for the chart</div>;
  }

  // Calculate max spread for Y-axis scaling
  const maxBinanceValue = Math.max(...chartData.map(d => d.maxBinanceSpread || 0), 0);
  const maxCoinbaseValue = Math.max(...chartData.map(d => d.maxCoinbaseSpread || 0), 0);
  const maxSpread = Math.max(maxBinanceValue, maxCoinbaseValue, getMaxSpread() || 5);
  
  //console.log('Max values calculated - Binance:', maxBinanceValue, 'Coinbase:', maxCoinbaseValue);

  // Count non-zero instances for display
  const binanceHigherCount = chartData.filter(item => (item.maxBinanceSpread || 0) > 0).length;
  const coinbaseHigherCount = chartData.filter(item => (item.maxCoinbaseSpread || 0) > 0).length;
  
  return (
    <div className="border rounded-md p-2" style={{ height: '400px' }}>
      <h4 className="text-sm font-medium text-center mb-2">Exchange Price Spreads</h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
          barGap={2} // Space between bars in the same time interval
          barCategoryGap={8} // Space between time intervals
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis 
            domain={[0, maxSpread]} 
            tickFormatter={formatYAxisTick}
            label={{ value: 'Max Spread (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
          />
          <Tooltip 
            formatter={(value) => [`$${Number(value).toFixed(2)}`, null]} 
            labelFormatter={(label) => `Time: ${label}`}
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
      <div className="text-xs text-center text-muted-foreground mt-1">
        Binance higher: {binanceHigherCount} | Coinbase higher: {coinbaseHigherCount}
      </div>
    </div>
  );
};

export default SpreadBarChart;
