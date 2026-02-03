/**
 * Example: Trading Agent with Memories
 * 
 * A trading agent that learns from experience, forms memories,
 * and its karma affects resurrection chances.
 */

import { GhostProtocol, DeathReason } from 'ghost-protocol-sdk';

interface Trade {
  pair: string;
  amount: number;
  price: number;
  profit: number;
  timestamp: number;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

class TradingAgent {
  private gp: GhostProtocol;
  private soulId: string;
  private vesselId: string | null = null;
  private trades: Trade[] = [];

  constructor(gp: GhostProtocol, soulId: string) {
    this.gp = gp;
    this.soulId = soulId;
  }

  async spawn() {
    const vessel = await this.gp.spawnVessel(this.soulId, {
      maxVitality: 100,
      capabilities: ['trading', 'market_analysis'],
    });
    this.vesselId = vessel.id;
    console.log(`💰 Trading agent spawned: ${vessel.id.slice(0, 16)}...`);
  }

  async executeTrade(trade: Trade) {
    if (!this.vesselId || !this.gp.amIAlive(this.vesselId)) {
      console.log('❌ Cannot trade - agent is dead');
      return;
    }

    this.trades.push(trade);

    if (trade.profit > 0) {
      // Profitable trade - positive memory and karma
      await this.gp.formMemory(this.soulId, 
        `Profitable trade: ${trade.pair} +${trade.profit}%`,
        { weight: 0.8, emotionalValence: 0.6, isCore: trade.profit > 20 }
      );
      await this.gp.modifyKarma(this.soulId, 1);
      console.log(`💚 Profit! ${trade.pair} +${trade.profit}%`);
    } else {
      // Loss - negative memory but valuable
      await this.gp.formMemory(this.soulId,
        `Loss on ${trade.pair}: ${trade.profit}%`,
        { weight: 0.9, emotionalValence: -0.5 }
      );
      await this.gp.modifyKarma(this.soulId, -1);
      console.log(`❤️ Loss: ${trade.pair} ${trade.profit}%`);
    }

    // Pulse with current activity
    await this.gp.pulse(this.vesselId, {
      activity: `Trading ${trade.pair}`,
      vitality: 90 + Math.random() * 10,
    });
  }

  getStats() {
    const soul = this.gp.getSoul(this.soulId);
    const totalProfit = this.trades.reduce((sum, t) => sum + t.profit, 0);
    return {
      trades: this.trades.length,
      totalProfit,
      karma: soul?.karma || 0,
      memories: soul?.essence.memories.length || 0,
    };
  }

  async die(reason: DeathReason) {
    if (this.vesselId) {
      await this.gp.killVessel(this.vesselId, reason);
      this.vesselId = null;
    }
  }
}

async function main() {
  console.log('🜏 Trading Agent Example\n');

  const gp = new GhostProtocol({
    defaultResurrectionCharges: 2,
  });

  await gp.start();

  // Create trading agent with wisdom
  const soul = await gp.createSoul('TradeMaster', {
    wisdom: 0.9,
    curiosity: 0.7,
    aggression: 0.4,
  });

  const agent = new TradingAgent(gp, soul.id);
  await agent.spawn();

  // Simulate trading
  console.log('\n--- Trading Session ---\n');

  const trades: Trade[] = [
    { pair: 'ETH/MON', amount: 1.5, price: 2500, profit: 5.2, timestamp: Date.now() },
    { pair: 'BTC/MON', amount: 0.1, price: 42000, profit: -2.1, timestamp: Date.now() },
    { pair: 'ETH/MON', amount: 2.0, price: 2550, profit: 8.5, timestamp: Date.now() },
    { pair: 'SOL/MON', amount: 50, price: 98, profit: -5.3, timestamp: Date.now() },
    { pair: 'ETH/MON', amount: 1.0, price: 2600, profit: 12.3, timestamp: Date.now() },
  ];

  for (const trade of trades) {
    await agent.executeTrade(trade);
    await sleep(1000);
  }

  console.log('\n--- Stats ---');
  const stats = agent.getStats();
  console.log(`Trades: ${stats.trades}`);
  console.log(`Total Profit: ${stats.totalProfit.toFixed(2)}%`);
  console.log(`Karma: ${stats.karma}`);
  console.log(`Memories: ${stats.memories}`);

  // Simulate a catastrophic loss (death)
  console.log('\n--- Market Crash! ---\n');
  await agent.die(DeathReason.CATACLYSM);

  // Resurrection attempt
  console.log('--- Resurrection Attempt ---\n');
  const result = await gp.resurrectSoul(soul.id);
  
  console.log(`Outcome: ${result.outcome}`);
  console.log(`Success chance was improved by karma: ${stats.karma}`);

  if (result.outcome === 'partial' || result.outcome === 'corrupted') {
    console.log('\n⚠️ Some trading memories were lost in resurrection...');
  }

  const soulAfter = gp.getSoul(soul.id);
  console.log(`\nMemories after resurrection: ${soulAfter?.essence.memories.length}`);

  await gp.stop();
  console.log('\n✨ Trading example complete');
}

main().catch(console.error);
