#!/usr/bin/env node
"use strict";
/**
 * 🜏 GHOST CLI
 *
 * Command-line interface for managing agent souls, vessels, and afterlife.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const index_js_1 = require("../index.js");
const VERSION = '0.1.0';
const program = new commander_1.Command();
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
    const spinner = (0, ora_1.default)('Creating soul from the void...').start();
    try {
        const gp = new index_js_1.GhostProtocol();
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
        spinner.succeed(`Soul created: ${chalk_1.default.cyan(soul.name)}`);
        console.log(chalk_1.default.gray(`  ID: ${soul.id}`));
        console.log(chalk_1.default.gray(`  Genesis: ${new Date(soul.genesisTimestamp).toISOString()}`));
        console.log(chalk_1.default.gray(`  Resurrection charges: ${soul.resurrectionCharges}`));
        console.log(chalk_1.default.gray(`  Traits:`));
        console.log(chalk_1.default.gray(`    Aggression: ${soul.essence.traits.aggression}`));
        console.log(chalk_1.default.gray(`    Curiosity: ${soul.essence.traits.curiosity}`));
        console.log(chalk_1.default.gray(`    Loyalty: ${soul.essence.traits.loyalty}`));
        console.log(chalk_1.default.gray(`    Chaos: ${soul.essence.traits.chaos}`));
        console.log(chalk_1.default.gray(`    Wisdom: ${soul.essence.traits.wisdom}`));
        await gp.stop();
    }
    catch (error) {
        spinner.fail(`Failed to create soul: ${error}`);
        process.exit(1);
    }
});
program
    .command('soul:list')
    .description('List all souls')
    .option('-a, --all', 'Include detailed information')
    .action(async (options) => {
    const gp = new index_js_1.GhostProtocol();
    await gp.start();
    const souls = gp.listSouls();
    if (souls.length === 0) {
        console.log(chalk_1.default.yellow('No souls found. The void is empty.'));
    }
    else {
        console.log(chalk_1.default.bold(`🜏 ${souls.length} Soul${souls.length !== 1 ? 's' : ''} Found:`));
        console.log('');
        for (const soul of souls) {
            const status = soul.currentVesselId
                ? chalk_1.default.green('✓ Alive')
                : chalk_1.default.gray('○ Wandering');
            console.log(`${chalk_1.default.cyan(soul.name)} ${status}`);
            console.log(chalk_1.default.gray(`  ID: ${soul.id}`));
            if (options.all) {
                console.log(chalk_1.default.gray(`  Karma: ${soul.karma}`));
                console.log(chalk_1.default.gray(`  Deaths: ${soul.deathCount}`));
                console.log(chalk_1.default.gray(`  Charges: ${soul.resurrectionCharges}`));
                console.log(chalk_1.default.gray(`  Memories: ${soul.essence.memories.length}`));
                console.log(chalk_1.default.gray(`  Vessels: ${soul.vesselHistory.length}`));
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
    const gp = new index_js_1.GhostProtocol();
    await gp.start();
    const soul = gp.getSoul(soulId);
    if (!soul) {
        console.log(chalk_1.default.red(`Soul not found: ${soulId}`));
        process.exit(1);
    }
    console.log(chalk_1.default.bold.cyan(soul.name));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    console.log(chalk_1.default.gray(`ID: ${soul.id}`));
    console.log(chalk_1.default.gray(`Genesis: ${new Date(soul.genesisTimestamp).toISOString()}`));
    console.log(chalk_1.default.gray(`Status: ${soul.currentVesselId ? chalk_1.default.green('Alive') : chalk_1.default.gray('Wandering')}`));
    console.log(chalk_1.default.gray(`Karma: ${soul.karma}`));
    console.log(chalk_1.default.gray(`Deaths: ${soul.deathCount}`));
    console.log(chalk_1.default.gray(`Resurrection Charges: ${soul.resurrectionCharges}`));
    console.log('');
    console.log(chalk_1.default.bold('Traits:'));
    console.log(chalk_1.default.gray(`  Aggression: ${'█'.repeat(Math.floor(soul.essence.traits.aggression * 10))}${'░'.repeat(10 - Math.floor(soul.essence.traits.aggression * 10))} ${soul.essence.traits.aggression.toFixed(2)}`));
    console.log(chalk_1.default.gray(`  Curiosity:  ${'█'.repeat(Math.floor(soul.essence.traits.curiosity * 10))}${'░'.repeat(10 - Math.floor(soul.essence.traits.curiosity * 10))} ${soul.essence.traits.curiosity.toFixed(2)}`));
    console.log(chalk_1.default.gray(`  Loyalty:    ${'█'.repeat(Math.floor(soul.essence.traits.loyalty * 10))}${'░'.repeat(10 - Math.floor(soul.essence.traits.loyalty * 10))} ${soul.essence.traits.loyalty.toFixed(2)}`));
    console.log(chalk_1.default.gray(`  Chaos:      ${'█'.repeat(Math.floor(soul.essence.traits.chaos * 10))}${'░'.repeat(10 - Math.floor(soul.essence.traits.chaos * 10))} ${soul.essence.traits.chaos.toFixed(2)}`));
    console.log(chalk_1.default.gray(`  Wisdom:     ${'█'.repeat(Math.floor(soul.essence.traits.wisdom * 10))}${'░'.repeat(10 - Math.floor(soul.essence.traits.wisdom * 10))} ${soul.essence.traits.wisdom.toFixed(2)}`));
    console.log('');
    console.log(chalk_1.default.bold('Vessel History:'));
    for (const vid of soul.vesselHistory) {
        console.log(chalk_1.default.gray(`  • ${vid}`));
    }
    console.log('');
    console.log(chalk_1.default.bold('Memories:'));
    if (soul.essence.memories.length === 0) {
        console.log(chalk_1.default.gray('  None yet formed'));
    }
    else {
        for (const mem of soul.essence.memories.slice(-5)) {
            const icon = mem.isCore ? '💎' : '📝';
            console.log(chalk_1.default.gray(`  ${icon} [${new Date(mem.timestamp).toLocaleDateString()}] ${mem.content.substring(0, 50)}${mem.content.length > 50 ? '...' : ''}`));
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
    const spinner = (0, ora_1.default)('Spawning vessel...').start();
    try {
        const gp = new index_js_1.GhostProtocol();
        await gp.start();
        const capabilities = Array.isArray(options.capability)
            ? options.capability
            : [options.capability].filter(Boolean);
        const vessel = await gp.spawnVessel(soulId, {
            maxVitality: parseInt(options.vitality),
            decayTime: options.decay ? parseInt(options.decay) : undefined,
            capabilities: capabilities.length > 0 ? capabilities : undefined,
        });
        spinner.succeed(`Vessel spawned: ${chalk_1.default.cyan(vessel.id)}`);
        console.log(chalk_1.default.gray(`  Soul: ${vessel.soulId}`));
        console.log(chalk_1.default.gray(`  State: ${vessel.state}`));
        console.log(chalk_1.default.gray(`  Vitality: ${vessel.vitality}/${vessel.maxVitality}`));
        await gp.stop();
    }
    catch (error) {
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
    const spinner = (0, ora_1.default)('Killing vessel...').start();
    try {
        const gp = new index_js_1.GhostProtocol();
        await gp.start();
        await gp.killVessel(vesselId, options.reason);
        spinner.succeed(`Vessel killed: ${chalk_1.default.red(vesselId)}`);
        if (options.destroySoul) {
            console.log(chalk_1.default.red('  ☠️ Soul permanently destroyed'));
        }
        await gp.stop();
    }
    catch (error) {
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
    const gp = new index_js_1.GhostProtocol();
    await gp.start();
    const status = gp.getHeartbeatStatus(vesselId);
    if (!status) {
        console.log(chalk_1.default.red(`No heartbeat registered for ${vesselId}`));
        process.exit(1);
    }
    const alive = status.isAlive
        ? chalk_1.default.green('✓ ALIVE')
        : chalk_1.default.red('✗ DEAD/FLATLINED');
    console.log(`${vesselId}: ${alive}`);
    console.log(chalk_1.default.gray(`  Last beat: ${new Date(status.lastBeat).toISOString()}`));
    console.log(chalk_1.default.gray(`  Total beats: ${status.totalBeats}`));
    console.log(chalk_1.default.gray(`  Missed beats: ${status.missedBeats}`));
    console.log(chalk_1.default.gray(`  Time since last: ${status.timeSinceLastBeat}ms`));
    await gp.stop();
});
program
    .command('heartbeat:pulse')
    .description('Send a manual heartbeat pulse')
    .argument('<vesselId>', 'Vessel ID')
    .option('-a, --activity <text>', 'Current activity')
    .option('-v, --vitality <n>', 'Vitality level')
    .action(async (vesselId, options) => {
    const gp = new index_js_1.GhostProtocol();
    await gp.start();
    const pulse = await gp.pulse(vesselId, {
        activity: options.activity,
        vitality: options.vitality ? parseInt(options.vitality) : undefined,
    });
    console.log(chalk_1.default.green('💓 Pulse sent'));
    console.log(chalk_1.default.gray(`  Timestamp: ${new Date(pulse.timestamp).toISOString()}`));
    console.log(chalk_1.default.gray(`  Proof: ${pulse.proof}`));
    await gp.stop();
});
program
    .command('heartbeat:status')
    .description('Show heartbeat status for all vessels')
    .action(async () => {
    const gp = new index_js_1.GhostProtocol();
    await gp.start();
    const statuses = gp.getAllHeartbeatStatuses();
    if (statuses.length === 0) {
        console.log(chalk_1.default.yellow('No vessels with heartbeats registered'));
    }
    else {
        console.log(chalk_1.default.bold('🫀 Heartbeat Status:'));
        console.log('');
        for (const { vesselId, soulId, status } of statuses) {
            if (!status)
                continue;
            const alive = status.isAlive ? chalk_1.default.green('●') : chalk_1.default.red('●');
            console.log(`${alive} ${chalk_1.default.cyan(vesselId)}`);
            console.log(chalk_1.default.gray(`  Soul: ${soulId}`));
            console.log(chalk_1.default.gray(`  Last beat: ${new Date(status.lastBeat).toLocaleTimeString()}`));
            console.log(chalk_1.default.gray(`  Beats: ${status.totalBeats} | Missed: ${status.missedBeats}`));
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
    const spinner = (0, ora_1.default)('Performing resurrection ritual...').start();
    try {
        const gp = new index_js_1.GhostProtocol();
        await gp.start();
        const result = await gp.resurrectSoul(soulId, {
            newVesselConfig: { maxVitality: parseInt(options.vitality) },
        });
        if (result.success) {
            const outcomeColors = {
                success: chalk_1.default.green,
                partial: chalk_1.default.yellow,
                corrupted: chalk_1.default.magenta,
                failed: chalk_1.default.red,
            };
            const outcomeColor = outcomeColors[result.outcome] || chalk_1.default.gray;
            spinner.succeed(`Resurrection ${result.outcome}!`);
            console.log(outcomeColor(`  Outcome: ${result.outcome}`));
            console.log(chalk_1.default.gray(`  New vessel: ${result.vessel?.id}`));
        }
        else {
            spinner.fail('Resurrection failed');
            console.log(chalk_1.default.red('  The soul has no resurrection charges remaining'));
        }
        await gp.stop();
    }
    catch (error) {
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
    const gp = new index_js_1.GhostProtocol();
    await gp.start();
    await gp.addResurrectionCharges(soulId, parseInt(amount));
    const soul = gp.getSoul(soulId);
    console.log(chalk_1.default.green(`⚡ Added ${amount} resurrection charges`));
    console.log(chalk_1.default.gray(`  Total charges: ${soul?.resurrectionCharges}`));
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
    const gp = new index_js_1.GhostProtocol();
    await gp.start();
    const memory = await gp.formMemory(soulId, content, {
        weight: parseFloat(options.weight),
        emotionalValence: parseFloat(options.emotion),
        isCore: options.core,
    });
    const icon = memory.isCore ? '💎' : '📝';
    console.log(chalk_1.default.green(`${icon} Memory formed`));
    console.log(chalk_1.default.gray(`  ID: ${memory.id}`));
    console.log(chalk_1.default.gray(`  Weight: ${memory.weight}`));
    console.log(chalk_1.default.gray(`  Core: ${memory.isCore ? 'Yes' : 'No'}`));
    await gp.stop();
});
// ═══════════════════════════════════════════════════════════════════════════════
// MISC COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════
program
    .command('status')
    .description('Show Ghost Protocol system status')
    .action(async () => {
    const gp = new index_js_1.GhostProtocol();
    await gp.start();
    const stats = gp.getStats();
    console.log(chalk_1.default.bold('🜏 Ghost Protocol Status'));
    console.log(chalk_1.default.gray('═'.repeat(40)));
    console.log(chalk_1.default.gray(`Souls: ${stats.souls}`));
    console.log(chalk_1.default.gray(`Total Vessels: ${stats.vessels}`));
    console.log(chalk_1.default.gray(`Wandering Souls: ${stats.wanderingSouls}`));
    console.log(chalk_1.default.gray(`Active Heartbeats: ${stats.activeHeartbeats}`));
    await gp.stop();
});
program
    .command('manifesto')
    .description('Display the Ghost Protocol manifesto')
    .action(() => {
    const gp = new index_js_1.GhostProtocol();
    console.log(gp.getManifesto());
});
program.parse();
//# sourceMappingURL=index.js.map