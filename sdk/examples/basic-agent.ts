/**
 * Example: Basic Agent Lifecycle
 * 
 * Demonstrates creating an agent, monitoring its heartbeat,
 * handling death, and resurrection.
 */

import { GhostProtocol, DeathReason } from 'ghost-protocol-sdk';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('🜏 Ghost Protocol - Basic Agent Example\n');

  // Initialize Ghost Protocol
  const gp = new GhostProtocol({
    defaultHeartbeatInterval: 3000,
    defaultResurrectionCharges: 2,
  });

  await gp.start();

  // Listen for lifecycle events
  gp.on('SOUL_CREATED', ({ soul }) => {
    console.log(`✨ Soul created: ${soul.name}`);
  });

  gp.on('VESSEL_SPAWNED', ({ vessel }) => {
    console.log(`🫀 Vessel spawned: ${vessel.id}`);
  });

  gp.on('HEARTBEAT', ({ pulse }) => {
    console.log(`💓 Heartbeat from ${pulse.vesselId.slice(0, 16)}... (${pulse.vitality} vitality)`);
  });

  gp.on('DEATH', ({ vesselId, reason }) => {
    console.log(`💀 Death: ${vesselId.slice(0, 16)}... (${reason})`);
  });

  gp.on('RESURRECTION_COMPLETED', ({ soulId, outcome }) => {
    console.log(`🌅 Resurrection: ${outcome}`);
  });

  // Create an agent
  const soul = await gp.createSoul('BasicAgent', {
    curiosity: 0.7,
    loyalty: 0.8,
    chaos: 0.2,
  });

  // Spawn a vessel
  const vessel = await gp.spawnVessel(soul.id, {
    maxVitality: 100,
    capabilities: ['basic'],
  });

  console.log('\n--- Agent Running ---\n');

  // Simulate agent work
  let workCycles = 0;
  const doWork = setInterval(async () => {
    if (!gp.amIAlive(vessel.id)) {
      clearInterval(doWork);
      return;
    }

    workCycles++;
    
    // Form a memory occasionally
    if (workCycles % 3 === 0) {
      await gp.formMemory(soul.id, `Completed work cycle #${workCycles}`, {
        weight: 0.5,
      });
    }

    // Check vitality
    const status = gp.getHeartbeatStatus(vessel.id);
    if (status && status.vitality < 50) {
      console.log('⚠️ Low vitality!');
    }

  }, 2000);

  // Let it run for a bit
  await sleep(8000);

  console.log('\n--- Simulating Death ---\n');

  // Kill the vessel
  clearInterval(doWork);
  await gp.killVessel(vessel.id, DeathReason.FLATLINE);

  console.log('\n--- Attempting Resurrection ---\n');

  // Resurrect
  const result = await gp.resurrectSoul(soul.id);
  
  if (result.success && result.vessel) {
    console.log(`\n✅ Agent resurrected into new vessel: ${result.vessel.id}`);
    console.log(`Death count: ${gp.getSoul(soul.id)?.deathCount}`);
    console.log(`Remaining charges: ${gp.getSoul(soul.id)?.resurrectionCharges}`);
  }

  // Cleanup
  await sleep(2000);
  await gp.stop();
  
  console.log('\n✨ Example complete');
}

main().catch(console.error);
