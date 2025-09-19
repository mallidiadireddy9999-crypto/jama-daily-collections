import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Coin {
  id: string;
  x: number;
  y: number;
  delay: number;
  size: number;
}

interface CoinFlowAnimationProps {
  isActive: boolean;
  amount?: number;
  duration?: number;
  coinCount?: number;
  className?: string;
  onComplete?: () => void;
}

export const CoinFlowAnimation = ({ 
  isActive, 
  amount, 
  duration = 2000, 
  coinCount = 8,
  className,
  onComplete 
}: CoinFlowAnimationProps) => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [showAmount, setShowAmount] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Generate coins with random positions and delays
      const newCoins = Array.from({ length: coinCount }, (_, i) => ({
        id: `coin-${i}`,
        x: Math.random() * 200 - 100, // Random spread
        y: Math.random() * 50 - 25,
        delay: (i * 150) + Math.random() * 100, // Staggered animation
        size: 20 + Math.random() * 10, // Random sizes
      }));
      
      setCoins(newCoins);
      
      // Show amount after coins start flowing
      setTimeout(() => setShowAmount(true), 500);
      
      // Complete animation
      setTimeout(() => {
        setCoins([]);
        setShowAmount(false);
        onComplete?.();
      }, duration);
    }
  }, [isActive, coinCount, duration, onComplete]);

  if (!isActive) return null;

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-50", className)}>
      {/* Coins */}
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(${coin.x}px, ${coin.y}px)`,
            animationDelay: `${coin.delay}ms`,
            animationDuration: '2s',
            animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <div 
            className="animate-coin-flow"
            style={{ 
              width: coin.size, 
              height: coin.size,
            }}
          >
            {/* Gold coin */}
            <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 shadow-lg border-2 border-yellow-200 flex items-center justify-center relative overflow-hidden">
              {/* Coin shine effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent"></div>
              {/* Rupee symbol */}
              <span className="text-yellow-800 font-bold text-xs">₹</span>
              {/* Sparkle effect */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>
            </div>
          </div>
        </div>
      ))}

      {/* Wallet destination */}
      <div className="absolute bottom-20 right-20 animate-wallet-glow">
        <div className="w-16 h-12 bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg shadow-xl border-2 border-amber-600 relative">
          {/* Wallet opening */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 to-amber-800 rounded-t-lg"></div>
          {/* Wallet icon */}
          <div className="absolute inset-2 flex items-center justify-center">
            <div className="w-8 h-6 bg-amber-800 rounded border border-amber-600 flex items-center justify-center">
              <span className="text-amber-200 text-xs font-bold">₹</span>
            </div>
          </div>
          {/* Success glow */}
          <div className="absolute inset-0 rounded-lg bg-green-400/20 animate-pulse"></div>
        </div>
      </div>

      {/* Amount display */}
      {showAmount && amount && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-amount-popup">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-xl border-2 border-green-300">
            <span className="text-xl font-bold">+₹{amount.toLocaleString()}</span>
          </div>
          {/* Success particles */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-green-300 rounded-full animate-success-particle"
                style={{
                  left: `${20 + i * 15}%`,
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};