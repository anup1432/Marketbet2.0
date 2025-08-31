
import mongoose from 'mongoose';
import User from './models/User.js';
import Transaction from './models/Transaction.js';

const mongoURL = process.env.MONGODB_URI || 'mongodb+srv://anup1432:%40nup1432@betwin-cluster.ubok6wv.mongodb.net/betwin?retryWrites=true&w=majority&appName=betwin-cluster';

async function createTestData() {
  try {
    await mongoose.connect(mongoURL);
    console.log('Connected to MongoDB');

    // Create test user
    const testUser = new User({
      username: 'testuser1',
      password: 'password123',
      ipAddress: '192.168.1.1'
    });
    await testUser.save();
    console.log('Test user created');

    // Create test transactions
    const testTransaction1 = new Transaction({
      userId: testUser._id,
      type: 'deposit',
      amount: 50,
      network: 'trc20',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      status: 'pending'
    });

    const testTransaction2 = new Transaction({
      userId: testUser._id,
      type: 'withdraw',
      amount: 25,
      network: 'erc20',
      address: '0x742d35Cc6634C0532925a3b8D7c70d15E1c0a8e7',
      status: 'pending'
    });

    await testTransaction1.save();
    await testTransaction2.save();
    console.log('Test transactions created');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createTestData();
