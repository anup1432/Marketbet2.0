
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TabbedSectionProps {
  betHistory: any[];
  currentUser: any;
}

export default function TabbedSection({ betHistory, currentUser }: TabbedSectionProps) {
  const [activeTab, setActiveTab] = useState("history");

  const tabs = [
    { id: "history", label: "Recent History" },
    { id: "transactions", label: "Transactions" },
    { id: "topplayers", label: "Top Players" }
  ];

  // Get real transactions data
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/user/transactions", currentUser?.username],
    queryFn: async () => {
      if (!currentUser?.username) return [];
      const response = await apiRequest("GET", `/api/user/transactions?username=${currentUser.username}`);
      if (!response.ok) return [];
      return response.json();
    },
    refetchInterval: 5000,
    enabled: !!currentUser?.username
  });

  // Get top players data
  const { data: topPlayers = [] } = useQuery({
    queryKey: ["/api/game/top-players"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/game/top-players");
      if (!response.ok) return [];
      return response.json();
    },
    refetchInterval: 10000,
  });

  return (
    <Card>
      <CardContent className="p-0">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={`flex-1 rounded-none py-3 px-4 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400 bg-blue-500/10"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "history" && (
            <div className="space-y-2" data-testid="history-list">
              {betHistory.slice(0, 3).map((bet: any) => (
                <div key={bet.id} className="flex justify-between items-center py-3 px-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        bet.side === "up" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {bet.side.toUpperCase()}
                      </span>
                      <span className="text-gray-400">
                        {new Date(bet.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${bet.amount}</div>
                    <div className={`text-xs font-bold ${bet.isWin ? "text-green-400" : "text-red-400"}`}>
                      {bet.isWin ? `+$${bet.winAmount?.toFixed(2)}` : `-$${bet.amount}`}
                    </div>
                  </div>
                </div>
              ))}
              {betHistory.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No history yet
                </div>
              )}
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No transactions yet
                </div>
              ) : (
                transactions.map((tx: any) => (
                  <div key={tx._id} className="flex justify-between items-center py-3 px-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          tx.type === "deposit" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {tx.type.toUpperCase()}
                        </span>
                        <span className="text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">${tx.amount}</div>
                      <div className={`text-xs ${
                        tx.status === "approved" ? "text-green-400" : 
                        tx.status === "rejected" ? "text-red-400" : "text-yellow-400"
                      }`}>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "topplayers" && (
            <div className="space-y-2 max-w-full overflow-hidden">
              {topPlayers.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No players data
                </div>
              ) : (
                topPlayers.map((player: any, index: number) => (
                  <div key={player.username} className="flex justify-between items-center py-2 px-2 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                        index === 1 ? "bg-gray-500/20 text-gray-400" :
                        index === 2 ? "bg-orange-500/20 text-orange-400" :
                        "bg-blue-500/20 text-blue-400"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">
                          {player.username === currentUser?.username ? "You" : player.username}
                        </div>
                        <div className="text-xs text-gray-400">{player.winRate}%</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm font-bold ${
                        player.totalProfit >= 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {player.totalProfit >= 0 ? "+" : ""}${player.totalProfit.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
