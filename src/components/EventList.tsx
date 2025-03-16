
import { useState } from 'react';
import { PriceEvent } from '@/types';
import { 
  formatPrice, 
  formatTimestamp, 
  formatDateTime, 
  calculateDuration 
} from '@/utils/priceUtils';
import { exportEvents } from '@/services/priceService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  BarChart, 
  ExternalLink, 
  Clock, 
  ArrowUpDown,
  CheckSquare, 
  Calendar, 
  Upload
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface EventListProps {
  events: PriceEvent[];
}

const EventList = ({ events }: EventListProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Prepare data for export
      const exportData = {
        events,
        exportTime: new Date(),
        source: 'Ethereum Price Tracker'
      };
      
      const success = await exportEvents(exportData);
      
      if (success) {
        toast({
          title: "Data exported successfully",
          description: `${events.length} events have been sent for processing`,
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export data to the cloud service",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (events.length === 0) {
    return (
      <Card className="p-8 text-center glassmorphism">
        <div className="flex flex-col items-center justify-center space-y-4">
          <BarChart className="h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-medium">No events detected yet</h3>
          <p className="text-muted-foreground">
            Events will appear here when a price difference greater than $2 is detected
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light">
          Detected Events <span className="text-sm text-muted-foreground ml-2">({events.length})</span>
        </h2>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={handleExport}
          disabled={isExporting || events.length === 0}
        >
          <Upload className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export Data"}
        </Button>
      </div>
      
      <div className="space-y-4">
        {events.map(event => (
          <Card 
            key={event.id} 
            className={`p-5 glassmorphism transition-all duration-300 border-l-4 ${
              event.status === 'active' 
                ? 'border-l-warning animate-pulse' 
                : 'border-l-success'
            }`}
          >
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {event.status === 'active' ? (
                    <Clock className="h-4 w-4 text-warning" />
                  ) : (
                    <CheckSquare className="h-4 w-4 text-success" />
                  )}
                  <span className="font-medium capitalize">
                    {event.status === 'active' ? 'Ongoing Event' : 'Completed Event'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  ID: {event.id}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Started:</span> 
                    <span>{formatDateTime(event.startTime)}</span>
                  </div>
                  
                  {event.endTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Ended:</span> 
                      <span>{formatDateTime(event.endTime)}</span>
                    </div>
                  )}
                  
                  {event.endTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Duration:</span> 
                      <span>{calculateDuration(event.startTime, event.endTime)}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Exchanges:</span>
                    <span>{event.exchangeA} / {event.exchangeB}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Initial Difference:</span>
                    <span className="font-medium">{formatPrice(event.initialDifference)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowUpDown className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Max Difference:</span>
                    <span className="font-medium text-primary">{formatPrice(event.maxDifference)}</span>
                    {event.maxDifferenceTime && (
                      <span className="text-xs text-muted-foreground">
                        at {formatTimestamp(event.maxDifferenceTime)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EventList;
