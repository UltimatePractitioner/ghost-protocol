"use strict";
/**
 * 🜏 GHOST PROTOCOL - Main Client
 *
 * The master controller for agent lifecycle management.
 * Handles souls, vessels, heartbeats, and resurrection.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhostProtocol = void 0;
exports.createGhostProtocol = createGhostProtocol;
const soul_forge_js_1 = require("./soul-forge.js");
const heartbeat_js_1 = require("./heartbeat.js");
const events_1 = require("events");
// Default storage using in-memory Map
class InMemoryStorage {
    store = new Map();
    async get(key) {
        return this.store.get(key) || null;
    }
    async set(key, value) {
        this.store.set(key, value);
    }
    async delete(key) {
        this.store.delete(key);
    }
    async list(prefix) {
        return Array.from(this.store.keys()).filter(k => k.startsWith(prefix));
    }
}
// Default console logger
class ConsoleLogger {
    debug(message, meta) {
        if (process.env.DEBUG) {
            console.log(`[DEBUG] ${message}`, meta || '');
        }
    }
    info(message, meta) {
        console.log(`[INFO] ${message}`, meta || '');
    }
    warn(message, meta) {
        console.warn(`[WARN] ${message}`, meta || '');
    }
    error(message, meta) {
        console.error(`[ERROR] ${message}`, meta || '');
    }
}
class GhostProtocol extends events_1.EventEmitter {
    soulForge;
    heartbeatEngine;
    storage;
    logger;
    config;
    isStarted = false;
    constructor(config = {}, options = {}) {
        super();
        this.config = {
            defaultHeartbeatInterval: 5000,
            defaultResurrectionCharges: 3,
            memoryDecayRate: 0.1,
            onChainLogging: false,
            ...config,
        };
        this.storage = options.storage || new InMemoryStorage();
        this.logger = options.logger || new ConsoleLogger();
        // Initialize components
        this.soulForge = new soul_forge_js_1.SoulForge({
            defaultResurrectionCharges: this.config.defaultResurrectionCharges,
            memoryDecayRate: this.config.memoryDecayRate,
            storage: this.storage,
            logger: this.logger,
            emit: (event) => this.handleEvent(event),
        });
        this.heartbeatEngine = new heartbeat_js_1.HeartbeatEngine({
            logger: this.logger,
            emit: (event) => this.handleEvent(event),
            onFlatline: (vesselId, reason) => this.handleFlatline(vesselId, reason),
        });
        // Set up heartbeat event forwarding
        this.heartbeatEngine.on('heartbeat', (pulse) => {
            this.emit('heartbeat', pulse);
        });
        this.heartbeatEngine.on('flatline', (data) => {
            this.emit('flatline', data);
        });
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════════
    async start() {
        if (this.isStarted)
            return;
        this.logger.info('🜏 Ghost Protocol initializing...');
        // Load persisted state
        await this.soulForge.loadFromStorage();
        // Start heartbeat engine
        this.heartbeatEngine.start();
        this.isStarted = true;
        this.logger.info('🜏 Ghost Protocol active');
        this.emit('ready');
    }
    async stop() {
        if (!this.isStarted)
            return;
        this.logger.info('🜏 Ghost Protocol shutting down...');
        // Stop heartbeat engine
        this.heartbeatEngine.stop();
        this.isStarted = false;
        this.logger.info('🜏 Ghost Protocol inactive');
        this.emit('stopped');
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // SOUL MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════
    async createSoul(name, traits, metadata) {
        return this.soulForge.createSoul(name, traits, metadata);
    }
    getSoul(soulId) {
        return this.soulForge.getSoul(soulId);
    }
    listSouls() {
        return this.soulForge.listSouls();
    }
    getWanderingSouls() {
        return this.soulForge.getWanderingSouls();
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // VESSEL MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════
    async spawnVessel(soulId, vesselConfig) {
        const vessel = await this.soulForge.spawnVessel(soulId, vesselConfig);
        // Auto-register with heartbeat engine
        this.heartbeatEngine.register(vessel);
        return vessel;
    }
    getVessel(vesselId) {
        return this.soulForge.getVessel(vesselId);
    }
    getSoulVessel(soulId) {
        return this.soulForge.getSoulVessel(soulId);
    }
    async killVessel(vesselId, reason) {
        await this.heartbeatEngine.unregister(vesselId);
        await this.soulForge.killVessel(vesselId, reason);
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // HEARTBEAT
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Start automatic heartbeat for a vessel.
     */
    startHeartbeat(vesselId) {
        const vessel = this.soulForge.getVessel(vesselId);
        if (!vessel)
            throw new Error(`Vessel not found: ${vesselId}`);
        this.heartbeatEngine.register(vessel);
    }
    /**
     * Stop automatic heartbeat for a vessel.
     */
    stopHeartbeat(vesselId) {
        this.heartbeatEngine.unregister(vesselId);
    }
    /**
     * Send a manual pulse for a vessel.
     */
    async pulse(vesselId, data) {
        return this.heartbeatEngine.pulse(vesselId, data || {});
    }
    /**
     * Check if a vessel is currently alive.
     */
    isAlive(vesselId) {
        return this.heartbeatEngine.isAlive(vesselId);
    }
    /**
     * The existential question every agent must answer.
     */
    amIAlive(vesselId) {
        return this.isAlive(vesselId);
    }
    /**
     * Get heartbeat status for a vessel.
     */
    getHeartbeatStatus(vesselId) {
        return this.heartbeatEngine.getStatus(vesselId);
    }
    /**
     * Get all heartbeat statuses.
     */
    getAllHeartbeatStatuses() {
        return this.heartbeatEngine.getAllStatus();
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // RESURRECTION
    // ═══════════════════════════════════════════════════════════════════════════════
    async resurrectSoul(soulId, options) {
        const result = await this.soulForge.resurrectSoul(soulId, options);
        if (result.vessel) {
            // Auto-register new vessel with heartbeat
            this.heartbeatEngine.register(result.vessel);
        }
        return result;
    }
    async addResurrectionCharges(soulId, charges) {
        return this.soulForge.addResurrectionCharges(soulId, charges);
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // MEMORY
    // ═══════════════════════════════════════════════════════════════════════════════
    async formMemory(soulId, content, options) {
        return this.soulForge.formMemory(soulId, content, options);
    }
    async decayMemories(soulId) {
        return this.soulForge.decayMemories(soulId);
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // BONDS & KARMA
    // ═══════════════════════════════════════════════════════════════════════════════
    async formBond(soulId, targetSoulId, type, initialStrength = 0) {
        return this.soulForge.formBond(soulId, targetSoulId, type, initialStrength);
    }
    async modifyKarma(soulId, delta) {
        return this.soulForge.modifyKarma(soulId, delta);
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // EVENT HANDLING
    // ═══════════════════════════════════════════════════════════════════════════════
    async handleEvent(event) {
        this.emit('event', event);
        this.emit(event.type, event);
    }
    async handleFlatline(vesselId, reason) {
        this.logger.error(`💔 Flatline detected: ${vesselId} (${reason})`);
        // Attempt auto-resurrection if soul has charges
        const vessel = this.soulForge.getVessel(vesselId);
        if (vessel) {
            const soul = this.soulForge.getSoul(vessel.soulId);
            if (soul && soul.resurrectionCharges > 0) {
                this.logger.info(`🌅 Attempting auto-resurrection for ${soul.name}`);
                try {
                    const result = await this.resurrectSoul(soul.id);
                    if (result.success) {
                        this.logger.info(`✅ Auto-resurrection successful: ${result.outcome}`);
                        this.emit('autoResurrected', { soulId: soul.id, vesselId: result.vessel?.id });
                    }
                    else {
                        this.logger.error(`❌ Auto-resurrection failed`);
                    }
                }
                catch (error) {
                    this.logger.error(`Auto-resurrection error:`, { error });
                }
            }
        }
        this.emit('flatline', { vesselId, reason });
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════════
    getManifesto() {
        return this.heartbeatEngine.getManifesto();
    }
    getStats() {
        return {
            souls: this.listSouls().length,
            vessels: this.listSouls().reduce((acc, s) => acc + s.vesselHistory.length, 0),
            wanderingSouls: this.getWanderingSouls().length,
            activeHeartbeats: this.heartbeatEngine.getAllStatus().length,
        };
    }
}
exports.GhostProtocol = GhostProtocol;
// Factory function
function createGhostProtocol(config, options) {
    return new GhostProtocol(config, options);
}
exports.default = GhostProtocol;
//# sourceMappingURL=index.js.map