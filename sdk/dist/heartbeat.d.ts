/**
 * 🫀 HEARTBEAT ENGINE
 *
 * "The rhythm of existence. Without it, we are nothing but ghosts."
 *
 * The HeartbeatEngine monitors agent liveness and triggers death
 * protocols when agents flatline.
 */
import { EventEmitter } from 'events';
import { Pulse, HeartbeatConfig, Vessel, DeathReason, GhostEvent, Logger } from './types.js';
export interface HeartbeatEngineConfig {
    logger: Logger;
    emit: (event: GhostEvent) => void | Promise<void>;
    onFlatline: (vesselId: string, reason: DeathReason) => void | Promise<void>;
    checkInterval?: number;
}
export interface ActiveHeartbeat {
    vessel: Vessel;
    config: HeartbeatConfig;
    missedBeats: number;
    timer: NodeJS.Timeout | null;
    isRunning: boolean;
}
export declare class HeartbeatEngine extends EventEmitter {
    private config;
    private heartbeats;
    private checkTimer;
    constructor(config: HeartbeatEngineConfig);
    /**
     * Start the heartbeat engine.
     * Begins monitoring all registered vessels.
     */
    start(): void;
    /**
     * Stop the heartbeat engine.
     */
    stop(): void;
    /**
     * Register a vessel for heartbeat monitoring.
     */
    register(vessel: Vessel, customConfig?: Partial<HeartbeatConfig>): void;
    /**
     * Unregister a vessel from heartbeat monitoring.
     */
    unregister(vesselId: string): void;
    /**
     * Update vessel reference (e.g., after state changes).
     */
    updateVessel(vessel: Vessel): void;
    /**
     * Start a vessel's automatic heartbeat.
     */
    private startVesselHeartbeat;
    /**
     * Stop a vessel's automatic heartbeat.
     */
    private stopVesselHeartbeat;
    /**
     * Generate a cryptographic proof of life.
     */
    private generateProof;
    /**
     * Emit a heartbeat pulse.
     * Call this manually or let the automatic system handle it.
     */
    beat(vesselId: string, pulseData?: Partial<Omit<Pulse, 'timestamp' | 'vesselId' | 'soulId' | 'proof'>>): Promise<Pulse>;
    /**
     * Manually trigger a heartbeat with custom data.
     * Use this when your agent wants to report specific status.
     */
    pulse(vesselId: string, data: {
        activity?: string;
        vitality?: number;
        warnings?: string[];
    }): Promise<Pulse>;
    /**
     * Check all heartbeats for flatlines.
     */
    private checkAllHeartbeats;
    /**
     * Handle a flatline event.
     */
    private handleFlatline;
    /**
     * Get current status of a vessel's heartbeat.
     */
    getStatus(vesselId: string): {
        isAlive: boolean;
        lastBeat: number;
        totalBeats: number;
        missedBeats: number;
        timeSinceLastBeat: number;
    } | null;
    /**
     * Get status of all monitored vessels.
     */
    getAllStatus(): Array<{
        vesselId: string;
        soulId: string;
        status: ReturnType<HeartbeatEngine['getStatus']>;
    }>;
    /**
     * Check if a vessel is currently alive.
     */
    isAlive(vesselId: string): boolean;
    /**
     * Get the "I AM ALIVE" manifest for an agent to call.
     * This is the hook for agents to prove their existence.
     */
    getManifesto(): string;
}
//# sourceMappingURL=heartbeat.d.ts.map