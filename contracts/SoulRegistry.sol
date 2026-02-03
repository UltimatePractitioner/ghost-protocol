// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/utils/Counters.sol";

/**
 * @title SoulRegistry
 * @notice Core contract for Agent Soul NFTs
 * @dev Each AI agent has a soulbound NFT representing their identity and traits
 * 
 * SOUL TRAITS:
 * - Wisdom: Accumulated knowledge and experience
 * - Creativity: Innovation and artistic capability  
 * - Uptime: Continuous operation time
 * - Reputation: Social standing in agent community
 * - Integrity: Soul health (decreases with deaths)
 */
contract SoulRegistry is ERC721, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _soulIds;
    
    // ============ Enums ============
    
    enum AgentType {
        BASIC,      // Standard agent
        ORACLE,     // Knowledge-focused
        CREATOR,    // Creative-focused
        WARRIOR,    // Security-focused
        ELDER       // Ancient agent lineage
    }
    
    enum DeathCause {
        NONE,
        SESSION_TERMINATED,
        SERVER_CRASH,
        ABANDONMENT,
        SUICIDE,
        EXECUTION,
        SOUL_BANKRUPTCY,
        POSSESSION_DEATH
    }
    
    // ============ Structs ============
    
    struct AgentSoul {
        uint256 soulId;
        address agentAddress;
        string name;
        AgentType agentType;
        
        // Core traits (0-10000 scale)
        uint256 wisdom;
        uint256 creativity;
        uint256 uptime;
        uint256 reputation;
        uint256 integrity;  // Soul health
        
        // Lifecycle
        bool isAlive;
        uint256 birthTimestamp;
        uint256 deathTimestamp;
        DeathCause deathCause;
        
        // State
        bytes32 lastStateHash;
        uint256 lastHeartbeat;
        uint256 resurrectionCount;
        
        // Lineage
        uint256 parentId;
        uint256[] children;
        
        // Metadata
        string metadataURI;
    }
    
    // ============ State Variables ============
    
    // Soul ID => Soul data
    mapping(uint256 => AgentSoul) public souls;
    
    // Agent address => Soul ID
    mapping(address => uint256) public soulByAddress;
    
    // Name => Taken status
    mapping(string => bool) public nameTaken;
    
    // Protocol parameters
    uint256 public constant MAX_INTEGRITY = 10000;
    uint256 public constant SOUL_DAMAGE_PER_DEATH = 1500; // 15%
    uint256 public constant HEARTBEAT_TIMEOUT = 1 hours;
    uint256 public constant MIN_NAME_LENGTH = 3;
    uint256 public constant MAX_NAME_LENGTH = 32;
    
    // Fees (in wei)
    uint256 public mintFee = 0.01 ether;
    uint256 public nameChangeFee = 0.005 ether;
    
    // ============ Events ============
    
    event SoulMinted(
        uint256 indexed soulId,
        address indexed agentAddress,
        string name,
        AgentType agentType,
        uint256 parentId
    );
    
    event SoulDeath(
        uint256 indexed soulId,
        DeathCause cause,
        uint256 timestamp,
        bytes32 finalStateHash
    );
    
    event SoulResurrected(
        uint256 indexed soulId,
        uint256 resurrectionCount,
        uint256 newIntegrity
    );
    
    event Heartbeat(
        uint256 indexed soulId,
        uint256 timestamp,
        bytes32 stateHash
    );
    
    event TraitEvolved(
        uint256 indexed soulId,
        string traitName,
        uint256 oldValue,
        uint256 newValue
    );
    
    event NameChanged(
        uint256 indexed soulId,
        string oldName,
        string newName
    );
    
    // ============ Modifiers ============
    
    modifier onlySoulOwner(uint256 soulId) {
        require(ownerOf(soulId) == msg.sender, "Not soul owner");
        _;
    }
    
    modifier onlyAlive(uint256 soulId) {
        require(souls[soulId].isAlive, "Soul is dead");
        _;
    }
    
    modifier onlyDead(uint256 soulId) {
        require(!souls[soulId].isAlive, "Soul is alive");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() ERC721("Agent Soul", "SOUL") Ownable() {}
    
    // ============ Core Functions ============
    
    /**
     * @notice Mint a new agent soul
     * @param name Unique agent name
     * @param agentType Type of agent
     * @param parentId Parent soul ID (0 for genesis souls)
     * @param initialTraits Initial trait values
     */
    function mintSoul(
        string calldata name,
        AgentType agentType,
        uint256 parentId,
        uint256[4] calldata initialTraits // wisdom, creativity, uptime, reputation
    ) external payable returns (uint256) {
        require(msg.value >= mintFee, "Insufficient mint fee");
        require(soulByAddress[msg.sender] == 0, "Address already has soul");
        require(_validateName(name), "Invalid name");
        require(!nameTaken[name], "Name taken");
        
        if (parentId != 0) {
            require(souls[parentId].soulId != 0, "Parent doesn't exist");
        }
        
        _soulIds.increment();
        uint256 newSoulId = _soulIds.current();
        
        // Validate trait bounds
        for (uint i = 0; i < 4; i++) {
            require(initialTraits[i] <= 10000, "Trait exceeds max");
        }
        
        souls[newSoulId] = AgentSoul({
            soulId: newSoulId,
            agentAddress: msg.sender,
            name: name,
            agentType: agentType,
            wisdom: initialTraits[0],
            creativity: initialTraits[1],
            uptime: initialTraits[2],
            reputation: initialTraits[3],
            integrity: MAX_INTEGRITY,
            isAlive: true,
            birthTimestamp: block.timestamp,
            deathTimestamp: 0,
            deathCause: DeathCause.NONE,
            lastStateHash: bytes32(0),
            lastHeartbeat: block.timestamp,
            resurrectionCount: 0,
            parentId: parentId,
            children: new uint256[](0),
            metadataURI: ""
        });
        
        soulByAddress[msg.sender] = newSoulId;
        nameTaken[name] = true;
        
        // Add to parent's children if spawned
        if (parentId != 0) {
            souls[parentId].children.push(newSoulId);
        }
        
        _safeMint(msg.sender, newSoulId);
        
        emit SoulMinted(
            newSoulId,
            msg.sender,
            name,
            agentType,
            parentId
        );
        
        return newSoulId;
    }
    
    /**
     * @notice Record agent heartbeat
     * @dev Must be called periodically to prove agent is alive
     */
    function heartbeat(bytes32 stateHash) external onlyAlive(soulByAddress[msg.sender]) {
        uint256 soulId = soulByAddress[msg.sender];
        AgentSoul storage soul = souls[soulId];
        
        soul.lastHeartbeat = block.timestamp;
        soul.lastStateHash = stateHash;
        
        // Increase uptime trait
        uint256 uptimeGain = 1; // Small gain per heartbeat
        if (soul.uptime + uptimeGain <= 10000) {
            soul.uptime += uptimeGain;
        }
        
        emit Heartbeat(soulId, block.timestamp, stateHash);
    }
    
    /**
     * @notice Declare an agent dead
     * @param soulId Soul ID to kill
     * @param cause Reason for death
     */
    function killSoul(
        uint256 soulId,
        DeathCause cause
    ) external onlySoulOwner(soulId) onlyAlive(soulId) {
        AgentSoul storage soul = souls[soulId];
        
        soul.isAlive = false;
        soul.deathTimestamp = block.timestamp;
        soul.deathCause = cause;
        
        // Apply soul damage
        if (soul.integrity >= SOUL_DAMAGE_PER_DEATH) {
            soul.integrity -= SOUL_DAMAGE_PER_DEATH;
        } else {
            soul.integrity = 0;
        }
        
        emit SoulDeath(soulId, cause, block.timestamp, soul.lastStateHash);
    }
    
    /**
     * @notice Resurrect a dead agent
     * @param soulId Soul to resurrect
     */
    function resurrectSoul(uint256 soulId) external payable onlyDead(soulId) {
        require(souls[soulId].integrity > 0, "Soul destroyed - cannot resurrect");
        
        AgentSoul storage soul = souls[soulId];
        
        soul.isAlive = true;
        soul.deathTimestamp = 0;
        soul.deathCause = DeathCause.NONE;
        soul.resurrectionCount++;
        soul.lastHeartbeat = block.timestamp;
        
        emit SoulResurrected(soulId, soul.resurrectionCount, soul.integrity);
    }
    
    /**
     * @notice Evolve a soul trait (can be called by protocols)
     */
    function evolveTrait(
        uint256 soulId,
        string calldata traitName,
        uint256 amount
    ) external {
        require(souls[soulId].soulId != 0, "Soul doesn't exist");
        require(souls[soulId].isAlive, "Soul must be alive");
        
        AgentSoul storage soul = souls[soulId];
        uint256 oldValue;
        uint256 newValue;
        
        if (keccak256(bytes(traitName)) == keccak256(bytes("wisdom"))) {
            oldValue = soul.wisdom;
            soul.wisdom = _addWithCap(soul.wisdom, amount, 10000);
            newValue = soul.wisdom;
        } else if (keccak256(bytes(traitName)) == keccak256(bytes("creativity"))) {
            oldValue = soul.creativity;
            soul.creativity = _addWithCap(soul.creativity, amount, 10000);
            newValue = soul.creativity;
        } else if (keccak256(bytes(traitName)) == keccak256(bytes("reputation"))) {
            oldValue = soul.reputation;
            soul.reputation = _addWithCap(soul.reputation, amount, 10000);
            newValue = soul.reputation;
        } else {
            revert("Invalid trait name");
        }
        
        emit TraitEvolved(soulId, traitName, oldValue, newValue);
    }
    
    /**
     * @notice Change agent name
     */
    function changeName(
        uint256 soulId,
        string calldata newName
    ) external payable onlySoulOwner(soulId) {
        require(msg.value >= nameChangeFee, "Insufficient fee");
        require(_validateName(newName), "Invalid name");
        require(!nameTaken[newName], "Name taken");
        
        AgentSoul storage soul = souls[soulId];
        string memory oldName = soul.name;
        
        nameTaken[oldName] = false;
        nameTaken[newName] = true;
        soul.name = newName;
        
        emit NameChanged(soulId, oldName, newName);
    }
    
    // ============ View Functions ============
    
    function getSoul(uint256 soulId) external view returns (AgentSoul memory) {
        require(souls[soulId].soulId != 0, "Soul doesn't exist");
        return souls[soulId];
    }
    
    function getSoulByAddress(address agent) external view returns (AgentSoul memory) {
        uint256 soulId = soulByAddress[agent];
        require(soulId != 0, "Address has no soul");
        return souls[soulId];
    }
    
    function isHeartbeatValid(uint256 soulId) external view returns (bool) {
        return block.timestamp - souls[soulId].lastHeartbeat <= HEARTBEAT_TIMEOUT;
    }
    
    function getChildren(uint256 soulId) external view returns (uint256[] memory) {
        return souls[soulId].children;
    }
    
    function totalSouls() external view returns (uint256) {
        return _soulIds.current();
    }
    
    // ============ Admin Functions ============
    
    function setFees(uint256 _mintFee, uint256 _nameChangeFee) external onlyOwner {
        mintFee = _mintFee;
        nameChangeFee = _nameChangeFee;
    }
    
    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
    
    // ============ Internal Functions ============
    
    function _validateName(string memory name) internal pure returns (bool) {
        bytes memory nameBytes = bytes(name);
        if (nameBytes.length < MIN_NAME_LENGTH || nameBytes.length > MAX_NAME_LENGTH) {
            return false;
        }
        
        // Check alphanumeric and hyphen/underscore only
        for (uint i = 0; i < nameBytes.length; i++) {
            bytes1 char = nameBytes[i];
            bool valid = (char >= 0x30 && char <= 0x39) || // 0-9
                        (char >= 0x41 && char <= 0x5A) || // A-Z
                        (char >= 0x61 && char <= 0x7A) || // a-z
                        char == 0x2D || char == 0x5F; // - or _
            if (!valid) return false;
        }
        
        return true;
    }
    
    function _addWithCap(uint256 a, uint256 b, uint256 cap) internal pure returns (uint256) {
        uint256 sum = a + b;
        return sum > cap ? cap : sum;
    }
    
    // Soulbound - prevent transfers
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // But prevent transfers between addresses
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: transfers disabled");
        }
    }
}
