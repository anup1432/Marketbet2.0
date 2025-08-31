import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Timer from "@/components/trading/timer";
import Chart from "@/components/trading/chart";
import PlayerSection from "@/components/trading/player-section";
import BettingControls from "@/components/trading/betting-controls";
import Modal from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TradingPageProps {
  user: any;
  onLogout: () => void;
}

export default function TradingPage({ user: initialUser, onLogout }: TradingPageProps) {
  if (!initialUser) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  const { toast } = useToast();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNetwork, setDepositNetwork] = useState("trc20");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawNetwork, setWithdrawNetwork] = useState("trc20");

  // Queries
  const { data: user = initialUser, refetch: refetchUser } = useQuery({
    queryKey: ["/api/user/current", initialUser.username],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/user/current?username=${initialUser.username}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: game, refetch: refetchGame } = useQuery({
    queryKey: ["/api/game/current"],
    refetchInterval: 1000, // Refresh every second
  });

  const { data: bets = [] } = useQuery({
    queryKey: ["/api/bets/current"],
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  const { data: betHistory = [] } = useQuery({
    queryKey: ["/api/bets/history"],
    refetchInterval: 5000,
  });

  const { data: priceHistory = [] } = useQuery({
    queryKey: ["/api/price/history"],
    refetchInterval: 2000,
  });

  const { data: walletAddress } = useQuery({
    queryKey: ["/api/wallet", depositNetwork],
    enabled: showDepositModal,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/wallet?network=${depositNetwork}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  // Mutations
  const placeBetMutation = useMutation({
    mutationFn: async (betData: { side: string; amount: string; gameId: string }) => {
      const response = await apiRequest("POST", "/api/bets", {
        ...betData,
        userId: user?.userId || user?._id,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bets/current"] });
      toast({
        title: "Bet Placed",
        description: "Your bet has been placed successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bet Failed",
        description: error.message || "Failed to place bet",
        variant: "destructive",
      });
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: string; network: string; address: string }) => {
      const response = await apiRequest("POST", "/api/transactions/deposit", {
        ...data,
        username: user?.username,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setShowDepositModal(false);
      setDepositAmount("");
      toast({
        title: "Deposit Request Submitted",
        description: "Your deposit request has been submitted for admin approval.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deposit Failed",
        description: error.message || "Failed to submit deposit request",
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: string; network: string; address: string }) => {
      const response = await apiRequest("POST", "/api/transactions/withdraw", {
        ...data,
        username: user?.username,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setWithdrawAddress("");
      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted for admin approval.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    },
  });

  const handlePlaceBet = (side: string, amount: number) => {
    if (!game) return;

    placeBetMutation.mutate({
      side,
      amount: amount.toString(),
      gameId: game.id,
    });
  };

  const handleDeposit = () => {
    if (!depositAmount || !walletAddress?.address) return;

    depositMutation.mutate({
      amount: depositAmount,
      network: depositNetwork,
      address: walletAddress.address,
    });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || !withdrawAddress) return;

    withdrawMutation.mutate({
      amount: withdrawAmount,
      network: withdrawNetwork,
      address: withdrawAddress,
    });
  };

  // Separate bets by side for display
  const upBets = bets.filter((bet: any) => bet.side === "up");
  const downBets = bets.filter((bet: any) => bet.side === "down");

  return (
    <div className="min-h-screen bg-black dark">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 p-4 shadow-2xl">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight" data-testid="app-title">Betwin</h1>
              <p className="text-sm text-gray-400 font-medium">Professional Trading Platform</p>
              <div className="text-xs text-blue-400">Welcome, {user?.username || 'User'}!</div>
            </div>
            <div className="text-right">
              <div className="bg-gray-900/80 px-4 py-2 rounded-lg border border-gray-700 mb-2">
                <div className="text-sm text-gray-400">Balance</div>
                <div className="text-xl font-bold text-blue-400" data-testid="user-balance">
                  ${user?.balance || "0.00"}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="text-xs bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              onClick={() => setShowDepositModal(true)}
              data-testid="button-deposit"
            >
              Deposit
            </Button>
            <Button 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={() => setShowWithdrawModal(true)}
              data-testid="button-withdraw"
            >
              Withdraw
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Asset Info */}
        <Card className="bg-gradient-to-r from-card to-secondary/30 border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <span className="text-orange-400 text-xl font-bold">₿</span>
                </div>
                <div>
                  <span className="font-bold text-lg">BTC/USDT</span>
                  <div className="text-sm text-muted-foreground">5s intervals</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary" data-testid="current-price">
                  ${priceHistory[priceHistory.length - 1]?.price || "117,650.00"}
                </div>
                <div className="text-sm text-green-400">+2.34%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer and Win Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Up Wins</div>
                <div className="text-green-400 font-semibold">$1.00</div>
                <div className="text-xs text-green-400">130%</div>
              </div>

              <Timer game={game} />

              <div className="text-center">
                <div className="text-sm text-muted-foreground">Down Wins</div>
                <div className="text-red-400 font-semibold">$1.00</div>
                <div className="text-xs text-red-400">130%</div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground" data-testid="game-status">
                {game?.phase === "betting" ? "Place your bets" : "Calculating result..."}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Chart priceHistory={priceHistory} />

        {/* Statistics */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-muted-foreground">24h players:</span>
                <span className="font-medium ml-1" data-testid="daily-players">412</span>
              </div>
              <div>
                <span className="text-muted-foreground">All time wins paid:</span>
                <span className="font-medium ml-1 text-green-500">$21,839,206.45</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Players */}
        <PlayerSection upBets={upBets} downBets={downBets} />

        {/* Betting Controls */}
        <BettingControls 
          onPlaceBet={handlePlaceBet}
          disabled={game?.phase !== "betting" || placeBetMutation.isPending}
          userBalance={parseFloat(user?.balance || "0")}
        />

        {/* History */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Recent History</h3>
            <div className="space-y-2" data-testid="history-list">
              {betHistory.slice(0, 10).map((bet: any) => (
                <div key={bet.id} className="flex justify-between items-center py-2 border-b border-border">
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      {new Date(bet.createdAt).toLocaleTimeString()}
                    </span>
                    <span className={`ml-2 ${bet.side === "up" ? "text-green-500" : "text-red-500"}`}>
                      {bet.side.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${bet.amount}</div>
                    <div className={`text-xs ${bet.isWin ? "text-green-500" : "text-red-500"}`}>
                      {bet.isWin ? `+$${bet.winAmount}` : `-$${bet.amount}`}
                    </div>
                  </div>
                </div>
              ))}
              {betHistory.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No history yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Deposit Modal */}
      <Modal open={showDepositModal} onOpenChange={setShowDepositModal}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Deposit USDT</h3>
          <div className="space-y-4">
            <div>
              <Label>Select Network</Label>
              <Select value={depositNetwork} onValueChange={setDepositNetwork}>
                <SelectTrigger data-testid="select-deposit-network">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trc20">TRC20 (Tron)</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="ton">TON</SelectItem>
                  <SelectItem value="bep20">BEP20 (BSC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount (USDT)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                data-testid="input-deposit-amount"
              />
            </div>

            <div>
              <Label>Wallet Address</Label>
              <div className="p-3 bg-secondary rounded-lg">
                <div className="text-sm font-mono break-all" data-testid="deposit-address">
                  {walletAddress?.address || "Loading..."}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-auto p-0 text-primary"
                  onClick={() => navigator.clipboard.writeText(walletAddress?.address || "")}
                  data-testid="button-copy-address"
                >
                  Copy Address
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Send USDT to the address above. Your balance will be updated after admin confirmation.
            </div>

            <Button 
              onClick={handleDeposit}
              disabled={!depositAmount || depositMutation.isPending}
              className="w-full"
              data-testid="button-confirm-deposit"
            >
              {depositMutation.isPending ? "Submitting..." : "Confirm Deposit"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Withdraw USDT</h3>
          <div className="space-y-4">
            <div>
              <Label>Amount (USDT)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                data-testid="input-withdraw-amount"
              />
            </div>

            <div>
              <Label>Your Wallet Address</Label>
              <Input
                placeholder="Enter your wallet address"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                data-testid="input-withdraw-address"
              />
            </div>

            <div>
              <Label>Select Network</Label>
              <Select value={withdrawNetwork} onValueChange={setWithdrawNetwork}>
                <SelectTrigger data-testid="select-withdraw-network">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trc20">TRC20 (Tron)</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="ton">TON</SelectItem>
                  <SelectItem value="bep20">BEP20 (BSC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground">
              Minimum withdrawal: $10 USDT. Processing time: 1-24 hours.
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || !withdrawAddress || withdrawMutation.isPending}
              variant="destructive"
              className="w-full"
              data-testid="button-confirm-withdraw"
            >
              {withdrawMutation.isPending ? "Submitting..." : "Request Withdrawal"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}