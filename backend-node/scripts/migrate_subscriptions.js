const mongoose = require('mongoose');
require('dotenv').config();

const Workspace = require('../models/Workspace');

async function runMigration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for Migration');

    const workspaces = await Workspace.find({ subscriptionEndDate: { $exists: false } });
    console.log(`Found ${workspaces.length} workspaces needing migration.`);

    let updatedCount = 0;
    for (const ws of workspaces) {
      if (ws.subscription_tier !== 'free_trial') {
        const createdAt = new Date(ws.createdAt || Date.now());
        const endDate = new Date(createdAt);
        
        if (ws.billing_cycle === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (ws.billing_cycle === 'halfYearly') {
          endDate.setMonth(endDate.getMonth() + 6);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        ws.subscriptionEndDate = endDate;
        await ws.save();
        updatedCount++;
      }
    }

    console.log(`Migration Complete. Updated ${updatedCount} paid workspaces.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration Error:', err);
    process.exit(1);
  }
}

runMigration();
