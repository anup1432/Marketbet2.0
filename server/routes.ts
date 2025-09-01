import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBetSchema, insertTransactionSchema, insertGameSchema, insertPriceHistorySchema } from "@shared/schema";
import { z } from "zod";
import User from "./models/User.js";
import Transaction from "./models/Transaction.js";
import express from "express";
import { setupSocketHandlers } from "./websocket";
import adminRoutes from "./routes/admin.js";

// Import separate route files
import userRoutes from "./routes/user.js";
import depositRoutes from "./routes/deposit.js";
import withdrawRoutes from "./routes/withdraw.js";
import walletRoutes from "./routes/wallet.js";

// Bot names for generating realistic players
const BOT_NAMES = [
  "Rajesh", "Priya", "Amit", "Sneha", "Vikram", "Anita", "Rohit", "Kavya",
  "Suresh", "Meera", "Arjun", "Divya", "Kiran", "Nisha", "Manoj", "Pooja"
];

// Game state
let currentGame: any = null;
let gameTimer: NodeJS.Timeout | null = null;
let priceUpdateTimer: NodeJS.Timeout | null = null;
let bots: any[] = [];
let currentPrice = 67890.45;
let priceHistory: Array<{ timestamp: string; price: string; id: string }> = [];

// Initialize price history
for (let i = 0; i < 20; i++) {
  priceHistory.push({
    id: `price-${Date.now()}-${i}`,
    price: (67890.45 + (Math.random() - 0.5) * 1000).toFixed(2),
    timestamp: new Date(Date.now() - (20 - i) * 5000).toISOString()
  });
}

// Start price updates
const startPriceUpdates = () => {
  if (priceUpdateTimer) clearInterval(priceUpdateTimer);
  priceUpdateTimer = setInterval(() => {
    const change = (Math.random() - 0.5) * 500; // -250 to +250
    currentPrice = Math.max(60000, currentPrice + change);

    priceHistory.push({
      id: `price-${Date.now()}`,
      price: currentPrice.toFixed(2),
      timestamp: new Date().toISOString()
    });

    // Keep only last 50 entries
    if (priceHistory.length > 50) {
      priceHistory.shift();
    }
  }, 5000); // Update every 5 seconds
};

const createNewGame = async () => {
  const gameId = `game-${Date.now()}`;

  currentGame = {
    id: gameId,
    phase: "betting",
    startTime: Date.now(),
    duration: 20000, // 20 seconds
    startPrice: currentPrice,
    endPrice: null,
    bets: []
  };

  // Start betting phase
  console.log(`New game started: ${gameId}`);

  // Generate some bot bets
  setTimeout(() => {
    generateBotBets();
  }, Math.random() * 5000); // Random delay up to 5 seconds

  // End betting phase after 20 seconds
  gameTimer = setTimeout(async () => {
    if (currentGame) {
      currentGame.phase = "calculating";

      // Generate final price after 5 seconds
      setTimeout(async () => {
        const finalPrice = generateRandomPrice();
        currentGame.endPrice = finalPrice;
        currentGame.phase = "finished";

        // Process all bets
        await processBets();

        // Start new game after 5 seconds
        setTimeout(() => {
          createNewGame();
        }, 5000);
      }, 5000);
    }
  }, 20000);
};

const generateRandomPrice = () => {
  const change = (Math.random() - 0.5) * 1000; // -500 to +500 change
  return Math.max(60000, currentPrice + change);
};

const generateBotBets = () => {
  if (!currentGame) return;

  const numBots = Math.floor(Math.random() * 8) + 3; // 3-10 bots

  for (let i = 0; i < numBots; i++) {
    const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const side = Math.random() > 0.5 ? "up" : "down";
    const amount = [10, 25, 50, 100, 250][Math.floor(Math.random() * 5)];

    currentGame.bets.push({
      id: `bot-bet-${Date.now()}-${i}`,
      userId: botName,
      side,
      amount,
      isBot: true,
      botName: botName,
      timestamp: Date.now()
    });
  }
};

let gameHistory: any[] = [];

const processBets = async () => {
  if (!currentGame || !currentGame.endPrice) return;

  // Real user betting logic - opposite result for single real user
  const realUserBets = currentGame.bets.filter((bet: any) => !bet.isBot);
  
  let winSide = "up"; // Default
  
  if (realUserBets.length > 0) {
    // Calculate total amounts on each side for real users only
    const upTotal = realUserBets.filter(bet => bet.side === "up").reduce((sum, bet) => sum + bet.amount, 0);
    const downTotal = realUserBets.filter(bet => bet.side === "down").reduce((sum, bet) => sum + bet.amount, 0);
    
    if (upTotal > 0 && downTotal > 0) {
      // If user bet on both sides, let the smaller side win
      winSide = upTotal < downTotal ? "up" : "down";
    } else if (upTotal > 0) {
      // User only bet UP, so make DOWN win (70% chance to lose)
      winSide = Math.random() > 0.3 ? "down" : "up";
    } else if (downTotal > 0) {
      // User only bet DOWN, so make UP win (70% chance to lose)
      winSide = Math.random() > 0.3 ? "up" : "down";
    }
  }

  // Process real user bets only
  for (const bet of realUserBets) {
    try {
      const user = await User.findOne({ username: bet.userId });
      if (user) {
        const isWin = bet.side === winSide;
        const winAmount = isWin ? bet.amount * 1.95 : 0;

        if (isWin) {
          user.balance += winAmount;
          await user.save();
        }

        // Add to game history
        const historyEntry = {
          id: `history-${Date.now()}-${Math.random()}`,
          gameId: currentGame.id,
          userId: bet.userId,
          side: bet.side,
          amount: bet.amount,
          isWin,
          winAmount,
          startPrice: currentGame.startPrice,
          endPrice: currentGame.endPrice,
          createdAt: new Date().toISOString(),
          timestamp: Date.now()
        };
        
        gameHistory.unshift(historyEntry);
        
        // Keep only last 50 entries
        if (gameHistory.length > 50) {
          gameHistory = gameHistory.slice(0, 50);
        }

        // Save bet details
        bet.isWin = isWin;
        bet.winAmount = winAmount;
        bet.gameId = currentGame.id;
        bet.finalPrice = currentGame.endPrice;
      }
    } catch (error) {
      console.error("Error processing bet:", error);
    }
  }
};



export function registerRoutes(app: Express): Server {
  const server = createServer(app);

  // Initialize price history and game
  // initializePriceHistory(); // This is now handled by the for loop above.

  // Start price updates every 5 seconds
  startPriceUpdates();

  // Use the separate route modules
  app.use("/api/user", userRoutes);
  app.use("/api/transactions/deposit", depositRoutes);
  app.use("/api/transactions/withdraw", withdrawRoutes);
  app.use("/api/wallet", walletRoutes);
  app.use("/api/admin", adminRoutes);

  // Health check endpoint
  app.get("/api/healthcheck", (req, res) => {
    return res.json({ ok: true });
  });

  // Current user endpoint
  app.get("/api/user/current", async (req, res) => {
    try {
      const { username } = req.query;

      if (!username) {
        return res.status(400).json({ message: "Username required" });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        _id: user._id,
        username: user.username,
        balance: user.balance,
        userId: user._id
      });
    } catch (error) {
      console.error("Error getting current user:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Remove duplicate login endpoint - using route modules instead

  // Game endpoints
  app.get("/api/game/current", (req, res) => {
    if (currentGame) {
      const timeElapsed = Date.now() - currentGame.startTime;
      const timeRemaining = Math.max(0, Math.floor((currentGame.duration - timeElapsed) / 1000));

      res.json({
        ...currentGame,
        timeRemaining,
        currentPrice: currentPrice.toFixed(2)
      });
    } else {
      res.json({ phase: "waiting", timeRemaining: 0 });
    }
  });

  // Price history endpoint
  app.get("/api/price/history", (req, res) => {
    res.json(priceHistory);
  });

  // Current bets endpoint
  app.get("/api/bets/current", (req, res) => {
    if (currentGame && currentGame.bets) {
      res.json(currentGame.bets);
    } else {
      res.json([]);
    }
  });

  // Bet history endpoint
  app.get("/api/bets/history", (req, res) => {
    res.json(gameHistory || []);
  });

  // Place bet endpoint
  app.post("/api/bets", async (req, res) => {
    try {
      const { side, amount, userId } = req.body;

      if (!currentGame || currentGame.phase !== "betting") {
        return res.status(400).json({ message: "Betting is not available right now" });
      }

      // Try to find user by both _id and username
      const user = await User.findOne({ 
        $or: [
          { _id: userId },
          { username: userId }
        ]
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const betAmount = parseFloat(amount);
      if (user.balance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      user.balance -= betAmount;
      await user.save();

      const bet = {
        id: `bet-${Date.now()}`,
        userId: user.username,
        side,
        amount: betAmount,
        isBot: false,
        timestamp: Date.now()
      };

      currentGame.bets.push(bet);

      res.json({ message: "Bet placed successfully", bet });
    } catch (error) {
      console.error("Error placing bet:", error);
      res.status(500).json({ message: "Failed to place bet" });
    }
  });

  // Start the first game
  createNewGame();

  return server;
}
