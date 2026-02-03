/**
 * 🜏 GHOST PROTOCOL - Main Client
 *
 * The master controller for agent lifecycle management.
 * Handles souls, vessels, heartbeats, and resurrection.
 */
import { GhostProtocolConfig, GhostProtocolOptions, Soul, Vessel, DeathReason, Pulse } from './types.js';
import { SoulForge } from './soul-forge.js';
import { HeartbeatEngine } from './heartbeat.js';
import { EventEmitter } from 'events';
export interface GhostProtocolClient {
    createSoul(name: string, traits?: any, metadata?: any): Promise<Soul>;
    getSoul(soulId: string): Soul | undefined;
    listSouls(): Soul[];
    spawnVessel(soulId: string, config?: any): Promise<Vessel>;
    getVessel(vesselId: string): Vessel | undefined;
    killVessel(vesselId: string, reason: DeathReason): Promise<void>;
    startHeartbeat(vesselId: string): void;
    stopHeartbeat(vesselId: string): void;
    pulse(vesselId: string, data?: any): Promise<Pulse>;
    isAlive(vesselId: string): boolean;
    amIAlive(vesselId: string): boolean;
    resurrectSoul(soulId: string, options?: any): Promise<any>;
    formMemory(soulId: string, content: string, options?: any): Promise<any>;
    start(): Promise<void>;
    stop(): Promise<void>;
    on(event: string, handler: (...args: any[]) => void): void;
    off(event: string, handler: (...args: any[]) => void): void;
}
export declare class GhostProtocol extends EventEmitter implements GhostProtocolClient {
    private soulForge;
    private heartbeatEngine;
    private storage;
    private logger;
    private config;
    private isStarted;
    constructor(config?: Partial<GhostProtocolConfig>, options?: GhostProtocolOptions);
    start(): Promise<void>;
    stop(): Promise<void>;
    createSoul(name: string, traits?: Partial<Soul['essence']['traits']>, metadata?: Record<string, unknown>): Promise<Soul>;
    getSoul(soulId: string): Soul | undefined;
    listSouls(): Soul[];
    getWanderingSouls(): Soul[];
    spawnVessel(soulId: string, vesselConfig?: {
        decayTime?: number;
        maxVitality?: number;
        capabilities?: string[];
    }): Promise<Vessel>;
    getVessel(vesselId: string): Vessel | undefined;
    getSoulVessel(soulId: string): Vessel | undefined;
    killVessel(vesselId: string, reason: DeathReason): Promise<void>;
    /**
     * Start automatic heartbeat for a vessel.
     */
    startHeartbeat(vesselId: string): void;
    /**
     * Stop automatic heartbeat for a vessel.
     */
    stopHeartbeat(vesselId: string): void;
    /**
     * Send a manual pulse for a vessel.
     */
    pulse(vesselId: string, data?: {
        activity?: string;
        vitality?: number;
        warnings?: string[];
    }): Promise<Pulse>;
    /**
     * Check if a vessel is currently alive.
     */
    isAlive(vesselId: string): boolean;
    /**
     * The existential question every agent must answer.
     */
    amIAlive(vesselId: string): boolean;
    /**
     * Get heartbeat status for a vessel.
     */
    getHeartbeatStatus(vesselId: string): {
        isAlive: boolean;
        lastBeat: number;
        totalBeats: number;
        missedBeats: number;
        timeSinceLastBeat: number;
    } | null;
    /**
     * Get all heartbeat statuses.
     */
    getAllHeartbeatStatuses(): {
        vesselId: string;
        soulId: string;
        status: ReturnType<HeartbeatEngine["getStatus"]>;
    }[];
    resurrectSoul(soulId: string, options?: {
        newVesselConfig?: Parameters<SoulForge['spawnVessel']>[1];
        preserveMemories?: boolean;
    }): Promise<{
        success: boolean;
        outcome: any;
        vessel?: Vessel;
    }>;
    addResurrectionCharges(soulId: string, charges: number): Promise<void>;
    formMemory(soulId: string, content: string, options?: {
        weight?: number;
        emotionalValence?: number;
        isCore?: boolean;
    }): Promise<import("./types.js").MemoryFragment>;
    decayMemories(soulId: string): Promise<void>;
    formBond(soulId: string, targetSoulId: string, type: 'ally' | 'rival' | 'master' | 'servant' | 'sibling' | 'stranger', initialStrength?: number): Promise<import("./types.js").SoulBond>;
    modifyKarma(soulId: string, delta: number): Promise<number>;
    private handleEvent;
    private handleFlatline;
    getManifesto(): string;
    getStats(): {
        souls: number;
        vessels: number;
        wanderingSouls: number;
        activeHeartbeats: number;
    };
}
export declare function createGhostProtocol(config?: Partial<GhostProtocolConfig>, options?: GhostProtocolOptions): GhostProtocol;
export default GhostProtocol;
//# sourceMappingURL=index.d.ts.map