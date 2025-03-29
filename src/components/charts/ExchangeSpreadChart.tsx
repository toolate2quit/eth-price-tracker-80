
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

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
  
  // Filter data to only include entries where each exchange has higher values
  const binanceHigherData = chartData.filter(item => item.binanceHigher > 0);
  const coinbaseHigherData = chartData.filter(item => item.coinbaseHigher > 0);

  console.log('Binance higher data points:', binanceHigherData.length);
  console.log('Coinbase higher data points:', coinbaseHigherData.length);
  
  // Get max value for chart scaling (use the overall max for both charts)
  const maxBinanceValue = Math.max(...chartData.map(d => d.binanceHigher || 0));
  const maxCoinbaseValue = Math.max(...chartData.map(d => d.coinbaseHigher || 0));
  const maxChartValue = Math.max(maxBinanceValue, maxCoinbaseValue, 5); // Set minimum to 5 for better visualization
  
  console.log('Max chart values - Binance:', maxBinanceValue, 'Coinbase:', maxCoinbaseValue);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {/* Binance Higher Chart */}
      <div className="h-full border rounded-md p-2">
        <h4 className="text-sm font-medium text-center mb-2">Binance Higher</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={chartData} 
            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis 
              domain={[0, maxChartValue]} 
              tickFormatter={formatYAxisTick}
              label={{ value: 'Spread (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
            />
            <Tooltip 
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Binance Higher']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Bar 
              dataKey="binanceHigher" 
              name="Binance Higher" 
              fill="#F0B90B" 
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-xs text-center text-muted-foreground mt-1">
          {binanceHigherData.length} instances where Binance price was higher
        </div>
      </div>
      
      {/* Coinbase Higher Chart */}
      <div className="h-full border rounded-md p-2">
        <h4 className="text-sm font-medium text-center mb-2">Coinbase Higher</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={chartData} 
            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis 
              domain={[0, maxChartValue]} 
              tickFormatter={formatYAxisTick}
              label={{ value: 'Spread (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
            />
            <Tooltip 
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Coinbase Higher']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Bar 
              dataKey="coinbaseHigher" 
              name="Coinbase Higher" 
              fill="#0052FF" 
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-xs text-center text-muted-foreground mt-1">
          {coinbaseHigherData.length} instances where Coinbase price was higher
        </div>
      </div>
    </div>
  );
};

export default ExchangeSpreadChart;
