
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

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
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={chartData} 
        margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
        barSize={20}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis 
          domain={[0, maxSpread]} 
          tickFormatter={formatYAxisTick}
          label={{ value: 'Max Spread (USD)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          cursor={{ stroke: '#ccc', strokeDasharray: '3 3', strokeWidth: 1 }}
          content={({ active, payload, coordinate }) => {
            if (active && payload && payload.length && coordinate) {
              return (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    width: '100%',
                    height: '1px',
                    background: '#ccc',
                    top: `${coordinate.y}px`,
                    pointerEvents: 'none',
                    borderStyle: 'dashed',
                    borderWidth: '1px',
                    borderColor: '#ccc',
                  }}
                />
              );
            }
            return null;
          }}
          isAnimationActive={false}
        />
        <Bar 
          dataKey="maxBinanceSpread" 
          name="Binance Max Spread" 
          fill="rgba(34, 197, 94, 0.6)" // Green
        />
        <Bar 
          dataKey="maxCoinbaseSpread" 
          name="Coinbase Max Spread" 
          fill="rgba(239, 68, 68, 0.6)" // Red
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SpreadBarChart;
