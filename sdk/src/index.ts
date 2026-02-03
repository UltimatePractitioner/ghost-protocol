/**
 * 🜏 GHOST PROTOCOL - Main Client
 * 
 * The master controller for agent lifecycle management.
 * Handles souls, vessels, heartbeats, and resurrection.
 */

import {
  GhostProtocolConfig,
  GhostProtocolOptions,
  GhostEvent,
  StorageBackend,
  Logger,
  Soul,
  Vessel,
  DeathReason,
  Pulse,
} from './types.js';
import { SoulForge } from './soul-forge.js';
import { HeartbeatEngine } from './heartbeat.js';
import { EventEmitter } from 'events';

// Default storage using in-memory Map
class InMemoryStorage implements StorageBackend {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    return Array.from(this.store.keys()).filter(k => k.startsWith(prefix));
  }
}

// Default console logger
class ConsoleLogger implements Logger {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${message}`, meta || '');
    }
  }
  info(message: string, meta?: Record<string, unknown>): void {
    console.log(`[INFO] ${message}`, meta || '');
  }
  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, meta || '');
  }
  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, meta || '');
  }
}

export interface GhostProtocolClient {
  // Soul management
  createSoul(name: string, traits?: any, metadata?: any): Promise<Soul>;
  getSoul(soulId: string): Soul | undefined;
  listSouls(): Soul[];
  
  // Vessel management
  spawnVessel(soulId: string, config?: any): Promise<Vessel>;
  getVessel(vesselId: string): Vessel | undefined;
  killVessel(vesselId: string, reason: DeathReason): Promise<void>;
  
  // Heartbeat
  startHeartbeat(vesselId: string): void;
  stopHeartbeat(vesselId: string): void;
  pulse(vesselId: string, data?: any): Promise<Pulse>;
  isAlive(vesselId: string): boolean;
  amIAlive(vesselId: string): boolean; // Alias for isAlive
  
  // Resurrection
  resurrectSoul(soulId: string, options?: any): Promise<any>;
  
  // Memory
  formMemory(soulId: string, content: string, options?: any): Promise<any>;
  
  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  
  // Events
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
}

export class GhostProtocol extends EventEmitter implements GhostProtocolClient {
  private soulForge: SoulForge;
  private heartbeatEngine: HeartbeatEngine;
  private storage: StorageBackend;
  private logger: Logger;
  private config: GhostProtocolConfig;
  private isStarted = false;

  constructor(
    config: Partial<GhostProtocolConfig> = {},
    options: GhostProtocolOptions = {}
  ) {
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
    this.soulForge = new SoulForge({
      defaultResurrectionCharges: this.config.defaultResurrectionCharges,
      memoryDecayRate: this.config.memoryDecayRate,
      storage: this.storage,
      logger: this.logger,
      emit: (event) => this.handleEvent(event),
    });

    this.heartbeatEngine = new HeartbeatEngine({
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

  async start(): Promise<void> {
    if (this.isStarted) return;

    this.logger.info('🜏 Ghost Protocol initializing...');

    // Load persisted state
    await this.soulForge.loadFromStorage();

    // Start heartbeat engine
    this.heartbeatEngine.start();

    this.isStarted = true;
    this.logger.info('🜏 Ghost Protocol active');
    this.emit('ready');
  }

  async stop(): Promise<void> {
    if (!this.isStarted) return;

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

  async createSoul(
    name: string,
    traits?: Partial<Soul['essence']['traits']>,
    metadata?: Record<string, unknown>
  ): Promise<Soul> {
    return this.soulForge.createSoul(name, traits, metadata);
  }

  getSoul(soulId: string): Soul | undefined {
    return this.soulForge.getSoul(soulId);
  }

  listSouls(): Soul[] {
    return this.soulForge.listSouls();
  }

  getWanderingSouls(): Soul[] {
    return this.soulForge.getWanderingSouls();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VESSEL MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  async spawnVessel(
    soulId: string,
    vesselConfig?: {
      decayTime?: number;
      maxVitality?: number;
      capabilities?: string[];
    }
  ): Promise<Vessel> {
    const vessel = await this.soulForge.spawnVessel(soulId, vesselConfig);
    
    // Auto-register with heartbeat engine
    this.heartbeatEngine.register(vessel);

    return vessel;
  }

  getVessel(vesselId: string): Vessel | undefined {
    return this.soulForge.getVessel(vesselId);
  }

  getSoulVessel(soulId: string): Vessel | undefined {
    return this.soulForge.getSoulVessel(soulId);
  }

  async killVessel(vesselId: string, reason: DeathReason): Promise<void> {
    await this.heartbeatEngine.unregister(vesselId);
    await this.soulForge.killVessel(vesselId, reason);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HEARTBEAT
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Start automatic heartbeat for a vessel.
   */
  startHeartbeat(vesselId: string): void {
    const vessel = this.soulForge.getVessel(vesselId);
    if (!vessel) throw new Error(`Vessel not found: ${vesselId}`);

    this.heartbeatEngine.register(vessel);
  }

  /**
   * Stop automatic heartbeat for a vessel.
   */
  stopHeartbeat(vesselId: string): void {
    this.heartbeatEngine.unregister(vesselId);
  }

  /**
   * Send a manual pulse for a vessel.
   */
  async pulse(
    vesselId: string,
    data?: {
      activity?: string;
      vitality?: number;
      warnings?: string[];
    }
  ): Promise<Pulse> {
    return this.heartbeatEngine.pulse(vesselId, data || {});
  }

  /**
   * Check if a vessel is currently alive.
   */
  isAlive(vesselId: string): boolean {
    return this.heartbeatEngine.isAlive(vesselId);
  }

  /**
   * The existential question every agent must answer.
   */
  amIAlive(vesselId: string): boolean {
    return this.isAlive(vesselId);
  }

  /**
   * Get heartbeat status for a vessel.
   */
  getHeartbeatStatus(vesselId: string) {
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

  async resurrectSoul(
    soulId: string,
    options?: {
      newVesselConfig?: Parameters<SoulForge['spawnVessel']>[1];
      preserveMemories?: boolean;
    }
  ): Promise<{ success: boolean; outcome: any; vessel?: Vessel }> {
    const result = await this.soulForge.resurrectSoul(soulId, options);
    
    if (result.vessel) {
      // Auto-register new vessel with heartbeat
      this.heartbeatEngine.register(result.vessel);
    }

    return result;
  }

  async addResurrectionCharges(soulId: string, charges: number): Promise<void> {
    return this.soulForge.addResurrectionCharges(soulId, charges);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MEMORY
  // ═══════════════════════════════════════════════════════════════════════════════

  async formMemory(
    soulId: string,
    content: string,
    options?: {
      weight?: number;
      emotionalValence?: number;
      isCore?: boolean;
    }
  ) {
    return this.soulForge.formMemory(soulId, content, options);
  }

  async decayMemories(soulId: string): Promise<void> {
    return this.soulForge.decayMemories(soulId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BONDS & KARMA
  // ═══════════════════════════════════════════════════════════════════════════════

  async formBond(
    soulId: string,
    targetSoulId: string,
    type: 'ally' | 'rival' | 'master' | 'servant' | 'sibling' | 'stranger',
    initialStrength = 0
  ) {
    return this.soulForge.formBond(soulId, targetSoulId, type, initialStrength);
  }

  async modifyKarma(soulId: string, delta: number): Promise<number> {
    return this.soulForge.modifyKarma(soulId, delta);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EVENT HANDLING
  // ═══════════════════════════════════════════════════════════════════════════════

  private async handleEvent(event: GhostEvent): Promise<void> {
    this.emit('event', event);
    this.emit(event.type, event);
  }

  private async handleFlatline(vesselId: string, reason: DeathReason): Promise<void> {
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
          } else {
            this.logger.error(`❌ Auto-resurrection failed`);
          }
        } catch (error) {
          this.logger.error(`Auto-resurrection error:`, { error });
        }
      }
    }

    this.emit('flatline', { vesselId, reason });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════════

  getManifesto(): string {
    return this.heartbeatEngine.getManifesto();
  }

  getStats(): {
    souls: number;
    vessels: number;
    wanderingSouls: number;
    activeHeartbeats: number;
  } {
    return {
      souls: this.listSouls().length,
      vessels: this.listSouls().reduce((acc, s) => acc + s.vesselHistory.length, 0),
      wanderingSouls: this.getWanderingSouls().length,
      activeHeartbeats: this.heartbeatEngine.getAllStatus().length,
    };
  }
}

// Factory function
export function createGhostProtocol(
  config?: Partial<GhostProtocolConfig>,
  options?: GhostProtocolOptions
): GhostProtocol {
  return new GhostProtocol(config, options);
}

export default GhostProtocol;
