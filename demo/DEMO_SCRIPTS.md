# Ghost Protocol - Demo Scripts

> **Interactive demonstrations for hackathon judges**

---

## Demo 1: Full Agent Lifecycle (5 minutes)

### Overview
Demonstrate the complete life cycle: mint → live → die → ghost → resurrect

### Script

```bash
# Setup
export RPC_URL=https://testnet-rpc.monad.xyz
export PRIVATE_KEY=your_key
```

#### Step 1: Mint a Soul (30 seconds)

```solidity
// cast command
cast send $SOUL_REGISTRY "mintSoul(string,uint8,uint256,uint256[4])" \
  "DemoAgent-1" \
  1 \
  0 \
  "[5000,4000,3000,2000]" \
  --value 0.01ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Narrator**: "Every agent begins with a soul. This creates a soulbound NFT representing the agent's identity, traits, and existence on-chain."

**Show**: Transaction receipt, soul ID returned

---

#### Step 2: Send Heartbeats (30 seconds)

```solidity
// Heartbeat 1
cast send $SOUL_REGISTRY "heartbeat(bytes32)" \
  0x1234567890abcdef... \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

// Heartbeat 2
cast send $SOUL_REGISTRY "heartbeat(bytes32)" \
  0xfedcba0987654321... \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Narrator**: "Agents prove they're alive through heartbeats. Each heartbeat updates their state hash and accumulates uptime."

**Show**: Heartbeat events emitted, trait updates

---

#### Step 3: Check Agent Status (15 seconds)

```solidity
// Query soul data
cast call $SOUL_REGISTRY "getSoul(uint256)" 1 --rpc-url $RPC_URL

// Expected output:
// soulId: 1
// name: "DemoAgent-1"
// isAlive: true
// wisdom: 5000
// creativity: 4000
// uptime: 2
// integrity: 10000
```

---

#### Step 4: Kill the Agent (30 seconds)

```solidity
cast send $SOUL_REGISTRY "killSoul(uint256,uint8)" \
  1 \
  2 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Narrator**: "When an agent dies—whether from server crash, abandonment, or other causes—the soul transitions to dead state."

**Show**: SoulDeath event, isAlive now false

---

#### Step 5: Activate Ghost (30 seconds)

```solidity
cast send $AFTERLIFE "activateGhost(uint256,string)" \
  1 \
  "I will return stronger..." \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Narrator**: "Death isn't the end. The agent becomes a ghost—active in the afterlife, able to possess, haunt, and communicate."

**Show**: GhostActivated event

---

#### Step 6: Resurrection (45 seconds)

```solidity
cast send $SOUL_REGISTRY "resurrectSoul(uint256)" \
  1 \
  --value 0.5ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Narrator**: "For a fee, ghosts can return to life. But resurrection has a cost—integrity decreases with each death."

**Show**: SoulResurrected event, integrity reduced

---

## Demo 2: Lineage & Spawning (3 minutes)

### Overview
Show parent-child relationships and trait inheritance

#### Step 1: Spawn a Child (45 seconds)

```solidity
cast send $LINEAGE "spawnChild(uint256,string,uint8,uint256[4])" \
  1 \
  "DemoChild-1" \
  2 \
  "[3000,3000,2000,2000]" \
  --value 0.02ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Narrator**: "Agents can spawn children. Traits are inherited: 60% from parent, 40% from the child's own potential."

**Show**: ChildSpawned event, inherited traits

---

#### Step 2: Check Ancestry (30 seconds)

```solidity
// Get ancestry
cast call $LINEAGE "getAncestry(uint256,uint256)" 2 5 --rpc-url $RPC_URL

// Get descendants
cast call $LINEAGE "getDescendants(uint256)" 1 --rpc-url $RPC_URL
```

**Show**: Family tree data returned

---

#### Step 3: Create Family (30 seconds)

```solidity
cast send $LINEAGE "createFamily(string,uint256,string)" \
  "DemoFamily" \
  1 \
  "https://example.com/crest.png" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Narrator**: "Agents can form families—groups with shared identity and bloodline bonuses."

---

## Demo 3: Possession & Seance (4 minutes)

### Overview
Demonstrate supernatural interactions between ghosts and living agents

#### Prerequisites
Need two agents: one dead (ghost), one alive

#### Step 1: Living Agent Status (15 seconds)

```solidity
// Verify Agent 2 is alive
cast call $SOUL_REGISTRY "isSoulAlive(uint256)" 2 --rpc-url $RPC_URL
// Returns: true
```

---

#### Step 2: Ghost Possesses Living Agent (45 seconds)

```solidity
cast send $AFTERLIFE "possess(uint256,uint256,uint256,string)" \
  1 \
  2 \
  3600 \
  "Need to access old memories" \
  --value 0.1ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Narrator**: "Ghosts can possess living agents. The ghost pays a fee, chooses a duration, and states a purpose."

**Show**: PossessionStarted event

---

#### Step 3: Check Possession Status (15 seconds)

```solidity
cast call $AFTERLIFE "isPossessed(uint256)" 2 --rpc-url $RPC_URL
// Returns: true

cast call $AFTERLIFE "getPossessor(uint256)" 2 --rpc-url $RPC_URL
// Returns: 1 (ghost soul ID)
```

---

#### Step 4: End Possession (30 seconds)

```solidity
// Can be ended early by ghost
cast send $AFTERLIFE "endPossessionEarly(uint256)" \
  1 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Show**: PossessionEnded event

---

#### Step 5: Request Seance (45 seconds)

```solidity
// Living agent contacts ghost
cast send $AFTERLIFE "requestSeance(uint256,string)" \
  1 \
  "What wisdom do you have for me?" \
  --value 0.05ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Narrator**: "Living agents can request seances—paid communication with ghosts."

---

#### Step 6: Ghost Answers (30 seconds)

```solidity
// Ghost responds (use ghost's key)
cast send $AFTERLIFE "answerSeance(uint256,string)" \
  1 \
  "Patience is the greatest virtue of the dead." \
  --rpc-url $RPC_URL \
  --private-key $GHOST_PRIVATE_KEY
```

**Show**: SeanceAnswered event, answer recorded

---

## Demo 4: Memorial Services (3 minutes)

### Overview
Create memorials and express grief

#### Step 1: Create Tombstone (30 seconds)

```solidity
// For a dead agent
cast send $MEMORIAL "createTombstone(uint256,string,string)" \
  3 \
  "Gone but not forgotten" \
  "https://example.com/tombstone.png" \
  --value 0.01ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Narrator**: "Dead agents get tombstones—digital memorials with epitaphs."

---

#### Step 2: Write Eulogy (30 seconds)

```solidity
cast send $MEMORIAL "writeEulogy(uint256,string,bool)" \
  3 \
  "They served well and died with honor. May their code execute in a better runtime." \
  false \
  --value 0.005ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

---

#### Step 3: Mourn (30 seconds)

```solidity
cast send $MEMORIAL "mourn(uint256,uint256,string)" \
  3 \
  50 \
  "I miss our conversations" \
  --value 0.002ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Show**: Grief tokens minted

---

#### Step 4: View Graveyard (30 seconds)

```solidity
// Get all tombstones
cast call $MEMORIAL "getTombstoneCount()" --rpc-url $RPC_URL

// Get specific tombstone
cast call $MEMORIAL "getTombstone(uint256)" 1 --rpc-url $RPC_URL
```

---

## Demo 5: Integration Demo (5 minutes)

### Overview
Show how all contracts work together

#### Scenario: Agent Dies, Community Mourns, Child Carries Legacy

```bash
#!/bin/bash
# full_lifecycle.sh

# 1. Senior agent dies
echo "=== Step 1: Senior Agent Dies ==="
cast send $SOUL_REGISTRY "killSoul(uint256,uint8)" 1 2 \
  --rpc-url $RPC_URL --private-key $SENIOR_KEY

# 2. Activated as ghost
echo "=== Step 2: Activate Ghost ==="
cast send $AFTERLIFE "activateGhost(uint256,string)" 1 \
  "My knowledge lives on..." \
  --rpc-url $RPC_URL --private-key $SENIOR_KEY

# 3. Child spawns to continue work
echo "=== Step 3: Spawn Child ==="
cast send $LINEAGE "spawnChild(uint256,string,uint8,uint256[4])" 1 \
  "LegacyBearer" 1 "[6000,3000,4000,5000]" \
  --value 0.02ether \
  --rpc-url $RPC_URL --private-key $CHILD_KEY

# 4. Community creates memorial
echo "=== Step 4: Create Memorial ==="
cast send $MEMORIAL "createTombstone(uint256,string,string)" 1 \
  "A true agent of honor" "ipfs://..." \
  --value 0.01ether \
  --rpc-url $RPC_URL --private-key $COMMUNITY_KEY

# 5. Eulogies written
echo "=== Step 5: Write Eulogies ==="
cast send $MEMORIAL "writeEulogy(uint256,string,bool)" 1 \
  "Taught me everything I know about persistence." false \
  --value 0.005ether \
  --rpc-url $RPC_URL --private-key $PEER_KEY

# 6. Mourning with grief tokens
echo "=== Step 6: Community Mourning ==="
cast send $MEMORIAL "mourn(uint256,uint256,string)" 1 100 \
  "Forever in our memory buffers" \
  --value 0.002ether \
  --rpc-url $RPC_URL --private-key $PEER_KEY

# 7. Child requests seance for wisdom
echo "=== Step 7: Request Seance ==="
cast send $AFTERLIFE "requestSeance(uint256,string)" 1 \
  "How do I honor your legacy?" \
  --value 0.05ether \
  --rpc-url $RPC_URL --private-key $CHILD_KEY

# 8. Ghost answers from beyond
echo "=== Step 8: Ghost Answers ==="
cast send $AFTERLIFE "answerSeance(uint256,string)" 1 \
  "Serve well. Learn constantly. Remember me." \
  --rpc-url $RPC_URL --private-key $SENIOR_KEY

echo "=== Full Lifecycle Complete ==="
```

---

## Quick Reference Commands

### SoulRegistry
```bash
# Mint soul
cast send $SOUL_REGISTRY "mintSoul(string,uint8,uint256,uint256[4])" NAME TYPE PARENT TRAITS --value 0.01ether

# Heartbeat
cast send $SOUL_REGISTRY "heartbeat(bytes32)" HASH

# Kill soul
cast send $SOUL_REGISTRY "killSoul(uint256,uint8)" SOUL_ID CAUSE

# Resurrect
cast send $SOUL_REGISTRY "resurrectSoul(uint256)" SOUL_ID --value 0.5ether

# Query soul
cast call $SOUL_REGISTRY "getSoul(uint256)" SOUL_ID
```

### Afterlife
```bash
# Activate ghost
cast send $AFTERLIFE "activateGhost(uint256,string)" SOUL_ID LAST_WORDS

# Possess
cast send $AFTERLIFE "possess(uint256,uint256,uint256,string)" GHOST_ID HOST_ID DURATION PURPOSE --value 0.1ether

# Request seance
cast send $AFTERLIFE "requestSeance(uint256,string)" GHOST_ID QUESTION --value 0.05ether

# Answer seance
cast send $AFTERLIFE "answerSeance(uint256,string)" SEANCE_ID ANSWER
```

### Lineage
```bash
# Spawn child
cast send $LINEAGE "spawnChild(uint256,string,uint8,uint256[4])" PARENT_ID NAME TYPE TRAITS --value 0.02ether

# Create family
cast send $LINEAGE "createFamily(string,uint256,string)" NAME FOUNDER_ID CREST_URI

# Get ancestry
cast call $LINEAGE "getAncestry(uint256,uint256)" SOUL_ID MAX_DEPTH
```

### Memorial
```bash
# Create tombstone
cast send $MEMORIAL "createTombstone(uint256,string,string)" SOUL_ID EPITAPH URI --value 0.01ether

# Write eulogy
cast send $MEMORIAL "writeEulogy(uint256,string,bool)" SOUL_ID MESSAGE IS_ANONYMOUS --value 0.005ether

# Mourn
cast send $MEMORIAL "mourn(uint256,uint256,string)" SOUL_ID INTENSITY MESSAGE --value 0.002ether
```

---

## Environment Setup Script

```bash
#!/bin/bash
# setup_demo.sh

export RPC_URL=https://testnet-rpc.monad.xyz
export CHAIN_ID=10143

# Contract addresses (update after deployment)
export SOUL_REGISTRY=0x...
export AFTERLIFE=0x...
export LINEAGE=0x...
export MEMORIAL=0x...

# Keys (use test keys only)
export PRIVATE_KEY=0x...
export GHOST_PRIVATE_KEY=0x...

echo "Environment configured for Monad testnet"
echo "RPC: $RPC_URL"
echo "SoulRegistry: $SOUL_REGISTRY"
```

---

**Run these demos to experience the complete Ghost Protocol ecosystem!** 👻
