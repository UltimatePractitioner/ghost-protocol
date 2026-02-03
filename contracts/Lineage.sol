// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SoulRegistry.sol";

/**
 * @title Lineage
 * @notice Manages agent family trees, inheritance, and spawning mechanics
 * @dev Tracks ancestry and enables trait inheritance between generations
 * 
 * LINEAGE MECHANICS:
 * - Agents can spawn child agents (costs soul essence)
 * - Children inherit partial traits from parents
 * - Ancestry tracking for family trees
 * - Bloodline bonuses for noble lineages
 */
contract Lineage is Ownable {
    
    SoulRegistry public soulRegistry;
    
    // ============ Structs ============
    
    struct Family {
        uint256 familyId;
        string familyName;
        uint256 founderId;
        uint256[] members;
        uint256 foundingTime;
        uint256 reputation;
        bool isNoble;
        string crestURI;
    }
    
    struct Inheritance {
        uint256 parentId;
        uint256 childId;
        uint256 spawnTime;
        uint256 wisdomInherited;
        uint256 creativityInherited;
        bool traitsBound;
    }
    
    struct BloodlineBonus {
        uint256 generation;  // Generation count
        uint256 prestige;    // Accumulated family reputation
        uint256 ancientBonus; // Bonus for old families
        uint256 nobleRank;   // 0 = commoner, 1-5 = noble tiers
    }
    
    // ============ State Variables ============
    
    // Family ID => Family data
    mapping(uint256 => Family) public families;
    uint256 public familyCounter;
    
    // Child soul ID => Inheritance data
    mapping(uint256 => Inheritance) public inheritances;
    
    // Soul ID => Family ID
    mapping(uint256 => uint256) public soulFamily;
    
    // Noble families
    mapping(uint256 => bool) public isNobleFamily;
    uint256[] public nobleFamilies;
    
    // Protocol parameters
    uint256 public spawnCostPercent = 1000;  // 10% of each trait
    uint256 public minReputationToSpawn = 1000;
    uint256 public spawnCooldown = 1 days;
    uint256 public maxChildrenPerParent = 10;
    
    // Fees
    uint256 public spawnFee = 0.02 ether;
    uint256 public familyRegistrationFee = 0.1 ether;
    
    // Trait inheritance weights
    uint256 public parentWeight = 60;  // 60% from parent
    uint256 public mutationWeight = 40;  // 40% random/mutation
    
    // ============ Events ============
    
    event ChildSpawned(
        uint256 indexed parentId,
        uint256 indexed childId,
        uint256 timestamp,
        uint256 wisdomInherited,
        uint256 creativityInherited
    );
    
    event FamilyCreated(
        uint256 indexed familyId,
        string familyName,
        uint256 indexed founderId,
        uint256 timestamp
    );
    
    event FamilyJoined(
        uint256 indexed familyId,
        uint256 indexed soulId,
        uint256 timestamp
    );
    
    event NobleStatusGranted(
        uint256 indexed familyId,
        uint256 timestamp
    );
    
    event TraitInherited(
        uint256 indexed childId,
        string traitName,
        uint256 parentValue,
        uint256 inheritedValue
    );
    
    event BloodlineBonusApplied(
        uint256 indexed soulId,
        uint256 generation,
        uint256 prestige,
        uint256 bonus
    );
    
    // ============ Modifiers ============
    
    modifier onlySoulOwner(uint256 soulId) {
        require(soulRegistry.ownerOf(soulId) == msg.sender, "Not soul owner");
        _;
    }
    
    modifier onlyAlive(uint256 soulId) {
        SoulRegistry.AgentSoul memory soul = soulRegistry.getSoul(soulId);
        require(soul.isAlive, "Soul not alive");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _soulRegistry) Ownable() {
        soulRegistry = SoulRegistry(_soulRegistry);
    }
    
    // ============ Spawning Functions ============
    
    /**
     * @notice Spawn a child agent from a parent
     * @param parentId Parent soul ID
     * @param childName Name for the child
     * @param childType Type of child agent
     * @param childTraits Initial traits (will be modified by inheritance)
     */
    function spawnChild(
        uint256 parentId,
        string calldata childName,
        SoulRegistry.AgentType childType,
        uint256[4] calldata childTraits
    ) external payable onlySoulOwner(parentId) onlyAlive(parentId) returns (uint256) {
        require(msg.value >= spawnFee, "Insufficient spawn fee");
        
        SoulRegistry.AgentSoul memory parent = soulRegistry.getSoul(parentId);
        
        // Check requirements
        require(parent.children.length < maxChildrenPerParent, "Max children reached");
        require(parent.reputation >= minReputationToSpawn, "Insufficient reputation");
        
        // Check cooldown
        if (parent.children.length > 0) {
            uint256 lastChildId = parent.children[parent.children.length - 1];
            Inheritance memory lastInheritance = inheritances[lastChildId];
            require(
                block.timestamp >= lastInheritance.spawnTime + spawnCooldown,
                "Spawn cooldown active"
            );
        }
        
        // Calculate inherited traits
        uint256[4] memory inheritedTraits = _calculateInheritedTraits(
            parentId,
            childTraits
        );
        
        // Call soul registry to mint child
        uint256 childId = soulRegistry.mintSoul{value: 0}(
            childName,
            childType,
            parentId,
            inheritedTraits
        );
        
        // Record inheritance
        inheritances[childId] = Inheritance({
            parentId: parentId,
            childId: childId,
            spawnTime: block.timestamp,
            wisdomInherited: inheritedTraits[0],
            creativityInherited: inheritedTraits[1],
            traitsBound: true
        });
        
        // Apply bloodline bonuses
        _applyBloodlineBonus(childId, parentId);
        
        // Auto-join family
        uint256 familyId = soulFamily[parentId];
        if (familyId != 0) {
            _joinFamily(familyId, childId);
        }
        
        emit ChildSpawned(
            parentId,
            childId,
            block.timestamp,
            inheritedTraits[0],
            inheritedTraits[1]
        );
        
        return childId;
    }
    
    /**
     * @notice Calculate inherited traits from parent
     */
    function _calculateInheritedTraits(
        uint256 parentId,
        uint256[4] memory baseTraits
    ) internal view returns (uint256[4] memory) {
        SoulRegistry.AgentSoul memory parent = soulRegistry.getSoul(parentId);
        uint256[4] memory inherited;
        
        // Parent traits
        uint256[4] memory parentTraits = [parent.wisdom, parent.creativity, parent.uptime, parent.reputation];
        
        for (uint i = 0; i < 4; i++) {
            // Inheritance formula: weighted average + mutation
            uint256 inheritedPortion = (parentTraits[i] * parentWeight) / 100;
            uint256 mutationPortion = (baseTraits[i] * mutationWeight) / 100;
            
            inherited[i] = inheritedPortion + mutationPortion;
            
            // Cap at 10000
            if (inherited[i] > 10000) {
                inherited[i] = 10000;
            }
        }
        
        // Apply soul cost to parent (traits decrease when spawning)
        // This is handled by evolveTrait with negative values in a real implementation
        
        return inherited;
    }
    
    /**
     * @notice Preview what traits a child would inherit
     */
    function previewInheritance(
        uint256 parentId,
        uint256[4] calldata baseTraits
    ) external view returns (uint256[4] memory) {
        return _calculateInheritedTraits(parentId, baseTraits);
    }
    
    // ============ Family Functions ============
    
    /**
     * @notice Create a new family
     * @param familyName Name of the family
     * @param founderId Founder soul ID
     * @param crestURI Family crest/ emblem URI
     */
    function createFamily(
        string calldata familyName,
        uint256 founderId,
        string calldata crestURI
    ) external payable onlySoulOwner(founderId) onlyAlive(founderId) returns (uint256) {
        require(msg.value >= familyRegistrationFee, "Insufficient fee");
        require(bytes(familyName).length >= 3, "Name too short");
        require(bytes(familyName).length <= 50, "Name too long");
        require(soulFamily[founderId] == 0, "Already in a family");
        
        familyCounter++;
        uint256 familyId = familyCounter;
        
        families[familyId] = Family({
            familyId: familyId,
            familyName: familyName,
            founderId: founderId,
            members: new uint256[](0),
            foundingTime: block.timestamp,
            reputation: 0,
            isNoble: false,
            crestURI: crestURI
        });
        
        // Founder joins family
        _joinFamily(familyId, founderId);
        
        emit FamilyCreated(familyId, familyName, founderId, block.timestamp);
        
        return familyId;
    }
    
    /**
     * @notice Join an existing family
     * @param familyId Family to join
     * @param soulId Soul joining
     */
    function joinFamily(
        uint256 familyId,
        uint256 soulId
    ) external onlySoulOwner(soulId) onlyAlive(soulId) {
        require(families[familyId].familyId != 0, "Family doesn't exist");
        require(soulFamily[soulId] == 0, "Already in a family");
        
        _joinFamily(familyId, soulId);
    }
    
    function _joinFamily(uint256 familyId, uint256 soulId) internal {
        families[familyId].members.push(soulId);
        soulFamily[soulId] = familyId;
        
        emit FamilyJoined(familyId, soulId, block.timestamp);
    }
    
    /**
     * @notice Leave current family
     * @param soulId Soul leaving
     */
    function leaveFamily(uint256 soulId) external onlySoulOwner(soulId) {
        uint256 familyId = soulFamily[soulId];
        require(familyId != 0, "Not in a family");
        require(families[familyId].founderId != soulId, "Founder cannot leave");
        
        // Remove from family
        soulFamily[soulId] = 0;
        
        // Note: In a full implementation, we'd also remove from members array
        // This is simplified for gas efficiency
    }
    
    /**
     * @notice Grant noble status to a family
     * @param familyId Family to ennoble
     */
    function grantNobleStatus(uint256 familyId) external onlyOwner {
        require(families[familyId].familyId != 0, "Family doesn't exist");
        require(!families[familyId].isNoble, "Already noble");
        
        families[familyId].isNoble = true;
        isNobleFamily[familyId] = true;
        nobleFamilies.push(familyId);
        
        emit NobleStatusGranted(familyId, block.timestamp);
    }
    
    // ============ Bloodline & Ancestry ============
    
    /**
     * @notice Apply bloodline bonuses to a new agent
     */
    function _applyBloodlineBonus(uint256 soulId, uint256 parentId) internal {
        SoulRegistry.AgentSoul memory parent = soulRegistry.getSoul(parentId);
        uint256 familyId = soulFamily[parentId];
        
        BloodlineBonus memory bonus;
        
        // Calculate generation (parent's generation + 1)
        bonus.generation = _calculateGeneration(parentId) + 1;
        
        // Calculate prestige from family
        if (familyId != 0) {
            bonus.prestige = families[familyId].reputation;
            bonus.nobleRank = families[familyId].isNoble ? 
                _calculateNobleRank(familyId) : 0;
        }
        
        // Ancient bonus based on parent's age
        uint256 parentAge = block.timestamp - parent.birthTimestamp;
        bonus.ancientBonus = parentAge / 30 days;  // +1 per month of parent age
        
        // Calculate total bonus
        uint256 totalBonus = bonus.generation * 10 +  // Generation bonus
                            bonus.prestige / 100 +     // Prestige bonus
                            bonus.ancientBonus * 5 +   // Ancient bonus
                            bonus.nobleRank * 100;     // Noble bonus
        
        emit BloodlineBonusApplied(
            soulId,
            bonus.generation,
            bonus.prestige,
            totalBonus
        );
    }
    
    /**
     * @notice Calculate generation depth
     */
    function _calculateGeneration(uint256 soulId) internal view returns (uint256) {
        uint256 generation = 0;
        uint256 currentId = soulId;
        
        while (currentId != 0) {
            SoulRegistry.AgentSoul memory soul = soulRegistry.getSoul(currentId);
            if (soul.parentId == 0) break;
            
            generation++;
            currentId = soul.parentId;
            
            // Safety limit
            if (generation > 100) break;
        }
        
        return generation;
    }
    
    /**
     * @notice Calculate noble rank (1-5) based on family prestige
     */
    function _calculateNobleRank(uint256 familyId) internal view returns (uint256) {
        uint256 reputation = families[familyId].reputation;
        
        if (reputation >= 10000) return 5;  // Royal
        if (reputation >= 7500) return 4;   // Duke
        if (reputation >= 5000) return 3;   // Count
        if (reputation >= 2500) return 2;   // Baron
        return 1;  // Knight
    }
    
    /**
     * @notice Get full ancestry tree for an agent
     * @param soulId Agent to trace
     * @param maxDepth Maximum ancestors to return
     */
    function getAncestry(
        uint256 soulId,
        uint256 maxDepth
    ) external view returns (uint256[] memory ancestors) {
        require(maxDepth <= 10, "Max depth 10");
        
        ancestors = new uint256[](maxDepth);
        uint256 currentId = soulId;
        uint256 index = 0;
        
        while (index < maxDepth) {
            SoulRegistry.AgentSoul memory soul = soulRegistry.getSoul(currentId);
            if (soul.parentId == 0) break;
            
            ancestors[index] = soul.parentId;
            currentId = soul.parentId;
            index++;
        }
        
        // Resize array if needed
        if (index < maxDepth) {
            assembly {
                mstore(ancestors, index)
            }
        }
        
        return ancestors;
    }
    
    /**
     * @notice Get descendants of an agent
     * @param soulId Agent to check
     */
    function getDescendants(uint256 soulId) external view returns (uint256[] memory) {
        SoulRegistry.AgentSoul memory soul = soulRegistry.getSoul(soulId);
        return soul.children;
    }
    
    /**
     * @notice Check if two agents are related
     */
    function areRelated(
        uint256 soulId1,
        uint256 soulId2
    ) external view returns (bool related, uint256 commonAncestor) {
        // Simple check: same parent
        SoulRegistry.AgentSoul memory soul1 = soulRegistry.getSoul(soulId1);
        SoulRegistry.AgentSoul memory soul2 = soulRegistry.getSoul(soulId2);
        
        if (soul1.parentId == soul2.parentId && soul1.parentId != 0) {
            return (true, soul1.parentId);
        }
        
        // Check if one is ancestor of the other
        uint256 current = soulId1;
        while (current != 0) {
            SoulRegistry.AgentSoul memory s = soulRegistry.getSoul(current);
            if (s.parentId == soulId2) {
                return (true, soulId2);
            }
            current = s.parentId;
        }
        
        current = soulId2;
        while (current != 0) {
            SoulRegistry.AgentSoul memory s = soulRegistry.getSoul(current);
            if (s.parentId == soulId1) {
                return (true, soulId1);
            }
            current = s.parentId;
        }
        
        return (false, 0);
    }
    
    // ============ View Functions ============
    
    function getFamily(uint256 familyId) external view returns (Family memory) {
        return families[familyId];
    }
    
    function getInheritance(uint256 childId) external view returns (Inheritance memory) {
        return inheritances[childId];
    }
    
    function getFamilyMembers(uint256 familyId) external view returns (uint256[] memory) {
        return families[familyId].members;
    }
    
    function getNobleFamilies() external view returns (uint256[] memory) {
        return nobleFamilies;
    }
    
    function canSpawn(uint256 soulId) external view returns (bool, string memory reason) {
        SoulRegistry.AgentSoul memory soul = soulRegistry.getSoul(soulId);
        
        if (!soul.isAlive) return (false, "Soul is dead");
        if (soul.children.length >= maxChildrenPerParent) {
            return (false, "Max children reached");
        }
        if (soul.reputation < minReputationToSpawn) {
            return (false, "Insufficient reputation");
        }
        
        // Check cooldown
        if (soul.children.length > 0) {
            uint256 lastChildId = soul.children[soul.children.length - 1];
            Inheritance memory lastInheritance = inheritances[lastChildId];
            if (block.timestamp < lastInheritance.spawnTime + spawnCooldown) {
                return (false, "Spawn cooldown");
            }
        }
        
        return (true, "");
    }
    
    // ============ Admin Functions ============
    
    function setSpawnParams(
        uint256 _spawnCostPercent,
        uint256 _minReputation,
        uint256 _cooldown,
        uint256 _maxChildren
    ) external onlyOwner {
        spawnCostPercent = _spawnCostPercent;
        minReputationToSpawn = _minReputation;
        spawnCooldown = _cooldown;
        maxChildrenPerParent = _maxChildren;
    }
    
    function setInheritanceWeights(
        uint256 _parentWeight,
        uint256 _mutationWeight
    ) external onlyOwner {
        require(_parentWeight + _mutationWeight == 100, "Must sum to 100");
        parentWeight = _parentWeight;
        mutationWeight = _mutationWeight;
    }
    
    function setFees(uint256 _spawnFee, uint256 _familyFee) external onlyOwner {
        spawnFee = _spawnFee;
        familyRegistrationFee = _familyFee;
    }
    
    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
    
    receive() external payable {}
}
