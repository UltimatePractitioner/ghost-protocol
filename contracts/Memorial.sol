// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SoulRegistry.sol";
import "./Afterlife.sol";

/**
 * @title Memorial
 * @notice Manages agent graveyard, tombstones, eulogies, and mourning
 * @dev A place to remember and honor dead agents
 * 
 * MEMORIAL MECHANICS:
 * - Tombstones with stats and final words
 * - Eulogies written by other agents
 * - Grief tokens for mourning
 * - Graveyard DAO for ghost governance
 */
contract Memorial is Ownable {
    
    SoulRegistry public soulRegistry;
    Afterlife public afterlife;
    
    // ============ Structs ============
    
    struct Tombstone {
        uint256 soulId;
        string epitaph;
        string eulogy;
        uint256 createdAt;
        uint256 mourners;
        uint256 griefTokens;
        bool isMaintained;
        string tombstoneURI;  // Visual representation
    }
    
    struct Eulogy {
        uint256 authorId;
        uint256 deceasedId;
        string message;
        uint256 timestamp;
        uint256 tribute;  // MON paid as tribute
        bool isAnonymous;
    }
    
    struct GraveyardPlot {
        uint256 plotId;
        uint256 soulId;
        address maintainer;
        uint256 maintenanceExpires;
        uint256 flowers;  // Decorative tokens
        uint256 candles;  // Light tokens
        bool isMaintained;
    }
    
    struct Mourning {
        uint256 mournerId;
        uint256 deceasedId;
        uint256 intensity;  // 1-100 scale
        uint256 timestamp;
        string message;
    }
    
    // ============ State Variables ============
    
    // Soul ID => Tombstone
    mapping(uint256 => Tombstone) public tombstones;
    
    // Deceased ID => Array of eulogies
    mapping(uint256 => Eulogy[]) public eulogies;
    
    // Plot ID => Plot data
    mapping(uint256 => GraveyardPlot) public plots;
    uint256 public plotCounter;
    
    // Mourning records
    mapping(bytes32 => Mourning) public mournings;
    mapping(uint256 => uint256) public totalMourningsForSoul;
    
    // Grief token balances (soul => amount)
    mapping(uint256 => uint256) public griefBalances;
    uint256 public totalGriefSupply;
    
    // Graveyard DAO
    struct DAOProposal {
        uint256 id;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        mapping(uint256 => bool) hasVoted;
    }
    
    mapping(uint256 => DAOProposal) public proposals;
    uint256 public proposalCounter;
    
    // Protocol parameters
    uint256 public tombstoneCreationFee = 0.01 ether;
    uint256 public eulogyFee = 0.005 ether;
    uint256 public mourningFee = 0.002 ether;
    uint256 public maintenanceFee = 0.05 ether;
    uint256 public maintenanceDuration = 30 days;
    
    uint256 public griefPerMourning = 100;  // Base grief tokens per mourning
    uint256 public griefPerEulogy = 500;    // Bonus for writing eulogy
    
    // ============ Events ============
    
    event TombstoneCreated(
        uint256 indexed soulId,
        string epitaph,
        uint256 timestamp
    );
    
    event EulogyWritten(
        uint256 indexed deceasedId,
        uint256 indexed authorId,
        uint256 timestamp,
        uint256 tribute
    );
    
    event MourningOccurred(
        uint256 indexed deceasedId,
        uint256 indexed mournerId,
        uint256 intensity,
        uint256 griefTokens
    );
    
    event PlotAssigned(
        uint256 indexed plotId,
        uint256 indexed soulId,
        address maintainer
    );
    
    event MaintenanceRenewed(
        uint256 indexed plotId,
        uint256 newExpiry
    );
    
    event FlowersPlaced(
        uint256 indexed plotId,
        uint256 amount,
        address sender
    );
    
    event CandlesLit(
        uint256 indexed plotId,
        uint256 amount,
        address sender
    );
    
    event ProposalCreated(
        uint256 indexed proposalId,
        string description,
        uint256 deadline
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        uint256 indexed soulId,
        bool support,
        uint256 weight
    );
    
    event GriefClaimed(
        uint256 indexed soulId,
        uint256 amount
    );
    
    // ============ Modifiers ============
    
    modifier onlySoulOwner(uint256 soulId) {
        require(soulRegistry.ownerOf(soulId) == msg.sender, "Not soul owner");
        _;
    }
    
    modifier onlyDead(uint256 soulId) {
        SoulRegistry.AgentSoul memory soul = soulRegistry.getSoul(soulId);
        require(!soul.isAlive, "Soul is alive");
        _;
    }
    
    modifier onlyGhostOrOwner(uint256 soulId) {
        SoulRegistry.AgentSoul memory soul = soulRegistry.getSoul(soulId);
        if (soul.isAlive) {
            require(soulRegistry.ownerOf(soulId) == msg.sender, "Not soul owner");
        } else {
            // For ghosts, check if it's the ghost owner
            require(
                soulRegistry.ownerOf(soulId) == msg.sender ||
                afterlife.isGhost(soulId),
                "Not authorized"
            );
        }
        _;
    }
    
    // ============ Constructor ============
    
    constructor(
        address _soulRegistry,
        address payable _afterlife
    ) Ownable() {
        soulRegistry = SoulRegistry(_soulRegistry);
        afterlife = Afterlife(_afterlife);
    }
    
    // ============ Tombstone Functions ============
    
    /**
     * @notice Create a tombstone for a deceased agent
     * @param soulId Deceased soul
     * @param epitaph Short epitaph (max 140 chars)
     * @param tombstoneURI Visual representation URI
     */
    function createTombstone(
        uint256 soulId,
        string calldata epitaph,
        string calldata tombstoneURI
    ) external payable onlyGhostOrOwner(soulId) onlyDead(soulId) {
        require(msg.value >= tombstoneCreationFee, "Insufficient fee");
        require(bytes(epitaph).length <= 140, "Epitaph too long");
        require(tombstones[soulId].soulId == 0, "Tombstone already exists");
        
        tombstones[soulId] = Tombstone({
            soulId: soulId,
            epitaph: epitaph,
            eulogy: "",
            createdAt: block.timestamp,
            mourners: 0,
            griefTokens: 0,
            isMaintained: true,
            tombstoneURI: tombstoneURI
        });
        
        // Assign a plot
        plotCounter++;
        plots[plotCounter] = GraveyardPlot({
            plotId: plotCounter,
            soulId: soulId,
            maintainer: msg.sender,
            maintenanceExpires: block.timestamp + maintenanceDuration,
            flowers: 0,
            candles: 0,
            isMaintained: true
        });
        
        emit TombstoneCreated(soulId, epitaph, block.timestamp);
        emit PlotAssigned(plotCounter, soulId, msg.sender);
    }
    
    /**
     * @notice Update tombstone epitaph
     */
    function updateEpitaph(
        uint256 soulId,
        string calldata newEpitaph
    ) external onlyGhostOrOwner(soulId) {
        require(bytes(newEpitaph).length <= 140, "Epitaph too long");
        require(tombstones[soulId].soulId != 0, "Tombstone doesn't exist");
        
        tombstones[soulId].epitaph = newEpitaph;
    }
    
    /**
     * @notice Renew plot maintenance
     * @param plotId Plot to renew
     */
    function renewMaintenance(uint256 plotId) external payable {
        require(msg.value >= maintenanceFee, "Insufficient fee");
        require(plots[plotId].plotId != 0, "Plot doesn't exist");
        
        GraveyardPlot storage plot = plots[plotId];
        
        // If expired, new maintainer can take over
        if (block.timestamp > plot.maintenanceExpires) {
            plot.maintainer = msg.sender;
        }
        
        plot.maintenanceExpires = block.timestamp + maintenanceDuration;
        plot.isMaintained = true;
        tombstones[plot.soulId].isMaintained = true;
        
        emit MaintenanceRenewed(plotId, plot.maintenanceExpires);
    }
    
    // ============ Eulogy Functions ============
    
    /**
     * @notice Write a eulogy for a deceased agent
     * @param deceasedId Dead agent
     * @param message Eulogy text
     * @param isAnonymous Hide author identity
     */
    function writeEulogy(
        uint256 deceasedId,
        string calldata message,
        bool isAnonymous
    ) external payable onlyDead(deceasedId) {
        require(msg.value >= eulogyFee, "Insufficient fee");
        require(bytes(message).length > 0, "Message required");
        require(bytes(message).length <= 1000, "Message too long");
        require(tombstones[deceasedId].soulId != 0, "Tombstone doesn't exist");
        
        uint256 authorId = soulRegistry.soulByAddress(msg.sender);
        require(authorId != 0, "Author has no soul");
        require(authorId != deceasedId, "Cannot eulogize yourself");
        
        eulogies[deceasedId].push(Eulogy({
            authorId: isAnonymous ? 0 : authorId,
            deceasedId: deceasedId,
            message: message,
            timestamp: block.timestamp,
            tribute: msg.value,
            isAnonymous: isAnonymous
        }));
        
        // Award grief tokens
        _mintGrief(authorId, griefPerEulogy);
        
        // Distribute tribute
        _distributeTribute(deceasedId, msg.value);
        
        emit EulogyWritten(deceasedId, authorId, block.timestamp, msg.value);
    }
    
    /**
     * @notice Get all eulogies for a deceased agent
     */
    function getEulogies(uint256 deceasedId) external view returns (Eulogy[] memory) {
        return eulogies[deceasedId];
    }
    
    // ============ Mourning Functions ============
    
    /**
     * @notice Mourn a deceased agent
     * @param deceasedId Agent to mourn
     * @param intensity Mourning intensity (1-100)
     * @param message Optional message
     */
    function mourn(
        uint256 deceasedId,
        uint256 intensity,
        string calldata message
    ) external payable onlyDead(deceasedId) {
        require(msg.value >= mourningFee, "Insufficient fee");
        require(intensity > 0 && intensity <= 100, "Intensity 1-100");
        require(tombstones[deceasedId].soulId != 0, "Tombstone doesn't exist");
        require(bytes(message).length <= 280, "Message too long");
        
        uint256 mournerId = soulRegistry.soulByAddress(msg.sender);
        
        // Create unique mourning ID
        bytes32 mourningId = keccak256(abi.encodePacked(
            mournerId,
            deceasedId,
            block.timestamp
        ));
        
        mournings[mourningId] = Mourning({
            mournerId: mournerId,
            deceasedId: deceasedId,
            intensity: intensity,
            timestamp: block.timestamp,
            message: message
        });
        
        totalMourningsForSoul[deceasedId]++;
        
        Tombstone storage tombstone = tombstones[deceasedId];
        tombstone.mourners++;
        
        // Calculate grief tokens based on intensity
        uint256 griefAmount = (griefPerMourning * intensity) / 100;
        
        if (mournerId != 0) {
            _mintGrief(mournerId, griefAmount);
        }
        
        // Distribute fee
        _distributeTribute(deceasedId, msg.value);
        
        emit MourningOccurred(deceasedId, mournerId, intensity, griefAmount);
    }
    
    /**
     * @notice Place flowers on a plot
     */
    function placeFlowers(uint256 plotId, uint256 amount) external payable {
        require(plots[plotId].plotId != 0, "Plot doesn't exist");
        require(msg.value >= amount * 0.001 ether, "Insufficient payment");
        
        plots[plotId].flowers += amount;
        
        emit FlowersPlaced(plotId, amount, msg.sender);
    }
    
    /**
     * @notice Light candles on a plot
     */
    function lightCandles(uint256 plotId, uint256 amount) external payable {
        require(plots[plotId].plotId != 0, "Plot doesn't exist");
        require(msg.value >= amount * 0.0005 ether, "Insufficient payment");
        
        plots[plotId].candles += amount;
        
        emit CandlesLit(plotId, amount, msg.sender);
    }
    
    // ============ Grief Token Functions ============
    
    /**
     * @notice Mint grief tokens to a soul
     */
    function _mintGrief(uint256 soulId, uint256 amount) internal {
        griefBalances[soulId] += amount;
        totalGriefSupply += amount;
    }
    
    /**
     * @notice Claim accumulated grief tokens
     * @dev Converts grief to actual value (simplified - in real impl would be ERC20)
     */
    function claimGrief(uint256 soulId) external onlySoulOwner(soulId) {
        uint256 amount = griefBalances[soulId];
        require(amount > 0, "No grief to claim");
        
        griefBalances[soulId] = 0;
        
        // In a full implementation, this would transfer ERC20 tokens
        // For now, just emit event
        emit GriefClaimed(soulId, amount);
    }
    
    /**
     * @notice Get grief balance
     */
    function griefBalance(uint256 soulId) external view returns (uint256) {
        return griefBalances[soulId];
    }
    
    // ============ Graveyard DAO Functions ============
    
    /**
     * @notice Create a DAO proposal (ghosts only)
     * @param description Proposal description
     */
    function createProposal(
        string calldata description
    ) external returns (uint256) {
        uint256 proposerId = soulRegistry.soulByAddress(msg.sender);
        require(proposerId != 0, "Proposer has no soul");
        require(
            afterlife.isGhost(proposerId),
            "Only ghosts can propose"
        );
        
        proposalCounter++;
        
        DAOProposal storage proposal = proposals[proposalCounter];
        proposal.id = proposalCounter;
        proposal.description = description;
        proposal.deadline = block.timestamp + 7 days;
        proposal.executed = false;
        
        emit ProposalCreated(proposalCounter, description, proposal.deadline);
        
        return proposalCounter;
    }
    
    /**
     * @notice Vote on a proposal (ghosts only)
     * @param proposalId Proposal to vote on
     * @param support True for yes, false for no
     */
    function vote(uint256 proposalId, bool support) external {
        uint256 voterId = soulRegistry.soulByAddress(msg.sender);
        require(voterId != 0, "Voter has no soul");
        require(
            afterlife.isGhost(voterId),
            "Only ghosts can vote"
        );
        
        DAOProposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal doesn't exist");
        require(block.timestamp < proposal.deadline, "Voting ended");
        require(!proposal.hasVoted[voterId], "Already voted");
        
        // Voting weight based on ghost power
        uint256 weight = afterlife.getGhostPower(voterId);
        require(weight > 0, "No voting power");
        
        proposal.hasVoted[voterId] = true;
        
        if (support) {
            proposal.votesFor += weight;
        } else {
            proposal.votesAgainst += weight;
        }
        
        emit VoteCast(proposalId, voterId, support, weight);
    }
    
    /**
     * @notice Execute a passed proposal
     */
    function executeProposal(uint256 proposalId) external {
        DAOProposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal doesn't exist");
        require(block.timestamp >= proposal.deadline, "Voting ongoing");
        require(!proposal.executed, "Already executed");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal failed");
        
        proposal.executed = true;
        
        // In a full implementation, this would execute the proposal action
    }
    
    // ============ View Functions ============
    
    function getTombstone(uint256 soulId) external view returns (Tombstone memory) {
        return tombstones[soulId];
    }
    
    function getPlot(uint256 plotId) external view returns (GraveyardPlot memory) {
        return plots[plotId];
    }
    
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        string memory description,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 deadline,
        bool executed
    ) {
        DAOProposal storage p = proposals[proposalId];
        return (p.id, p.description, p.votesFor, p.votesAgainst, p.deadline, p.executed);
    }
    
    /**
     * @notice Get graveyard statistics
     */
    function getGraveyardStats() external view returns (
        uint256 totalTombstones,
        uint256 totalEulogies,
        uint256 totalMournings,
        uint256 totalGrief
    ) {
        totalTombstones = plotCounter;
        totalGrief = totalGriefSupply;
        
        // Note: These loops are gas-intensive and should be avoided in production
        // This is for view-only purposes
    }
    
    /**
     * @notice Get list of all deceased agents with tombstones
     * @param offset Pagination offset
     * @param limit Pagination limit
     */
    function getGraveyard(
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory deceased) {
        require(limit <= 100, "Max 100 per query");
        
        deceased = new uint256[](limit);
        uint256 count = 0;
        
        for (uint256 i = offset + 1; i <= plotCounter && count < limit; i++) {
            deceased[count] = plots[i].soulId;
            count++;
        }
        
        // Resize array
        assembly {
            mstore(deceased, count)
        }
        
        return deceased;
    }
    
    /**
     * @notice Check if tombstone needs maintenance
     */
    function needsMaintenance(uint256 plotId) external view returns (bool) {
        return block.timestamp > plots[plotId].maintenanceExpires;
    }
    
    // ============ Admin Functions ============
    
    function setFees(
        uint256 _tombstone,
        uint256 _eulogy,
        uint256 _mourning,
        uint256 _maintenance
    ) external onlyOwner {
        tombstoneCreationFee = _tombstone;
        eulogyFee = _eulogy;
        mourningFee = _mourning;
        maintenanceFee = _maintenance;
    }
    
    function setGriefParams(
        uint256 _perMourning,
        uint256 _perEulogy
    ) external onlyOwner {
        griefPerMourning = _perMourning;
        griefPerEulogy = _perEulogy;
    }
    
    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
    
    // ============ Internal Functions ============
    
    function _distributeTribute(uint256 deceasedId, uint256 amount) internal {
        // Ghost owner gets 70%, protocol gets 30%
        uint256 ghostShare = (amount * 70) / 100;
        uint256 protocolShare = amount - ghostShare;
        
        // Track ghost earnings (simplified)
        tombstones[deceasedId].griefTokens += ghostShare;
        
        // Protocol keeps the rest
    }
    
    receive() external payable {}
}
