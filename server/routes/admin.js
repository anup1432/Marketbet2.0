
import express from "express";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

const router = express.Router();

// Admin login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Hardcoded admin credentials for now
    if (username === "admin1432" && password === "Admin1432") {
      res.json({ message: "Admin login successful" });
    } else {
      res.status(401).json({ message: "Invalid admin credentials" });
    }
  } catch (error) {
    console.error("Error in admin login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all pending transactions
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// Update transaction status
router.patch("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // If approving a deposit, add to user balance
    if (status === 'approved' && transaction.type === 'deposit') {
      const user = await User.findOne({ username: transaction.userId });
      if (user) {
        user.balance += transaction.amount;
        await user.save();
      }
    }

    // If approving a withdrawal, deduct from user balance (if not already done)
    if (status === 'approved' && transaction.type === 'withdraw') {
      const user = await User.findOne({ username: transaction.userId });
      if (user && user.balance >= transaction.amount) {
        user.balance -= transaction.amount;
        await user.save();
      }
    }

    transaction.status = status;
    await transaction.save();

    res.json({ message: "Transaction updated successfully", transaction });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "Failed to update transaction" });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get recent activity
router.get("/recent-activity", async (req, res) => {
  try {
    const recentActivity = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(4);
    res.json(recentActivity);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
});

export default router;
