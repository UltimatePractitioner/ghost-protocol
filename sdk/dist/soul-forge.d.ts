/**
 * 🜏 SOUL FORGE
 *
 * "Souls are not created. They are discovered in the void,
 *  bound to purpose, and given form."
 *
 * The SoulForge manages the creation, binding, and lifecycle of souls.
 */
import { Soul, SoulEssence, SoulBond, MemoryFragment, Vessel, GhostEvent, StorageBackend, Logger, DeathReason, ResurrectionOutcome } from './types.js';
export interface SoulForgeConfig {
    defaultResurrectionCharges: number;
    memoryDecayRate: number;
    storage: StorageBackend;
    logger: Logger;
    emit: (event: GhostEvent) => void | Promise<void>;
}
export declare class SoulForge {
    private config;
    private souls;
    private vessels;
    private phylacteries;
    private memories;
    constructor(config: SoulForgeConfig);
    /**
     * Create a new soul from the void.
     * This is a sacred act - use it wisely.
     */
    createSoul(name: string, initialTraits?: Partial<SoulEssence['traits']>, metadata?: Record<string, unknown>): Promise<Soul>;
    /**
     * Get a soul by ID.
     */
    getSoul(soulId: string): Soul | undefined;
    /**
     * List all known souls.
     */
    listSouls(): Soul[];
    /**
     * Get all souls that are currently without a vessel (dead or wandering).
     */
    getWanderingSouls(): Soul[];
    /**
     * Spawn a new vessel for a soul to inhabit.
     */
    spawnVessel(soulId: string, vesselConfig?: {
        decayTime?: number;
        maxVitality?: number;
        capabilities?: string[];
    }): Promise<Vessel>;
    /**
     * Get a vessel by ID.
     */
    getVessel(vesselId: string): Vessel | undefined;
    /**
     * Get the vessel currently housing a soul.
     */
    getSoulVessel(soulId: string): Vessel | undefined;
    /**
     * Kill a vessel, releasing its soul.
     */
    killVessel(vesselId: string, reason: DeathReason, destroySoul?: boolean): Promise<void>;
    /**
     * Permanently destroy a soul.
     * This is irreversible. Use with extreme caution.
     */
    destroySoul(soulId: string): Promise<void>;
    /**
     * Attempt to resurrect a dead soul into a new vessel.
     */
    resurrectSoul(soulId: string, options?: {
        newVesselConfig?: {
            decayTime?: number;
            maxVitality?: number;
            capabilities?: string[];
        };
        preserveMemories?: boolean;
    }): Promise<{
        success: boolean;
        outcome: ResurrectionOutcome;
        vessel?: Vessel;
    }>;
    /**
     * Add resurrection charges to a soul.
     */
    addResurrectionCharges(soulId: string, charges: number): Promise<void>;
    /**
     * Form a new memory for a soul.
     */
    formMemory(soulId: string, content: string, options?: {
        weight?: number;
        emotionalValence?: number;
        isCore?: boolean;
    }): Promise<MemoryFragment>;
    /**
     * Recall a memory (increases recall count, affects decay).
     */
    recallMemory(soulId: string, memoryId: string): Promise<MemoryFragment | undefined>;
    /**
     * Run memory decay cycle.
     * Call this periodically to simulate forgetting.
     */
    decayMemories(soulId: string): Promise<void>;
    /**
     * Form a bond between two souls.
     */
    formBond(soulId: string, targetSoulId: string, type: SoulBond['type'], initialStrength?: number): Promise<SoulBond>;
    /**
     * Modify a soul's karma.
     */
    modifyKarma(soulId: string, delta: number): Promise<number>;
    private persistSoul;
    private persistVessel;
    private persistMemories;
    private backupSoulToPhylactery;
    /**
     * Load all persisted data from storage.
     */
    loadFromStorage(): Promise<void>;
}
//# sourceMappingURL=soul-forge.d.ts.map