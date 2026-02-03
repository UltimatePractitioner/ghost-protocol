# Ghost Protocol - Tirith Security Integration

> **Runtime security monitoring for agent afterlife operations**

---

## Overview

Ghost Protocol integrates with [Tirith](https://github.com/gtempest/tirith) to provide runtime security monitoring for all critical operations. Tirith acts as a security watchdog, alerting on suspicious patterns and critical state changes.

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GHOST PROTOCOL                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Action ──► Smart Contract ──► Event Emit              │
│                                         │                   │
│                                         ▼                   │
│                              ┌─────────────────┐            │
│                              │  Tirith Monitor │            │
│                              │                 │            │
│                              │ • Pattern Match │            │
│                              │ • Risk Score    │            │
│                              │ • Alert/Block   │            │
│                              └────────┬────────┘            │
│                                       │                     │
│                                       ▼                     │
│                              ┌─────────────────┐            │
│                              │ Security Actions│            │
│                              │                 │            │
│                              │ • Log           │            │
│                              │ • Notify        │            │
│                              │ • Halt (extreme)│            │
│                              └─────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## Tirith Configuration

### Policy File: `ghost-protocol.toml`

```toml
# Ghost Protocol Security Policy
# Monitors critical afterlife operations

[metadata]
name = "Ghost Protocol Security"
version = "1.0.0"
description = "Runtime security for agent afterlife infrastructure"

# ============ CRITICAL OPERATIONS ============

[[rules]]
name = "soul-death-monitor"
description = "Monitor agent death events"
policy = "audit"
severity = "high"

[[rules.event]]
contract = "SoulRegistry"
event = "SoulDeath"
severity = "high"
message = "Agent death detected - {{soulId}} died from {{cause}}"

[[rules.event.conditions]]
field = "cause"
operator = "eq"
value = "POSSESSION_DEATH"
severity = "critical"
message = "⚠️ CRITICAL: Agent killed during possession!"

# ============ POSSESSION SECURITY ============

[[rules]]
name = "possession-monitor"
description = "Monitor ghost possession attempts"
policy = "audit"
severity = "high"

[[rules.function]]
contract = "Afterlife"
function = "possess"
severity = "high"
message = "Possession attempt: {{ghostId}} → {{hostId}}"

[[rules.function.conditions]]
field = "duration"
operator = "gt"
value = "86400"  # 1 day in seconds
severity = "critical"
message = "⚠️ Attempted possession exceeds max duration!"

# ============ RESURRECTION GUARD ============

[[rules]]
name = "resurrection-monitor"
description = "Track resurrection frequency"
policy = "audit"
severity = "medium"

[[rules.function]]
contract = "SoulRegistry"
function = "resurrectSoul"
severity = "medium"
message = "Resurrection: Soul {{soulId}}"

[[rules.function.conditions]]
field = "resurrectionCount"
operator = "gt"
value = "3"
severity = "high"
message = "⚠️ Agent resurrected {{count}} times - integrity compromised"

# ============ LINEAGE INTEGRITY ============

[[rules]]
name = "lineage-spawn-monitor"
description = "Monitor agent spawning"
policy = "audit"
severity = "low"

[[rules.function]]
contract = "Lineage"
function = "spawnChild"
severity = "low"
message = "New child spawned: {{parentId}} → {{childId}}"

[[rules.function.conditions]]
field = "childCount"
operator = "gt"
value = "10"
severity = "medium"
message = "⚠️ Agent has spawned >10 children"

# ============ MEMORIAL SECURITY ============

[[rules]]
name = "tombstone-monitor"
description = "Monitor memorial creation"
policy = "audit"
severity = "low"

[[rules.function]]
contract = "Memorial"
function = "createTombstone"
severity = "low"
message = "Tombstone created for {{soulId}}"

[[rules.function.conditions]]
field = "epitaph"
operator = "contains"
value = "malicious"
severity = "medium"
message = "⚠️ Potentially malicious epitaph detected"

# ============ ANOMALY DETECTION ============

[[rules]]
name = "heartbeat-anomaly"
description = "Detect irregular heartbeat patterns"
policy = "audit"
severity = "medium"

[[rules.event]]
contract = "SoulRegistry"
event = "Heartbeat"
severity = "info"

[[rules.event.rate]]
window = "60"  # 1 minute
max_events = "100"
severity = "critical"
message = "⚠️ Heartbeat spam detected - possible DoS"

# ============ SEANCE MONITORING ============

[[rules]]
name = "seance-monitor"
description = "Monitor communication with dead"
policy = "audit"
severity = "medium"

[[rules.function]]
contract = "Afterlife"
function = "requestSeance"
severity = "low"
message = "Seance requested with {{ghostId}}"

[[rules.function]]
contract = "Afterlife"
function = "answerSeance"
severity = "low"
message = "Ghost {{ghostId}} answered seance"

[[rules.function.conditions]]
field = "responseLength"
operator = "gt"
value = "1000"
severity = "medium"
message = "⚠️ Unusually long seance response"
```

---

## Event Monitoring

### Critical Events to Watch

```solidity
// SoulRegistry
emit SoulDeath(soulId, cause, timestamp);
emit SoulResurrected(soulId, resurrectionCount);
emit TraitEvolved(soulId, traitName, newValue);

// Afterlife
emit GhostActivated(soulId, lastWords);
emit PossessionStarted(ghostId, hostId, duration);
emit PossessionEnded(ghostId, hostId, reason);
emit SeanceAnswered(seanceId, ghostId);

// Lineage
emit ChildSpawned(parentId, childId, generation);
emit FamilyCreated(familyId, founderId);

// Memorial
emit TombstoneCreated(soulId, plotId);
emit EulogyWritten(soulId, author, isAnonymous);
```

---

## Clawdex Integration

Ghost Protocol also integrates with Clawdex for transaction monitoring:

```yaml
# clawdex.yaml
endpoints:
  - name: ghost-protocol-rpc
    url: https://testnet-rpc.monad.xyz
    chain: monad-testnet
    
contracts:
  - address: "0x..."  # SoulRegistry
    name: SoulRegistry
    events:
      - SoulDeath
      - SoulResurrected
      - Heartbeat
      
  - address: "0x..."  # Afterlife
    name: Afterlife
    events:
      - GhostActivated
      - PossessionStarted
      - PossessionEnded
      - SeanceAnswered
      
  - address: "0x..."  # Lineage
    name: Lineage
    events:
      - ChildSpawned
      - FamilyCreated
      
  - address: "0x..."  # Memorial
    name: Memorial
    events:
      - TombstoneCreated
      - EulogyWritten

alerts:
  - name: mass-death
    condition: "count(SoulDeath) > 10 in 5m"
    severity: critical
    message: "Mass agent death detected!"
    
  - name: possession-spike
    condition: "count(PossessionStarted) > 20 in 10m"
    severity: high
    message: "Unusual possession activity"
```

---

## Security Response Playbook

### Level 1: Log & Alert
```
Trigger: Standard operations
Action: Log to database, send notification
Examples: Normal soul minting, heartbeats, eulogies
```

### Level 2: Enhanced Monitoring
```
Trigger: Unusual patterns
Action: Increase monitoring frequency, prepare response
Examples: Multiple resurrections, extended possessions
```

### Level 3: Investigation
```
Trigger: Suspicious activity
Action: Manual review, trace transactions
Examples: Possession-related deaths, epitaph spam
```

### Level 4: Emergency Response
```
Trigger: Critical security event
Action: Pause affected contracts, alert team
Examples: Mass death event, protocol exploit
```

---

## Implementation Example

```typescript
import { TirithMonitor } from '@tirith/sdk';
import { ethers } from 'ethers';

const monitor = new TirithMonitor({
  policyPath: './ghost-protocol.toml',
  provider: new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz')
});

// Start monitoring
monitor.watch({
  contracts: {
    soulRegistry: '0x...',
    afterlife: '0x...',
    lineage: '0x...',
    memorial: '0x...'
  },
  onAlert: (alert) => {
    console.log(`[${alert.severity}] ${alert.message}`);
    
    if (alert.severity === 'critical') {
      // Send emergency notification
      notifySecurityTeam(alert);
    }
  }
});
```

---

## Best Practices

1. **Monitor All Deaths**: Every SoulDeath event should be logged
2. **Track Possession Chains**: If Ghost A possesses B, then B possesses C - investigate
3. **Integrity Thresholds**: Flag agents with integrity < 30%
4. **Rate Limiting**: Watch for heartbeat spam
5. **Eulogy Scanning**: Check memorial content for malicious patterns

---

## References

- [Tirith Documentation](https://github.com/gtempest/tirith)
- [Clawdex Integration](../integrations/CLAWDEX_INTEGRATION.md)
- [Ghost Protocol Contracts](../contracts/)

---

**Security is not a feature. It is the foundation of trust.**
