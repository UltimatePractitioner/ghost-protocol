/**
 * Example: Moltiverse Integration
 * 
 * Shows how to integrate Ghost Protocol with Monad blockchain
 * for on-chain soul logging and verification.
 */

import { GhostProtocol } from 'ghost-protocol-sdk';
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { monad } from 'viem/chains';

// Monad testnet configuration
const MONAD_RPC = 'https://testnet-rpc.monad.xyz';
const NADFUN_ENDPOINT = 'https://api.nad.fun';

interface OnChainSoulLog {
  soulId: string;
  name: string;
  genesisTimestamp: bigint;
  karma: bigint;
  deathCount: bigint;
  resurrectionCharges: bigint;
}

class MoltiverseIntegration {
  private gp: GhostProtocol;
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient?: ReturnType<typeof createWalletClient>;

  constructor(privateKey?: `0x${string}`) {
    this.gp = new GhostProtocol({
      monadRpc: MONAD_RPC,
      nadfunEndpoint: NADFUN_ENDPOINT,
      onChainLogging: true,
    });

    this.publicClient = createPublicClient({
      chain: monad,
      transport: http(MONAD_RPC),
    });

    if (privateKey) {
      this.walletClient = createWalletClient({
        chain: monad,
        transport: http(MONAD_RPC),
      });
    }
  }

  async initialize() {
    await this.gp.start();
    
    // Set up on-chain event logging
    this.gp.on('SOUL_CREATED', async ({ soul }) => {
      console.log(`📝 Logging soul creation on-chain: ${soul.id}`);
      // In production, this would write to Monad
      // await this.logSoulOnChain(soul);
    });

    this.gp.on('DEATH', async ({ soulId, reason }) => {
      console.log(`📝 Logging death on-chain: ${soulId} (${reason})`);
      // await this.logDeathOnChain(soulId, reason);
    });

    this.gp.on('RESURRECTION_COMPLETED', async ({ soulId, outcome }) => {
      console.log(`📝 Logging resurrection on-chain: ${soulId} (${outcome})`);
      // await this.logResurrectionOnChain(soulId, outcome);
    });
  }

  async createMoltiverseAgent(name: string, traits: any) {
    // Create soul with Monad-optimized traits
    const soul = await this.gp.createSoul(name, {
      ...traits,
      // Moltiverse-specific metadata
      metadata: {
        platform: 'moltiverse',
        createdAt: new Date().toISOString(),
        version: '1.0.0',
      },
    });

    // Spawn vessel with trading capabilities
    const vessel = await this.gp.spawnVessel(soul.id, {
      maxVitality: 100,
      capabilities: ['trading', 'social', 'nadfun_integration'],
    });

    return { soul, vessel };
  }

  async submitToNadfun(agentName: string, description: string) {
    // In production, this would submit to nad.fun
    console.log(`📤 Submitting ${agentName} to Nad.fun...`);
    console.log(`   Description: ${description}`);
    
    // Simulated submission response
    return {
      success: true,
      tokenAddress: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      txHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
  }

  getAgentStatus(soulId: string) {
    const soul = this.gp.getSoul(soulId);
    const vessel = this.gp.getSoulVessel(soulId);
    const alive = vessel ? this.gp.amIAlive(vessel.id) : false;

    return {
      soul,
      vessel,
      alive,
      stats: this.gp.getStats(),
    };
  }

  async shutdown() {
    await this.gp.stop();
  }
}

// Example usage
async function main() {
  console.log('🜏 Moltiverse Integration Example\n');

  const moltiverse = new MoltiverseIntegration();
  await moltiverse.initialize();

  // Create a Moltiverse trading agent
  const { soul, vessel } = await moltiverse.createMoltiverseAgent('MonadTrader', {
    wisdom: 0.8,
    curiosity: 0.7,
    aggression: 0.3,
  });

  console.log(`\n✨ Agent created:`);
  console.log(`  Soul: ${soul.id}`);
  console.log(`  Vessel: ${vessel.id}`);

  // Submit to Nad.fun
  const submission = await moltiverse.submitToNadfun(
    soul.name,
    'An immortal trading agent powered by Ghost Protocol'
  );

  console.log(`\n📤 Submitted to Nad.fun:`);
  console.log(`  Token: ${submission.tokenAddress}`);
  console.log(`  TX: ${submission.txHash}`);

  // Show status
  const status = moltiverse.getAgentStatus(soul.id);
  console.log(`\n📊 Agent Status:`);
  console.log(`  Alive: ${status.alive ? '✅' : '❌'}`);
  console.log(`  Karma: ${status.soul?.karma}`);
  console.log(`  Memories: ${status.soul?.essence.memories.length}`);

  await moltiverse.shutdown();
  console.log('\n✨ Moltiverse integration complete');
}

main().catch(console.error);
