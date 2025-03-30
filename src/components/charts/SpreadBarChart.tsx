
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';

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
  
  // State for active cursor position
  const [activeData, setActiveData] = useState<{ time: string; value: number } | null>(null);

  const handleMouseMove = (e: any) => {
    if (e && e.activePayload && e.activePayload.length) {
      const time = e.activeLabel;
      const value = Math.max(e.activePayload[0].payload.maxBinanceSpread, e.activePayload[0].payload.maxCoinbaseSpread);
      setActiveData({ time, value });
    }
  };

  const handleMouseLeave = () => {
    setActiveData(null);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={chartData} 
        margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
        barSize={20}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis 
          domain={[0, maxSpread]} 
          tickFormatter={formatYAxisTick}
          label={{ value: 'Max Spread (USD)', angle: -90, position: 'insideLeft' }}
        />
        
        {/* Dynamic crosshair lines */}
        {activeData && (
          <>
            <ReferenceLine x={activeData.time} stroke="#ccc" strokeDasharray="3 3" />
            <ReferenceLine y={activeData.value} stroke="#ccc" strokeDasharray="3 3" />
          </>
        )}
        
        {/* Tooltip for cursor position */}
        <Tooltip 
          cursor={{ stroke: '#ccc', strokeDasharray: '3 3' }}
          contentStyle={{ display: 'none' }} // Hide default tooltip content
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
