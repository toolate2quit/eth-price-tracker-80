
import SpreadBarChart from './SpreadBarChart';
import ExchangeSpreadChart from './ExchangeSpreadChart';
import SideBySideChart from './SideBySideChart';
import PricesChart from './PricesChart';
import { getMaxPrice, getMinPrice, getMaxSpread, formatYAxisTick } from '@/utils/chartDataUtils';
import { useState, useEffect } from 'react';

interface ChartRendererProps {
  chartData: any[];
  chartType: string;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ chartData, chartType }) => {
  const [currentChart, setCurrentChart] = useState(chartType);
  
  useEffect(() => {
    if (chartType !== currentChart) {
      setCurrentChart(chartType);
    }
  }, [chartType, currentChart]);

  if (chartData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-muted-foreground">No data available for selected time range</p>
      </div>
    );
  }

  const getMinPriceValue = () => getMinPrice(chartData, currentChart);
  const getMaxPriceValue = () => getMaxPrice(chartData);
  const getMaxSpreadValue = () => getMaxSpread(chartData);

  const renderChart = () => {
    switch (currentChart) {
      case 'exchangeSpread':
        return (
          <ExchangeSpreadChart 
            chartData={chartData} 
            getMaxSpread={getMaxSpreadValue} 
            formatYAxisTick={formatYAxisTick}
          />
        );
      case 'spread':
        return (
          <SpreadBarChart 
            chartData={chartData} 
            getMaxSpread={getMaxSpreadValue} 
            formatYAxisTick={formatYAxisTick}
          />
        );
      case 'sideBySide':
        return (
          <SideBySideChart 
            chartData={chartData} 
            getMinPrice={getMinPriceValue} 
            getMaxPrice={getMaxPriceValue} 
            formatYAxisTick={formatYAxisTick}
          />
        );
      case 'prices':
        return (
          <PricesChart 
            chartData={chartData} 
            getMinPrice={getMinPriceValue} 
            getMaxPrice={getMaxPriceValue} 
            formatYAxisTick={formatYAxisTick}
          />
        );
      default:
        return (
          <SpreadBarChart 
            chartData={chartData} 
            getMaxSpread={getMaxSpreadValue} 
            formatYAxisTick={formatYAxisTick}
          />
        );
    }
  };

  return (
    <div>
      {renderChart()}
    </div>
  );
};

export default ChartRenderer;
