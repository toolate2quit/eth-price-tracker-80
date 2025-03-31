
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

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
  console.log('Sample data point:', chartData?.[0]);
  
  if (!chartData || chartData.length === 0) {
    return <div>No data available for the chart</div>;
  }

  // Calculate max spread for Y-axis scaling
  const maxBinanceValue = Math.max(...chartData.map(d => d.binanceHigher || 0), 0);
  const maxCoinbaseValue = Math.max(...chartData.map(d => d.coinbaseHigher || 0), 0);
  const maxChartValue = Math.max(maxBinanceValue, maxCoinbaseValue, getMaxSpread() || 5); // Use getMaxSpread if provided
  
  console.log('Max chart values - Binance:', maxBinanceValue, 'Coinbase:', maxCoinbaseValue, 'Final:', maxChartValue);

  // Count non-zero instances for display
  const binanceHigherCount = chartData.filter(item => (item.binanceHigher || 0) > 0).length;
  const coinbaseHigherCount = chartData.filter(item => (item.coinbaseHigher || 0) > 0).length;
  console.log('Binance higher instances:', binanceHigherCount);
  console.log('Coinbase higher instances:', coinbaseHigherCount);
  
  return (
    <div className="border rounded-md p-2" style={{ height: '400px' }}>
      <h4 className="text-sm font-medium text-center mb-2">Exchange Price Spreads</h4>
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
            domain={[0, maxChartValue]} 
            tickFormatter={formatYAxisTick}
            label={{ value: 'Spread (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Bar 
            dataKey="binanceHigher" 
            name="Binance Higher" 
            fill="#F0B90B" 
          />
          <Bar 
            dataKey="coinbaseHigher" 
            name="Coinbase Higher" 
            fill="#0052FF" 
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-xs text-center text-muted-foreground mt-1">
        Binance higher: {binanceHigherCount} | Coinbase higher: {coinbaseHigherCount}
      </div>
    </div>
  );
};

export default ExchangeSpreadChart;
