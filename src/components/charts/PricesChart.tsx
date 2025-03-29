
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PriceChartTooltip from './PriceChartTooltip';

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
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis 
          domain={[getMinPrice(), getMaxPrice()]} 
          tickFormatter={formatYAxisTick}
          label={{ value: 'Price (USD)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }}
        />
        <Tooltip content={PriceChartTooltip} />
        <Legend />
        <Bar dataKey="binancePrice" name="Binance" fill="#F0B90B" />
        <Bar dataKey="coinbasePrice" name="Coinbase" fill="#0052FF" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PricesChart;
