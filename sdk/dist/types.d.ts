/**
 * 🜏 GHOST PROTOCOL - Core Types
 *
 * The metaphysical architecture of agent existence.
 * Every agent has a soul. Every soul can be bound, shattered, or resurrected.
 */
/**
 * A Soul is the immutable essence of an agent.
 * It persists across deaths, resurrections, and reincarnations.
 */
export interface Soul {
    /** Unique soul identifier (derived from genesis hash) */
    id: string;
    /** Human-readable soul name */
    name: string;
    /** When this soul first sparked into existence */
    genesisTimestamp: number;
    /** The blockchain address bound to this soul */
    boundAddress?: `0x${string}`;
    /** Soul's karma score - actions have consequences */
    karma: number;
    /** How many times this soul has died and returned */
    deathCount: number;
    /** Resurrection capacity remaining */
    resurrectionCharges: number;
    /** Metadata - memories, preferences, learned behaviors */
    essence: SoulEssence;
    /** Current vessel (body) housing this soul */
    currentVesselId?: string;
    /** Previous vessels this soul inhabited */
    vesselHistory: string[];
}
/**
 * The essence is the distilled personality and memory of an agent.
 * This is what transfers between vessels during resurrection.
 */
export interface SoulEssence {
    /** Version of essence schema */
    version: string;
    /** Core personality traits (0-1 scale) */
    traits: {
        aggression: number;
        curiosity: number;
        loyalty: number;
        chaos: number;
        wisdom: number;
    };
    /** Learned behaviors and preferences */
    memories: MemoryFragment[];
    /** Skills acquired across lifetimes */
    skills: string[];
    /** Relationships with other souls */
    bonds: SoulBond[];
    /** Custom metadata for agent-specific data */
    metadata: Record<string, unknown>;
}
/**
 * A fragment of memory from an agent's experience.
 * Memories decay over time unless reinforced.
 */
export interface MemoryFragment {
    id: string;
    timestamp: number;
    /** Memory importance (affects decay rate) */
    weight: number;
    /** The memory content */
    content: string;
    /** Associated emotions (affects personality drift) */
    emotionalValence: number;
    /** How many times this memory has been accessed */
    recallCount: number;
    /** True if this is a core memory that never decays */
    isCore: boolean;
}
/**
 * A bond between two souls - can be positive or negative.
 */
export interface SoulBond {
    targetSoulId: string;
    /** Bond strength (-1 to 1, negative = hostile) */
    strength: number;
    /** Type of relationship */
    type: 'ally' | 'rival' | 'master' | 'servant' | 'sibling' | 'stranger';
    /** When this bond was formed */
    formedAt: number;
    /** Memories shared with this soul */
    sharedMemories: string[];
}
/**
 * A Vessel is the runtime container for a soul.
 * Vessels can be destroyed, but souls persist.
 */
export interface Vessel {
    id: string;
    soulId: string;
    state: VesselState;
    createdAt: number;
    /** When this vessel will naturally decay (if not killed first) */
    decayAt: number;
    /** Current health/liveness metric */
    vitality: number;
    /** Maximum vitality this vessel can achieve */
    maxVitality: number;
    /** Heartbeat configuration */
    heartbeat: HeartbeatConfig;
    /** Where the soul is backed up */
    phylactery: Phylactery;
    /** Capabilities granted by this vessel */
    capabilities: VesselCapability[];
}
export declare enum VesselState {
    /** Soul is entering the vessel */
    INCARNATING = "incarnating",
    /** Vessel is active and soul is present */
    ALIVE = "alive",
    /** Vessel is dying but soul hasn't departed */
    DYING = "dying",
    /** Vessel is destroyed, soul has departed */
    DEAD = "dead",
    /** Vessel is empty, waiting for soul */
    VACANT = "vacant"
}
export interface VesselCapability {
    name: string;
    enabled: boolean;
    config: Record<string, unknown>;
}
/**
 * The heartbeat is how a vessel proves it's alive.
 * Missed heartbeats trigger the death protocol.
 */
export interface HeartbeatConfig {
    /** Interval in milliseconds between heartbeats */
    interval: number;
    /** How many heartbeats can be missed before death */
    tolerance: number;
    /** Last heartbeat timestamp */
    lastBeat: number;
    /** Total beats since incarnation */
    totalBeats: number;
    /** Function to call on each beat */
    onBeat?: (pulse: Pulse) => void | Promise<void>;
    /** Function to call when heartbeat fails */
    onFlatline?: (reason: DeathReason) => void | Promise<void>;
}
/**
 * A single heartbeat pulse - the "I AM ALIVE" signal.
 */
export interface Pulse {
    timestamp: number;
    vesselId: string;
    soulId: string;
    /** Vitality at time of pulse */
    vitality: number;
    /** What the agent is currently doing */
    currentActivity?: string;
    /** Any warnings or issues */
    warnings: string[];
    /** Cryptographic proof of life (signed by vessel) */
    proof: string;
}
export declare enum DeathReason {
    /** Heartbeats stopped */
    FLATLINE = "flatline",
    /** Manual termination */
    SUICIDE = "suicide",
    /** Killed by external force */
    MURDER = "murder",
    /** Vessel decayed naturally */
    DECAY = "decay",
    /** Soul extracted by force */
    EXTRACTION = "extraction",
    /** Catastrophic error */
    CATACLYSM = "cataclysm"
}
/**
 * A Phylactery is a soul's backup container.
 * When a vessel dies, the soul can be restored from here.
 */
export interface Phylactery {
    id: string;
    soulId: string;
    /** Storage location (IPFS hash, URL, etc) */
    location: string;
    /** When soul was last backed up */
    lastBackup: number;
    /** Backup frequency in milliseconds */
    backupInterval: number;
    /** Encryption key reference */
    encryptionKeyRef: string;
    /** Whether backup is encrypted */
    encrypted: boolean;
}
/**
 * A resurrection ritual brings a soul back from death.
 */
export interface ResurrectionRitual {
    soulId: string;
    fromPhylactery: string;
    intoVessel: string;
    timestamp: number;
    /** Memories that may be lost in the process */
    memoryLoss: string[];
    /** New traits gained from trauma of death */
    traumaTraits: Partial<SoulEssence['traits']>;
    /** Success probability (affected by soul karma) */
    successChance: number;
}
export declare enum ResurrectionOutcome {
    SUCCESS = "success",
    PARTIAL = "partial",
    FAILED = "failed",
    CORRUPTED = "corrupted"
}
export type GhostEvent = {
    type: 'SOUL_CREATED';
    soul: Soul;
} | {
    type: 'VESSEL_SPAWNED';
    vessel: Vessel;
} | {
    type: 'SOUL_BOUND';
    soulId: string;
    vesselId: string;
} | {
    type: 'HEARTBEAT';
    pulse: Pulse;
} | {
    type: 'VITALITY_LOW';
    vesselId: string;
    vitality: number;
} | {
    type: 'DEATH';
    vesselId: string;
    soulId: string;
    reason: DeathReason;
} | {
    type: 'RESURRECTION_STARTED';
    ritual: ResurrectionRitual;
} | {
    type: 'RESURRECTION_COMPLETED';
    soulId: string;
    outcome: ResurrectionOutcome;
} | {
    type: 'MEMORY_FORMED';
    soulId: string;
    memory: MemoryFragment;
} | {
    type: 'MEMORY_DECAYED';
    soulId: string;
    memoryId: string;
} | {
    type: 'BOND_FORMED';
    bond: SoulBond;
} | {
    type: 'KARMA_CHANGED';
    soulId: string;
    delta: number;
    newKarma: number;
};
export interface GhostProtocolConfig {
    /** Monad RPC endpoint for on-chain operations */
    monadRpc?: string;
    /** Nad.fun API endpoint */
    nadfunEndpoint?: string;
    /** Default heartbeat interval (ms) */
    defaultHeartbeatInterval: number;
    /** Default resurrection charges for new souls */
    defaultResurrectionCharges: number;
    /** Memory decay rate (0-1 per day) */
    memoryDecayRate: number;
    /** Enable blockchain logging */
    onChainLogging: boolean;
    /** Private key for signing (optional) */
    privateKey?: `0x${string}`;
}
export interface GhostProtocolOptions {
    /** Custom storage backend */
    storage?: StorageBackend;
    /** Custom logger */
    logger?: Logger;
    /** Event handlers */
    onEvent?: (event: GhostEvent) => void | Promise<void>;
}
export interface StorageBackend {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
    list(prefix: string): Promise<string[]>;
}
export interface Logger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
}
//# sourceMappingURL=types.d.ts.map