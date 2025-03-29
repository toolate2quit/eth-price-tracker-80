
import { formatDateTime, formatPrice } from '@/utils/priceUtils';

interface TooltipProps {
  active?: boolean;
  payload?: any[];
}

const PriceChartTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md animate-fade-in">
        <p className="font-medium">{formatDateTime(data.timestamp)}</p>
        <p>Binance: {formatPrice(data.binancePrice)}</p>
        <p>Coinbase: {formatPrice(data.coinbasePrice)}</p>
        <p>Difference: {data.difference >= 0 ? '+' : ''}{formatPrice(data.difference)}</p>
        <p>Samples: {data.count}</p>
      </div>
    );
  }
  return null;
};

export default PriceChartTooltip;
