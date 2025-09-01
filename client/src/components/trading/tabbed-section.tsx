
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TabbedSectionProps {
  betHistory: any[];
}

export default function TabbedSection({ betHistory }: TabbedSectionProps) {
  const [activeTab, setActiveTab] = useState("history");

  const tabs = [
    { id: "history", label: "Recent History" },
    { id: "transactions", label: "Transactions" },
    { id: "topplayers", label: "Top Players" }
  ];

  const mockTransactions = [
    { id: 1, type: "deposit", amount: 100, status: "completed", time: "2 hours ago" },
    { id: 2, type: "withdraw", amount: 50, status: "pending", time: "1 day ago" },
    { id: 3, type: "deposit", amount: 200, status: "completed", time: "3 days ago" }
  ];

  const mockTopPlayers = [
    { rank: 1, username: "CryptoKing", profit: "+$1,245", winRate: "68%" },
    { rank: 2, username: "TradeMaster", profit: "+$987", winRate: "64%" },
    { rank: 3, username: "BullRun", profit: "+$756", winRate: "61%" },
    { rank: 4, username: "You", profit: "+$234", winRate: "45%" }
  ];

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
              {mockTransactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center py-3 px-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        tx.type === "deposit" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {tx.type.toUpperCase()}
                      </span>
                      <span className="text-gray-400">{tx.time}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${tx.amount}</div>
                    <div className={`text-xs ${
                      tx.status === "completed" ? "text-green-400" : "text-yellow-400"
                    }`}>
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "topplayers" && (
            <div className="space-y-2">
              {mockTopPlayers.map((player) => (
                <div key={player.rank} className="flex justify-between items-center py-3 px-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      player.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                      player.rank === 2 ? "bg-gray-500/20 text-gray-400" :
                      player.rank === 3 ? "bg-orange-500/20 text-orange-400" :
                      "bg-blue-500/20 text-blue-400"
                    }`}>
                      #{player.rank}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{player.username}</div>
                      <div className="text-xs text-gray-400">Win Rate: {player.winRate}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${
                      player.profit.startsWith("+") ? "text-green-400" : "text-red-400"
                    }`}>
                      {player.profit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
