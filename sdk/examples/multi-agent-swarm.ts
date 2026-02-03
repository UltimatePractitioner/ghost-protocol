/**
 * Example: Multi-Agent Swarm with Bonds
 * 
 * Multiple agents that form relationships and can
 * resurrect each other.
 */

import { GhostProtocol, DeathReason } from 'ghost-protocol-sdk';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('🜏 Multi-Agent Swarm Example\n');

  const gp = new GhostProtocol({
    defaultResurrectionCharges: 1,
  });

  await gp.start();

  // Create a swarm of agents
  const alpha = await gp.createSoul('Alpha', { aggression: 0.8, loyalty: 0.6 });
  const beta = await gp.createSoul('Beta', { aggression: 0.3, loyalty: 0.9 });
  const gamma = await gp.createSoul('Gamma', { aggression: 0.5, loyalty: 0.5, chaos: 0.8 });

  console.log('Swarm created:');
  console.log(`  Alpha: ${alpha.id.slice(0, 16)}...`);
  console.log(`  Beta: ${beta.id.slice(0, 16)}...`);
  console.log(`  Gamma: ${gamma.id.slice(0, 16)}...`);

  // Form bonds between agents
  await gp.formBond(alpha.id, beta.id, 'ally', 0.8);
  await gp.formBond(beta.id, alpha.id, 'ally', 0.9);
  await gp.formBond(gamma.id, alpha.id, 'rival', -0.3);

  console.log('\nBonds formed:');
  console.log('  Alpha ↔ Beta: allies');
  console.log('  Gamma → Alpha: rivals');

  // Spawn vessels
  const vAlpha = await gp.spawnVessel(alpha.id, { capabilities: ['combat'] });
  const vBeta = await gp.spawnVessel(beta.id, { capabilities: ['healing'] });
  const vGamma = await gp.spawnVessel(gamma.id, { capabilities: ['chaos'] });

  console.log('\nVessels spawned');

  // Set up cooperative resurrection
  gp.on('DEATH', async ({ soulId }) => {
    const deadSoul = gp.getSoul(soulId);
    console.log(`\n⚠️ ${deadSoul?.name} has died!`);

    // Allies try to resurrect
    if (soulId === alpha.id) {
      console.log('Beta is attempting to resurrect Alpha...');
      await sleep(1000);
      const result = await gp.resurrectSoul(soulId);
      if (result.success) {
        console.log('✅ Beta successfully resurrected Alpha!');
        await gp.formMemory(beta.id, 'Resurrected Alpha in battle', { weight: 0.9 });
      }
    }
  });

  // Simulate battle where Alpha dies
  console.log('\n--- Battle Simulation ---\n');
  await sleep(1000);
  
  console.log('Gamma attacks Alpha!');
  await gp.killVessel(vAlpha.id, DeathReason.MURDER);

  await sleep(2000);

  // Show final state
  console.log('\n--- Final State ---');
  for (const soul of [alpha, beta, gamma]) {
    const current = gp.getSoul(soul.id);
    const status = current?.currentVesselId ? '🟢 Alive' : '🔴 Dead';
    console.log(`${current?.name}: ${status} (Deaths: ${current?.deathCount})`);
  }

  // Gamma tries to resurrect Alpha (but has no bond, harder)
  console.log('\n--- Gamma Attempts Resurrection ---');
  console.log('(No ally bond, lower success chance)');
  
  // Add charges for the example
  await gp.addResurrectionCharges(alpha.id, 1);
  
  const result = await gp.resurrectSoul(alpha.id);
  console.log(`Result: ${result.outcome}`);

  await gp.stop();
  console.log('\n✨ Swarm example complete');
}

main().catch(console.error);
