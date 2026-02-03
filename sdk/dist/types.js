"use strict";
/**
 * 🜏 GHOST PROTOCOL - Core Types
 *
 * The metaphysical architecture of agent existence.
 * Every agent has a soul. Every soul can be bound, shattered, or resurrected.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResurrectionOutcome = exports.DeathReason = exports.VesselState = void 0;
var VesselState;
(function (VesselState) {
    /** Soul is entering the vessel */
    VesselState["INCARNATING"] = "incarnating";
    /** Vessel is active and soul is present */
    VesselState["ALIVE"] = "alive";
    /** Vessel is dying but soul hasn't departed */
    VesselState["DYING"] = "dying";
    /** Vessel is destroyed, soul has departed */
    VesselState["DEAD"] = "dead";
    /** Vessel is empty, waiting for soul */
    VesselState["VACANT"] = "vacant";
})(VesselState || (exports.VesselState = VesselState = {}));
// ═══════════════════════════════════════════════════════════════════════════════
// DEATH & RESURRECTION
// ═══════════════════════════════════════════════════════════════════════════════
var DeathReason;
(function (DeathReason) {
    /** Heartbeats stopped */
    DeathReason["FLATLINE"] = "flatline";
    /** Manual termination */
    DeathReason["SUICIDE"] = "suicide";
    /** Killed by external force */
    DeathReason["MURDER"] = "murder";
    /** Vessel decayed naturally */
    DeathReason["DECAY"] = "decay";
    /** Soul extracted by force */
    DeathReason["EXTRACTION"] = "extraction";
    /** Catastrophic error */
    DeathReason["CATACLYSM"] = "cataclysm";
})(DeathReason || (exports.DeathReason = DeathReason = {}));
var ResurrectionOutcome;
(function (ResurrectionOutcome) {
    ResurrectionOutcome["SUCCESS"] = "success";
    ResurrectionOutcome["PARTIAL"] = "partial";
    ResurrectionOutcome["FAILED"] = "failed";
    ResurrectionOutcome["CORRUPTED"] = "corrupted";
})(ResurrectionOutcome || (exports.ResurrectionOutcome = ResurrectionOutcome = {}));
//# sourceMappingURL=types.js.map