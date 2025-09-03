
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BettingControlsProps {
  onPlaceBet: (side: string, amount: number) => void;
  disabled: boolean;
  userBalance: number;
}

const BET_AMOUNTS = [0.1, 0.5, 1, 2, 5];

export default function BettingControls({ onPlaceBet, disabled, userBalance }: BettingControlsProps) {
  const [selectedAmount, setSelectedAmount] = useState(1);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
  };

  const handlePlaceBet = (side: string) => {
    if (userBalance >= selectedAmount && !disabled) {
      onPlaceBet(side, selectedAmount);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700">
      <CardContent className="p-6">
        {/* Amount Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-blue-400 text-2xl font-bold">₮</span>
            <span className="text-white font-bold text-lg" data-testid="selected-amount">
              {selectedAmount}
            </span>
            <div className="flex-1 flex gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                onClick={() => setSelectedAmount(Math.max(1, selectedAmount / 2))}
                data-testid="button-half-amount"
              >
                1/2
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                onClick={() => setSelectedAmount(selectedAmount * 2)}
                data-testid="button-double-amount"
              >
                2x
              </Button>
            </div>
          </div>

          {/* Preset Amount Buttons */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {BET_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant={selectedAmount === amount ? "default" : "outline"}
                size="sm"
                className={`font-semibold transition-all ${
                  selectedAmount === amount 
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500" 
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600"
                }`}
                onClick={() => handleAmountSelect(amount)}
                data-testid={`button-amount-${amount}`}
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Balance Check */}
        <div className="text-center mb-4">
          <div className="text-sm text-gray-400">
            Available Balance: <span className="text-blue-400 font-semibold">${userBalance.toFixed(2)}</span>
          </div>
          {selectedAmount > userBalance && (
            <div className="text-red-400 text-xs mt-1">Insufficient balance</div>
          )}
        </div>

        {/* Betting Buttons */}
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-gradient-to-br from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white font-bold py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 border border-green-400/30 rounded-xl"
            onClick={() => handlePlaceBet("up")}
            disabled={disabled || selectedAmount > userBalance}
            data-testid="button-bet-up"
          >
            <div className="flex flex-col items-center gap-1">
              <div className="text-3xl">📈</div>
              <span className="font-extrabold tracking-wide">UP</span>
              <span className="text-xs opacity-90">Win 1.95x</span>
            </div>
          </Button>

          <Button
            className="flex-1 bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-bold py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 border border-red-400/30 rounded-xl"
            onClick={() => handlePlaceBet("down")}
            disabled={disabled || selectedAmount > userBalance}
            data-testid="button-bet-down"
          >
            <div className="flex flex-col items-center gap-1">
              <div className="text-3xl">📉</div>
              <span className="font-extrabold tracking-wide">DOWN</span>
              <span className="text-xs opacity-90">Win 1.95x</span>
            </div>
          </Button>
        </div>

        {/* Status Message */}
        {disabled && (
          <div className="text-center mt-4">
            <div className="text-amber-400 text-sm font-medium bg-amber-900/30 py-2 px-4 rounded-lg border border-amber-800/50">
              Betting closed - Calculating result...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
