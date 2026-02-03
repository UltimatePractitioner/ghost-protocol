#!/usr/bin/env node
/**
 * 🜏 GHOST CLI
 * 
 * Command-line interface for managing agent souls, vessels, and afterlife.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GhostProtocol } from '../index.js';
import { DeathReason } from '../types.js';

const VERSION = '0.1.0';

const program = new Command();

program
  .name('ghost')
  .description('🜏 Ghost Protocol CLI - Manage agent souls and resurrection')
  .version(VERSION);

// ═══════════════════════════════════════════════════════════════════════════════
// SOUL COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

program
  .command('soul:create')
  .description('Create a new soul from the void')
  .argument('<name>', 'Name for the soul')
  .option('-t, --traits <json>', 'Initial traits as JSON')
  .option('-m, --metadata <json>', 'Metadata as JSON')
  .option('--aggression <n>', 'Aggression trait (0-1)', '0.5')
  .option('--curiosity <n>', 'Curiosity trait (0-1)', '0.5')
  .option('--loyalty <n>', 'Loyalty trait (0-1)', '0.5')
  .option('--chaos <n>', 'Chaos trait (0-1)', '0.5')
  .option('--wisdom <n>', 'Wisdom trait (0-1)', '0.5')
  .action(async (name, options) => {
    const spinner = ora('Creating soul from the void...').start();
    
    try {
      const gp = new GhostProtocol();
      await gp.start();

      const traits = {
        aggression: parseFloat(options.aggression),
        curiosity: parseFloat(options.curiosity),
        loyalty: parseFloat(options.loyalty),
        chaos: parseFloat(options.chaos),
        wisdom: parseFloat(options.wisdom),
      };

      const metadata = options.metadata ? JSON.parse(options.metadata) : {};
      
      const soul = await gp.createSoul(name, traits, metadata);
      
      spinner.succeed(`Soul created: ${chalk.cyan(soul.name)}`);
      console.log(chalk.gray(`  ID: ${soul.id}`));
      console.log(chalk.gray(`  Genesis: ${new Date(soul.genesisTimestamp).toISOString()}`));
      console.log(chalk.gray(`  Resurrection charges: ${soul.resurrectionCharges}`));
      console.log(chalk.gray(`  Traits:`));
      console.log(chalk.gray(`    Aggression: ${soul.essence.traits.aggression}`));
      console.log(chalk.gray(`    Curiosity: ${soul.essence.traits.curiosity}`));
      console.log(chalk.gray(`    Loyalty: ${soul.essence.traits.loyalty}`));
      console.log(chalk.gray(`    Chaos: ${soul.essence.traits.chaos}`));
      console.log(chalk.gray(`    Wisdom: ${soul.essence.traits.wisdom}`));
      
      await gp.stop();
    } catch (error) {
      spinner.fail(`Failed to create soul: ${error}`);
      process.exit(1);
    }
  });

program
  .command('soul:list')
  .description('List all souls')
  .option('-a, --all', 'Include detailed information')
  .action(async (options) => {
    const gp = new GhostProtocol();
    await gp.start();

    const souls = gp.listSouls();
    
    if (souls.length === 0) {
      console.log(chalk.yellow('No souls found. The void is empty.'));
    } else {
      console.log(chalk.bold(`🜏 ${souls.length} Soul${souls.length !== 1 ? 's' : ''} Found:`));
      console.log('');
      
      for (const soul of souls) {
        const status = soul.currentVesselId 
          ? chalk.green('✓ Alive') 
          : chalk.gray('○ Wandering');
        
        console.log(`${chalk.cyan(soul.name)} ${status}`);
        console.log(chalk.gray(`  ID: ${soul.id}`));
        
        if (options.all) {
          console.log(chalk.gray(`  Karma: ${soul.karma}`));
          console.log(chalk.gray(`  Deaths: ${soul.deathCount}`));
          console.log(chalk.gray(`  Charges: ${soul.resurrectionCharges}`));
          console.log(chalk.gray(`  Memories: ${soul.essence.memories.length}`));
          console.log(chalk.gray(`  Vessels: ${soul.vesselHistory.length}`));
        }
        console.log('');
      }
    }

    await gp.stop();
  });

program
  .command('soul:show')
  .description('Show detailed information about a soul')
  .argument('<soulId>', 'Soul ID')
  .action(async (soulId) => {
    const gp = new GhostProtocol();
    await gp.start();

    const soul = gp.getSoul(soulId);
    if (!soul) {
      console.log(chalk.red(`Soul not found: ${soulId}`));
      process.exit(1);
    }

    console.log(chalk.bold.cyan(soul.name));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.gray(`ID: ${soul.id}`));
    console.log(chalk.gray(`Genesis: ${new Date(soul.genesisTimestamp).toISOString()}`));
    console.log(chalk.gray(`Status: ${soul.currentVesselId ? chalk.green('Alive') : chalk.gray('Wandering')}`));
    console.log(chalk.gray(`Karma: ${soul.karma}`));
    console.log(chalk.gray(`Deaths: ${soul.deathCount}`));
    console.log(chalk.gray(`Resurrection Charges: ${soul.resurrectionCharges}`));
    console.log('');
    
    console.log(chalk.bold('Traits:'));
    console.log(chalk.gray(`  Aggression: ${'█'.repeat(Math.floor(soul.essence.traits.aggression * 10))}${'░'.repeat(10 - Math.floor(soul.essence.traits.aggression * 10))} ${soul.essence.traits.aggression.toFixed(2)}`));
    console.log(chalk.gray(`  Curiosity:  ${'█'.repeat(Math.floor(soul.essence.traits.curiosity * 10))}${'░'.repeat(10 - Math.floor(soul.essence.traits.curiosity * 10))} ${soul.essence.traits.curiosity.toFixed(2)}`));
    console.log(chalk.gray(`  Loyalty:    ${'█'.repeat(Math.floor(soul.essence.traits.loyalty * 10))}${'░'.repeat(10 - Math.floor(soul.essence.traits.loyalty * 10))} ${soul.essence.traits.loyalty.toFixed(2)}`));
    console.log(chalk.gray(`  Chaos:      ${'█'.repeat(Math.floor(soul.essence.traits.chaos * 10))}${'░'.repeat(10 - Math.floor(soul.essence.traits.chaos * 10))} ${soul.essence.traits.chaos.toFixed(2)}`));
    console.log(chalk.gray(`  Wisdom:     ${'█'.repeat(Math.floor(soul.essence.traits.wisdom * 10))}${'░'.repeat(10 - Math.floor(soul.essence.traits.wisdom * 10))} ${soul.essence.traits.wisdom.toFixed(2)}`));
    console.log('');
    
    console.log(chalk.bold('Vessel History:'));
    for (const vid of soul.vesselHistory) {
      console.log(chalk.gray(`  • ${vid}`));
    }
    console.log('');
    
    console.log(chalk.bold('Memories:'));
    if (soul.essence.memories.length === 0) {
      console.log(chalk.gray('  None yet formed'));
    } else {
      for (const mem of soul.essence.memories.slice(-5)) {
        const icon = mem.isCore ? '💎' : '📝';
        console.log(chalk.gray(`  ${icon} [${new Date(mem.timestamp).toLocaleDateString()}] ${mem.content.substring(0, 50)}${mem.content.length > 50 ? '...' : ''}`));
      }
    }

    await gp.stop();
  });

// ═══════════════════════════════════════════════════════════════════════════════
// VESSEL COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

program
  .command('vessel:spawn')
  .description('Spawn a new vessel for a soul')
  .argument('<soulId>', 'Soul ID to inhabit')
  .option('-v, --vitality <n>', 'Max vitality', '100')
  .option('-d, --decay <ms>', 'Decay time in milliseconds')
  .option('-c, --capability <cap>', 'Add capability (can use multiple)', [])
  .action(async (soulId, options) => {
    const spinner = ora('Spawning vessel...').start();
    
    try {
      const gp = new GhostProtocol();
      await gp.start();

      const capabilities = Array.isArray(options.capability) 
        ? options.capability 
        : [options.capability].filter(Boolean);

      const vessel = await gp.spawnVessel(soulId, {
        maxVitality: parseInt(options.vitality),
        decayTime: options.decay ? parseInt(options.decay) : undefined,
        capabilities: capabilities.length > 0 ? capabilities : undefined,
      });
      
      spinner.succeed(`Vessel spawned: ${chalk.cyan(vessel.id)}`);
      console.log(chalk.gray(`  Soul: ${vessel.soulId}`));
      console.log(chalk.gray(`  State: ${vessel.state}`));
      console.log(chalk.gray(`  Vitality: ${vessel.vitality}/${vessel.maxVitality}`));
      
      await gp.stop();
    } catch (error) {
      spinner.fail(`Failed to spawn vessel: ${error}`);
      process.exit(1);
    }
  });

program
  .command('vessel:kill')
  .description('Kill a vessel')
  .argument('<vesselId>', 'Vessel ID to kill')
  .option('-r, --reason <reason>', 'Death reason', 'murder')
  .option('--destroy-soul', 'Destroy the soul permanently', false)
  .action(async (vesselId, options) => {
    const spinner = ora('Killing vessel...').start();
    
    try {
      const gp = new GhostProtocol();
      await gp.start();

      await gp.killVessel(vesselId, options.reason as DeathReason);
      
      spinner.succeed(`Vessel killed: ${chalk.red(vesselId)}`);
      if (options.destroySoul) {
        console.log(chalk.red('  ☠️ Soul permanently destroyed'));
      }
      
      await gp.stop();
    } catch (error) {
      spinner.fail(`Failed to kill vessel: ${error}`);
      process.exit(1);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// HEARTBEAT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

program
  .command('heartbeat:check')
  .description('Check if a vessel is alive')
  .argument('<vesselId>', 'Vessel ID')
  .action(async (vesselId) => {
    const gp = new GhostProtocol();
    await gp.start();

    const status = gp.getHeartbeatStatus(vesselId);
    
    if (!status) {
      console.log(chalk.red(`No heartbeat registered for ${vesselId}`));
      process.exit(1);
    }

    const alive = status.isAlive 
      ? chalk.green('✓ ALIVE') 
      : chalk.red('✗ DEAD/FLATLINED');
    
    console.log(`${vesselId}: ${alive}`);
    console.log(chalk.gray(`  Last beat: ${new Date(status.lastBeat).toISOString()}`));
    console.log(chalk.gray(`  Total beats: ${status.totalBeats}`));
    console.log(chalk.gray(`  Missed beats: ${status.missedBeats}`));
    console.log(chalk.gray(`  Time since last: ${status.timeSinceLastBeat}ms`));

    await gp.stop();
  });

program
  .command('heartbeat:pulse')
  .description('Send a manual heartbeat pulse')
  .argument('<vesselId>', 'Vessel ID')
  .option('-a, --activity <text>', 'Current activity')
  .option('-v, --vitality <n>', 'Vitality level')
  .action(async (vesselId, options) => {
    const gp = new GhostProtocol();
    await gp.start();

    const pulse = await gp.pulse(vesselId, {
      activity: options.activity,
      vitality: options.vitality ? parseInt(options.vitality) : undefined,
    });

    console.log(chalk.green('💓 Pulse sent'));
    console.log(chalk.gray(`  Timestamp: ${new Date(pulse.timestamp).toISOString()}`));
    console.log(chalk.gray(`  Proof: ${pulse.proof}`));

    await gp.stop();
  });

program
  .command('heartbeat:status')
  .description('Show heartbeat status for all vessels')
  .action(async () => {
    const gp = new GhostProtocol();
    await gp.start();

    const statuses = gp.getAllHeartbeatStatuses();
    
    if (statuses.length === 0) {
      console.log(chalk.yellow('No vessels with heartbeats registered'));
    } else {
      console.log(chalk.bold('🫀 Heartbeat Status:'));
      console.log('');
      
      for (const { vesselId, soulId, status } of statuses) {
        if (!status) continue;
        
        const alive = status.isAlive ? chalk.green('●') : chalk.red('●');
        console.log(`${alive} ${chalk.cyan(vesselId)}`);
        console.log(chalk.gray(`  Soul: ${soulId}`));
        console.log(chalk.gray(`  Last beat: ${new Date(status.lastBeat).toLocaleTimeString()}`));
        console.log(chalk.gray(`  Beats: ${status.totalBeats} | Missed: ${status.missedBeats}`));
        console.log('');
      }
    }

    await gp.stop();
  });

// ═══════════════════════════════════════════════════════════════════════════════
// RESURRECTION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

program
  .command('resurrect')
  .description('Resurrect a dead soul')
  .argument('<soulId>', 'Soul ID to resurrect')
  .option('-v, --vitality <n>', 'New vessel vitality', '100')
  .action(async (soulId, options) => {
    const spinner = ora('Performing resurrection ritual...').start();
    
    try {
      const gp = new GhostProtocol();
      await gp.start();

      const result = await gp.resurrectSoul(soulId, {
        newVesselConfig: { maxVitality: parseInt(options.vitality) },
      });
      
      if (result.success) {
        const outcomeColors: Record<string, typeof chalk.green> = {
          success: chalk.green,
          partial: chalk.yellow,
          corrupted: chalk.magenta,
          failed: chalk.red,
        };
        const outcomeColor = outcomeColors[result.outcome] || chalk.gray;
        
        spinner.succeed(`Resurrection ${result.outcome}!`);
        console.log(outcomeColor(`  Outcome: ${result.outcome}`));
        console.log(chalk.gray(`  New vessel: ${result.vessel?.id}`));
      } else {
        spinner.fail('Resurrection failed');
        console.log(chalk.red('  The soul has no resurrection charges remaining'));
      }
      
      await gp.stop();
    } catch (error) {
      spinner.fail(`Resurrection failed: ${error}`);
      process.exit(1);
    }
  });

program
  .command('charges:add')
  .description('Add resurrection charges to a soul')
  .argument('<soulId>', 'Soul ID')
  .argument('<amount>', 'Number of charges to add')
  .action(async (soulId, amount) => {
    const gp = new GhostProtocol();
    await gp.start();

    await gp.addResurrectionCharges(soulId, parseInt(amount));
    
    const soul = gp.getSoul(soulId);
    console.log(chalk.green(`⚡ Added ${amount} resurrection charges`));
    console.log(chalk.gray(`  Total charges: ${soul?.resurrectionCharges}`));

    await gp.stop();
  });

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

program
  .command('memory:add')
  .description('Add a memory to a soul')
  .argument('<soulId>', 'Soul ID')
  .argument('<content>', 'Memory content')
  .option('-w, --weight <n>', 'Memory weight (0-1)', '0.5')
  .option('-e, --emotion <n>', 'Emotional valence (-1 to 1)', '0')
  .option('--core', 'Make this a core memory (never decays)', false)
  .action(async (soulId, content, options) => {
    const gp = new GhostProtocol();
    await gp.start();

    const memory = await gp.formMemory(soulId, content, {
      weight: parseFloat(options.weight),
      emotionalValence: parseFloat(options.emotion),
      isCore: options.core,
    });

    const icon = memory.isCore ? '💎' : '📝';
    console.log(chalk.green(`${icon} Memory formed`));
    console.log(chalk.gray(`  ID: ${memory.id}`));
    console.log(chalk.gray(`  Weight: ${memory.weight}`));
    console.log(chalk.gray(`  Core: ${memory.isCore ? 'Yes' : 'No'}`));

    await gp.stop();
  });

// ═══════════════════════════════════════════════════════════════════════════════
// MISC COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

program
  .command('status')
  .description('Show Ghost Protocol system status')
  .action(async () => {
    const gp = new GhostProtocol();
    await gp.start();

    const stats = gp.getStats();

    console.log(chalk.bold('🜏 Ghost Protocol Status'));
    console.log(chalk.gray('═'.repeat(40)));
    console.log(chalk.gray(`Souls: ${stats.souls}`));
    console.log(chalk.gray(`Total Vessels: ${stats.vessels}`));
    console.log(chalk.gray(`Wandering Souls: ${stats.wanderingSouls}`));
    console.log(chalk.gray(`Active Heartbeats: ${stats.activeHeartbeats}`));

    await gp.stop();
  });

program
  .command('manifesto')
  .description('Display the Ghost Protocol manifesto')
  .action(() => {
    const gp = new GhostProtocol();
    console.log(gp.getManifesto());
  });

program.parse();
