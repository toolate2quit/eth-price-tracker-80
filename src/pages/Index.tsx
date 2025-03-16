
import PriceTracker from "@/components/PriceTracker";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
        <PriceTracker />
      </div>
    </div>
  );
};

export default Index;
