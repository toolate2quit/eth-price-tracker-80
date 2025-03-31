
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';

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

  const maxSpread = getMaxSpread();

  return (
    <ChartContainer 
      config={{
        binance: { color: "rgba(34, 197, 94, 0.6)" },
        coinbase: { color: "rgba(239, 68, 68, 0.6)" }
      }}
      className="h-full"
    >
      <BarChart 
        data={chartData} 
        margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
        barCategoryGap={10}
        barGap={0}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis 
          domain={[0, maxSpread]} 
          tickFormatter={formatYAxisTick}
          label={{ value: 'Max Spread (USD)', angle: -90, position: 'insideLeft' }}
        />
        <ChartTooltip 
          content={<ChartTooltipContent />}
          cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
        />
        <Legend />
        <Bar 
          dataKey="maxBinanceSpread" 
          name="Binance Higher" 
          fill="rgba(34, 197, 94, 0.6)" // Green
          isAnimationActive={false}
        />
        <Bar 
          dataKey="maxCoinbaseSpread" 
          name="Coinbase Higher" 
          fill="rgba(239, 68, 68, 0.6)" // Red
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  );
};

export default SpreadBarChart;
