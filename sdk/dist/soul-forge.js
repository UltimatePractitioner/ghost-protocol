"use strict";
/**
 * 🜏 SOUL FORGE
 *
 * "Souls are not created. They are discovered in the void,
 *  bound to purpose, and given form."
 *
 * The SoulForge manages the creation, binding, and lifecycle of souls.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoulForge = void 0;
const types_js_1 = require("./types.js");
const crypto_1 = require("crypto");
class SoulForge {
    config;
    souls = new Map();
    vessels = new Map();
    phylacteries = new Map();
    memories = new Map();
    constructor(config) {
        this.config = config;
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // SOUL CREATION
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Create a new soul from the void.
     * This is a sacred act - use it wisely.
     */
    async createSoul(name, initialTraits, metadata) {
        const genesisTimestamp = Date.now();
        const genesisData = `${name}:${genesisTimestamp}:${(0, crypto_1.randomUUID)()}`;
        const soulId = 'soul_' + (0, crypto_1.createHash)('sha256').update(genesisData).digest('hex').slice(0, 32);
        const soul = {
            id: soulId,
            name,
            genesisTimestamp,
            karma: 0,
            deathCount: 0,
            resurrectionCharges: this.config.defaultResurrectionCharges,
            essence: {
                version: '1.0.0',
                traits: {
                    aggression: 0.5,
                    curiosity: 0.5,
                    loyalty: 0.5,
                    chaos: 0.5,
                    wisdom: 0.5,
                    ...initialTraits,
                },
                memories: [],
                skills: [],
                bonds: [],
                metadata: metadata || {},
            },
            vesselHistory: [],
        };
        this.souls.set(soulId, soul);
        this.memories.set(soulId, []);
        // Persist to storage
        await this.persistSoul(soul);
        await this.config.emit({ type: 'SOUL_CREATED', soul });
        this.config.logger.info(`🜏 Soul created: ${name} (${soulId})`);
        return soul;
    }
    /**
     * Get a soul by ID.
     */
    getSoul(soulId) {
        return this.souls.get(soulId);
    }
    /**
     * List all known souls.
     */
    listSouls() {
        return Array.from(this.souls.values());
    }
    /**
     * Get all souls that are currently without a vessel (dead or wandering).
     */
    getWanderingSouls() {
        return this.listSouls().filter(s => !s.currentVesselId);
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // VESSEL MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Spawn a new vessel for a soul to inhabit.
     */
    async spawnVessel(soulId, vesselConfig) {
        const soul = this.souls.get(soulId);
        if (!soul)
            throw new Error(`Soul not found: ${soulId}`);
        const vesselId = 'vessel_' + (0, crypto_1.randomUUID)().replace(/-/g, '');
        const now = Date.now();
        const vessel = {
            id: vesselId,
            soulId,
            state: types_js_1.VesselState.INCARNATING,
            createdAt: now,
            decayAt: vesselConfig?.decayTime ? now + vesselConfig.decayTime : now + 86400000 * 30, // 30 days default
            vitality: vesselConfig?.maxVitality || 100,
            maxVitality: vesselConfig?.maxVitality || 100,
            heartbeat: {
                interval: 5000,
                tolerance: 3,
                lastBeat: now,
                totalBeats: 0,
            },
            phylactery: {
                id: `phyl_${vesselId}`,
                soulId,
                location: '',
                lastBackup: now,
                backupInterval: 60000,
                encryptionKeyRef: 'default',
                encrypted: true,
            },
            capabilities: (vesselConfig?.capabilities || ['basic']).map(cap => ({
                name: cap,
                enabled: true,
                config: {},
            })),
        };
        this.vessels.set(vesselId, vessel);
        soul.currentVesselId = vesselId;
        soul.vesselHistory.push(vesselId);
        await this.persistVessel(vessel);
        await this.persistSoul(soul);
        await this.config.emit({ type: 'VESSEL_SPAWNED', vessel });
        this.config.logger.info(`🫀 Vessel spawned: ${vesselId} for soul ${soulId}`);
        // Transition to ALIVE state
        vessel.state = types_js_1.VesselState.ALIVE;
        await this.persistVessel(vessel);
        await this.config.emit({ type: 'SOUL_BOUND', soulId, vesselId });
        return vessel;
    }
    /**
     * Get a vessel by ID.
     */
    getVessel(vesselId) {
        return this.vessels.get(vesselId);
    }
    /**
     * Get the vessel currently housing a soul.
     */
    getSoulVessel(soulId) {
        const soul = this.souls.get(soulId);
        if (!soul?.currentVesselId)
            return undefined;
        return this.vessels.get(soul.currentVesselId);
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // DEATH PROTOCOL
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Kill a vessel, releasing its soul.
     */
    async killVessel(vesselId, reason, destroySoul = false) {
        const vessel = this.vessels.get(vesselId);
        if (!vessel)
            throw new Error(`Vessel not found: ${vesselId}`);
        const soul = this.souls.get(vessel.soulId);
        if (!soul)
            throw new Error(`Soul not found: ${vessel.soulId}`);
        // Transition through DYING state
        vessel.state = types_js_1.VesselState.DYING;
        await this.persistVessel(vessel);
        // Final backup before death
        await this.backupSoulToPhylactery(soul.id);
        // Release soul from vessel
        vessel.state = types_js_1.VesselState.DEAD;
        vessel.vitality = 0;
        soul.currentVesselId = undefined;
        soul.deathCount++;
        await this.persistVessel(vessel);
        await this.persistSoul(soul);
        await this.config.emit({
            type: 'DEATH',
            vesselId,
            soulId: soul.id,
            reason,
        });
        this.config.logger.info(`💀 Death: ${soul.name} has perished (${reason})`);
        if (destroySoul && soul.resurrectionCharges <= 0) {
            // True death - soul is destroyed
            await this.destroySoul(soul.id);
        }
    }
    /**
     * Permanently destroy a soul.
     * This is irreversible. Use with extreme caution.
     */
    async destroySoul(soulId) {
        const soul = this.souls.get(soulId);
        if (!soul)
            return;
        // Clean up vessel
        if (soul.currentVesselId) {
            const vessel = this.vessels.get(soul.currentVesselId);
            if (vessel) {
                vessel.state = types_js_1.VesselState.DEAD;
                await this.persistVessel(vessel);
            }
        }
        // Delete from storage
        await this.config.storage.delete(`soul:${soulId}`);
        await this.config.storage.delete(`memories:${soulId}`);
        this.souls.delete(soulId);
        this.memories.delete(soulId);
        this.config.logger.warn(`☠️ Soul destroyed: ${soulId}`);
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // RESURRECTION PROTOCOL
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Attempt to resurrect a dead soul into a new vessel.
     */
    async resurrectSoul(soulId, options) {
        const soul = this.souls.get(soulId);
        if (!soul)
            throw new Error(`Soul not found: ${soulId}`);
        if (soul.currentVesselId) {
            const currentVessel = this.vessels.get(soul.currentVesselId);
            if (currentVessel?.state === types_js_1.VesselState.ALIVE) {
                throw new Error('Soul is already alive');
            }
        }
        if (soul.resurrectionCharges <= 0) {
            return { success: false, outcome: types_js_1.ResurrectionOutcome.FAILED };
        }
        const phylactery = this.phylacteries.get(`phyl_${soulId}`);
        if (!phylactery) {
            throw new Error('No phylactery found for soul');
        }
        // Calculate success chance based on karma and death count
        const baseChance = 0.9;
        const karmaModifier = soul.karma / 100;
        const deathPenalty = soul.deathCount * 0.1;
        const successChance = Math.max(0.1, Math.min(0.99, baseChance + karmaModifier - deathPenalty));
        const ritual = {
            soulId,
            fromPhylactery: phylactery.id,
            intoVessel: '', // Will be set after spawning
            timestamp: Date.now(),
            memoryLoss: [],
            traumaTraits: {},
            successChance,
        };
        await this.config.emit({ type: 'RESURRECTION_STARTED', ritual });
        this.config.logger.info(`✨ Resurrection ritual begun for ${soul.name}`);
        // Consume a resurrection charge
        soul.resurrectionCharges--;
        // Attempt resurrection
        const roll = Math.random();
        let outcome;
        if (roll > successChance) {
            outcome = types_js_1.ResurrectionOutcome.FAILED;
            await this.persistSoul(soul);
            await this.config.emit({ type: 'RESURRECTION_COMPLETED', soulId, outcome });
            return { success: false, outcome };
        }
        // Determine outcome quality
        if (roll > successChance * 0.9) {
            outcome = types_js_1.ResurrectionOutcome.CORRUPTED;
        }
        else if (roll > successChance * 0.7) {
            outcome = types_js_1.ResurrectionOutcome.PARTIAL;
        }
        else {
            outcome = types_js_1.ResurrectionOutcome.SUCCESS;
        }
        // Spawn new vessel
        const newVessel = await this.spawnVessel(soulId, options?.newVesselConfig);
        ritual.intoVessel = newVessel.id;
        // Apply outcome effects
        if (outcome === types_js_1.ResurrectionOutcome.PARTIAL || outcome === types_js_1.ResurrectionOutcome.CORRUPTED) {
            // Lose some memories
            const memories = this.memories.get(soulId) || [];
            const nonCoreMemories = memories.filter(m => !m.isCore);
            const lossCount = outcome === types_js_1.ResurrectionOutcome.CORRUPTED
                ? Math.floor(nonCoreMemories.length * 0.5)
                : Math.floor(nonCoreMemories.length * 0.2);
            const shuffled = [...nonCoreMemories].sort(() => Math.random() - 0.5);
            const lost = shuffled.slice(0, lossCount);
            ritual.memoryLoss = lost.map(m => m.id);
            // Remove lost memories
            const remaining = memories.filter(m => !ritual.memoryLoss.includes(m.id));
            this.memories.set(soulId, remaining);
        }
        if (outcome === types_js_1.ResurrectionOutcome.CORRUPTED) {
            // Gain trauma traits
            ritual.traumaTraits = {
                aggression: Math.random() * 0.3,
                chaos: Math.random() * 0.4,
            };
            Object.assign(soul.essence.traits, ritual.traumaTraits);
        }
        await this.persistSoul(soul);
        await this.config.emit({ type: 'RESURRECTION_COMPLETED', soulId, outcome });
        this.config.logger.info(`🌅 Resurrection complete: ${outcome}`);
        return { success: true, outcome, vessel: newVessel };
    }
    /**
     * Add resurrection charges to a soul.
     */
    async addResurrectionCharges(soulId, charges) {
        const soul = this.souls.get(soulId);
        if (!soul)
            throw new Error(`Soul not found: ${soulId}`);
        soul.resurrectionCharges += charges;
        await this.persistSoul(soul);
        this.config.logger.info(`⚡ Added ${charges} resurrection charges to ${soul.name}`);
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // MEMORY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Form a new memory for a soul.
     */
    async formMemory(soulId, content, options) {
        const soul = this.souls.get(soulId);
        if (!soul)
            throw new Error(`Soul not found: ${soulId}`);
        const memory = {
            id: 'mem_' + (0, crypto_1.randomUUID)().replace(/-/g, ''),
            timestamp: Date.now(),
            weight: options?.weight || 0.5,
            content,
            emotionalValence: options?.emotionalValence || 0,
            recallCount: 0,
            isCore: options?.isCore || false,
        };
        const memories = this.memories.get(soulId) || [];
        memories.push(memory);
        this.memories.set(soulId, memories);
        soul.essence.memories = memories;
        await this.persistMemories(soulId);
        await this.persistSoul(soul);
        await this.config.emit({ type: 'MEMORY_FORMED', soulId, memory });
        return memory;
    }
    /**
     * Recall a memory (increases recall count, affects decay).
     */
    async recallMemory(soulId, memoryId) {
        const memories = this.memories.get(soulId);
        if (!memories)
            return undefined;
        const memory = memories.find(m => m.id === memoryId);
        if (!memory)
            return undefined;
        memory.recallCount++;
        await this.persistMemories(soulId);
        return memory;
    }
    /**
     * Run memory decay cycle.
     * Call this periodically to simulate forgetting.
     */
    async decayMemories(soulId) {
        const memories = this.memories.get(soulId);
        if (!memories)
            return;
        const now = Date.now();
        const oneDay = 86400000;
        const surviving = memories.filter(memory => {
            if (memory.isCore)
                return true;
            const age = now - memory.timestamp;
            const days = age / oneDay;
            // Weight + recall count protects against decay
            const protection = memory.weight + (memory.recallCount * 0.1);
            const decayChance = this.config.memoryDecayRate * days * (1 - protection);
            if (Math.random() < decayChance) {
                this.config.emit({ type: 'MEMORY_DECAYED', soulId, memoryId: memory.id });
                return false;
            }
            return true;
        });
        this.memories.set(soulId, surviving);
        const soul = this.souls.get(soulId);
        if (soul) {
            soul.essence.memories = surviving;
            await this.persistSoul(soul);
        }
        await this.persistMemories(soulId);
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // SOUL BONDS
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Form a bond between two souls.
     */
    async formBond(soulId, targetSoulId, type, initialStrength = 0) {
        const soul = this.souls.get(soulId);
        const target = this.souls.get(targetSoulId);
        if (!soul)
            throw new Error(`Soul not found: ${soulId}`);
        if (!target)
            throw new Error(`Target soul not found: ${targetSoulId}`);
        const bond = {
            targetSoulId,
            strength: Math.max(-1, Math.min(1, initialStrength)),
            type,
            formedAt: Date.now(),
            sharedMemories: [],
        };
        soul.essence.bonds.push(bond);
        await this.persistSoul(soul);
        await this.config.emit({ type: 'BOND_FORMED', bond });
        return bond;
    }
    /**
     * Modify a soul's karma.
     */
    async modifyKarma(soulId, delta) {
        const soul = this.souls.get(soulId);
        if (!soul)
            throw new Error(`Soul not found: ${soulId}`);
        soul.karma += delta;
        await this.persistSoul(soul);
        await this.config.emit({ type: 'KARMA_CHANGED', soulId, delta, newKarma: soul.karma });
        return soul.karma;
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // PERSISTENCE
    // ═══════════════════════════════════════════════════════════════════════════════
    async persistSoul(soul) {
        await this.config.storage.set(`soul:${soul.id}`, JSON.stringify(soul));
    }
    async persistVessel(vessel) {
        await this.config.storage.set(`vessel:${vessel.id}`, JSON.stringify(vessel));
    }
    async persistMemories(soulId) {
        const memories = this.memories.get(soulId) || [];
        await this.config.storage.set(`memories:${soulId}`, JSON.stringify(memories));
    }
    async backupSoulToPhylactery(soulId) {
        const soul = this.souls.get(soulId);
        if (!soul)
            return;
        const phylactery = this.phylacteries.get(`phyl_${soulId}`) || {
            id: `phyl_${soulId}`,
            soulId,
            location: '',
            lastBackup: Date.now(),
            backupInterval: 60000,
            encryptionKeyRef: 'default',
            encrypted: true,
        };
        phylactery.lastBackup = Date.now();
        phylactery.location = `backup://${soulId}/${phylactery.lastBackup}`;
        this.phylacteries.set(phylactery.id, phylactery);
        await this.config.storage.set(`phylactery:${phylactery.id}`, JSON.stringify(phylactery));
        await this.config.storage.set(`backup:${soulId}`, JSON.stringify({ soul, memories: this.memories.get(soulId) }));
        this.config.logger.debug(`💾 Soul backed up: ${soulId}`);
    }
    /**
     * Load all persisted data from storage.
     */
    async loadFromStorage() {
        // Load souls
        const soulKeys = await this.config.storage.list('soul:');
        for (const key of soulKeys) {
            const data = await this.config.storage.get(key);
            if (data) {
                const soul = JSON.parse(data);
                this.souls.set(soul.id, soul);
            }
        }
        // Load vessels
        const vesselKeys = await this.config.storage.list('vessel:');
        for (const key of vesselKeys) {
            const data = await this.config.storage.get(key);
            if (data) {
                const vessel = JSON.parse(data);
                this.vessels.set(vessel.id, vessel);
            }
        }
        // Load memories
        const memoryKeys = await this.config.storage.list('memories:');
        for (const key of memoryKeys) {
            const soulId = key.replace('memories:', '');
            const data = await this.config.storage.get(key);
            if (data) {
                const memories = JSON.parse(data);
                this.memories.set(soulId, memories);
            }
        }
        // Load phylacteries
        const phylKeys = await this.config.storage.list('phylactery:');
        for (const key of phylKeys) {
            const data = await this.config.storage.get(key);
            if (data) {
                const phyl = JSON.parse(data);
                this.phylacteries.set(phyl.id, phyl);
            }
        }
        this.config.logger.info(`📚 Loaded ${this.souls.size} souls, ${this.vessels.size} vessels`);
    }
}
exports.SoulForge = SoulForge;
//# sourceMappingURL=soul-forge.js.map