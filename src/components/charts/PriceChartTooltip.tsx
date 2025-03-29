
import { formatDateTime, formatPrice } from '@/utils/priceUtils';

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const PriceChartTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
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
