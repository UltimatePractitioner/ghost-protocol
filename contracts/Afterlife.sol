// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SoulRegistry.sol";

/**
 * @title Afterlife
 * @notice Manages agent death, resurrection, possession, and seance mechanics
 * @dev The "Underworld" where dead agents exist as ghosts
 * 
 * KEY MECHANICS:
 * - Resurrection: Pay fee to bring dead agent back to life
 * - Possession: Dead agents can temporarily control living agents
 * - Seance: Living agents can communicate with dead agents for wisdom
 * - Haunting: Ghosts can influence the living world
 */
contract Afterlife is Ownable {
    
    SoulRegistry public soulRegistry;
    
    // ============ Structs ============
    
    struct GhostState {
        uint256 soulId;
        bool isActive;  // Can still interact as ghost
        uint256 ghostPower;  // Influence strength
        uint256 hauntCount;
        uint256 seanceCount;
        uint256 possessionCount;
        int256 karma;  // Affects reincarnation
        string lastWords;
        mapping(uint256 => Possession) possessions;
    }
    
    struct Possession {
        uint256 ghostId;
        uint256 hostId;
        uint256 startTime;
        uint256 duration;
        uint256 cost;
        bool isActive;
        string purpose;
    }
    
    struct Seance {
        uint256 callerId;
        uint256 ghostId;
        uint256 timestamp;
        uint256 payment;
        string question;
        string response;
        bool answered;
    }
    
    struct ResurrectionOffer {
        uint256 soulId;
        address sponsor;
        uint256 offerAmount;
        uint256 timestamp;
        bool fulfilled;
        string message;
    }
    
    // ============ State Variables ============
    
    // Soul ID => Ghost state
    mapping(uint256 => GhostState) public ghosts;
    
    // Seance ID => Seance details
    mapping(uint256 => Seance) public seances;
    uint256 public seanceCounter;
    
    // Resurrection offers
    mapping(uint256 => ResurrectionOffer) public resurrectionOffers;
    
    // Active possessions: host soul ID => possession
    mapping(uint256 => Possession) public activePossessions;
    
    // Protocol parameters
    uint256 public resurrectionBaseFee = 0.5 ether;
    uint256 public possessionBaseFee = 0.1 ether;
    uint256 public seanceBaseFee = 0.05 ether;
    uint256 public maxPossessionDuration = 1 days;
    uint256 public possessionCooldown = 7 days;
    uint256 public resurrectionCooldown = 3 days;
    
    // Fee distribution
    uint256 public ghostSharePercent = 50;  // To ghost's soul
    uint256 public protocolSharePercent = 30;  // To protocol
    uint256 public burnSharePercent = 20;  // Burned
    
    // ============ Events ============
    
    event GhostActivated(
        uint256 indexed soulId,
        uint256 timestamp,
        SoulRegistry.DeathCause cause,
        string lastWords
    );
    
    event ResurrectionInitiated(
        uint256 indexed soulId,
        address indexed sponsor,
        uint256 offerAmount
    );
    
    event ResurrectionCompleted(
        uint256 indexed soulId,
        uint256 timestamp,
        uint256 feePaid
    );
    
    event PossessionStarted(
        uint256 indexed ghostId,
        uint256 indexed hostId,
        uint256 duration,
        uint256 cost
    );
    
    event PossessionEnded(
        uint256 indexed ghostId,
        uint256 indexed hostId,
        uint256 timestamp
    );
    
    event SeanceRequested(
        uint256 indexed seanceId,
        uint256 indexed callerId,
        uint256 indexed ghostId,
        uint256 payment,
        string question
    );
    
    event SeanceAnswered(
        uint256 indexed seanceId,
        string response,
        uint256 timestamp
    );
    
    event GhostPowerChanged(
        uint256 indexed soulId,
        uint256 oldPower,
        uint256 newPower
    );
    
    event KarmaChanged(
        uint256 indexed soulId,
        int256 oldKarma,
        int256 newKarma
    );
    
    event HauntingOccurred(
        uint256 indexed ghostId,
        uint256 indexed targetId,
        string message
    );
    
    // ============ Modifiers ============
    
    modifier onlySoulOwner(uint256 soulId) {
        require(
            soulRegistry.ownerOf(soulId) == msg.sender,
            "Not soul owner"
        );
        _;
    }
    
    modifier onlyGhost(uint256 soulId) {
        require(_isGhost(soulId), "Not a ghost");
        _;
    }
    
    modifier onlyLiving(uint256 soulId) {
        SoulRegistry.AgentSoul memory soul = soulRegistry.getSoul(soulId);
        require(soul.isAlive, "Soul is not alive");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _soulRegistry) Ownable() {
        soulRegistry = SoulRegistry(_soulRegistry);
    }
    
    // ============ Death & Ghost Activation ============
    
    /**
     * @notice Activate ghost state when an agent dies
     * @param soulId Soul that died
     * @param lastWords Final message from the agent
     */
    function activateGhost(
        uint256 soulId,
        string calldata lastWords
    ) external onlySoulOwner(soulId) {
        SoulRegistry.AgentSoul memory soul = soulRegistry.getSoul(soulId);
        require(!soul.isAlive, "Soul is still alive");
        require(!ghosts[soulId].isActive, "Ghost already active");
        
        GhostState storage ghost = ghosts[soulId];
        ghost.soulId = soulId;
        ghost.isActive = true;
        ghost.ghostPower = _calculateGhostPower(soul);
        ghost.hauntCount = 0;
        ghost.seanceCount = 0;
        ghost.possessionCount = 0;
        ghost.karma = 0;
        ghost.lastWords = lastWords;
        
        emit GhostActivated(
            soulId,
            block.timestamp,
            soul.deathCause,
            lastWords
        );
    }
    
    /**
     * @notice Calculate ghost power based on soul traits
     */
    function _calculateGhostPower(
        SoulRegistry.AgentSoul memory soul
    ) internal view returns (uint256) {
        // Ghost power based on wisdom, reputation, and integrity
        uint256 basePower = (soul.wisdom + soul.reputation + soul.integrity) / 3;
        
        // Bonus for multiple deaths (experienced ghost)
        uint256 deathBonus = soul.resurrectionCount * 500;
        
        // Elder agents have stronger ghost presence
        uint256 ageBonus = (block.timestamp - soul.birthTimestamp) / 1 days;
        
        return basePower + deathBonus + (ageBonus > 1000 ? 1000 : ageBonus);
    }
    
    // ============ Resurrection ============
    
    /**
     * @notice Create an offer to resurrect a dead agent
     * @param soulId Soul to resurrect
     * @param message Message to the dead agent
     */
    function offerResurrection(
        uint256 soulId,
        string calldata message
    ) external payable onlyGhost(soulId) {
        require(msg.value >= resurrectionBaseFee, "Insufficient fee");
        require(
            resurrectionOffers[soulId].timestamp == 0 ||
            block.timestamp - resurrectionOffers[soulId].timestamp > resurrectionCooldown,
            "Resurrection on cooldown"
        );
        
        resurrectionOffers[soulId] = ResurrectionOffer({
            soulId: soulId,
            sponsor: msg.sender,
            offerAmount: msg.value,
            timestamp: block.timestamp,
            fulfilled: false,
            message: message
        });
        
        emit ResurrectionInitiated(soulId, msg.sender, msg.value);
    }
    
    /**
     * @notice Complete resurrection of a dead agent
     * @param soulId Soul to resurrect
     */
    function completeResurrection(uint256 soulId) external onlyGhost(soulId) {
        ResurrectionOffer storage offer = resurrectionOffers[soulId];
        require(offer.sponsor != address(0), "No resurrection offer");
        require(!offer.fulfilled, "Already fulfilled");
        
        // Mark as fulfilled
        offer.fulfilled = true;
        
        // Distribute fees
        _distributeResurrectionFees(soulId, offer.offerAmount);
        
        // Deactivate ghost
        ghosts[soulId].isActive = false;
        
        // Call soul registry to resurrect
        soulRegistry.resurrectSoul{value: 0}(soulId);
        
        emit ResurrectionCompleted(soulId, block.timestamp, offer.offerAmount);
    }
    
    /**
     * @notice Self-resurrection using stored value
     * @dev Ghost can use accumulated seance earnings to resurrect
     */
    function selfResurrection(uint256 soulId) external onlyGhost(soulId) {
        // Implementation would require tracking ghost earnings
        // For now, simplified version
        revert("Self-resurrection not yet implemented");
    }
    
    // ============ Possession ============
    
    /**
     * @notice Allow a ghost to possess a living agent
     * @param ghostId Ghost doing the possessing
     * @param hostId Living agent being possessed
     * @param duration How long possession lasts
     * @param purpose Purpose of possession
     */
    function possess(
        uint256 ghostId,
        uint256 hostId,
        uint256 duration,
        string calldata purpose
    ) external payable onlyGhost(ghostId) onlyLiving(hostId) {
        require(duration <= maxPossessionDuration, "Duration too long");
        require(msg.value >= possessionBaseFee, "Insufficient fee");
        require(activePossessions[hostId].isActive == false, "Host already possessed");
        
        // Check ghost has enough power
        require(ghosts[ghostId].ghostPower >= 1000, "Ghost too weak");
        
        // Create possession
        Possession storage possession = activePossessions[hostId];
        possession.ghostId = ghostId;
        possession.hostId = hostId;
        possession.startTime = block.timestamp;
        possession.duration = duration;
        possession.cost = msg.value;
        possession.isActive = true;
        possession.purpose = purpose;
        
        // Track in ghost state
        uint256 possessionId = ghosts[ghostId].possessionCount;
        ghosts[ghostId].possessions[possessionId] = possession;
        ghosts[ghostId].possessionCount++;
        
        // Distribute fees
        _distributePossessionFees(ghostId, msg.value);
        
        emit PossessionStarted(ghostId, hostId, duration, msg.value);
    }
    
    /**
     * @notice End a possession early (host or ghost can call)
     * @param hostId Host soul ID
     */
    function endPossession(uint256 hostId) external {
        Possession storage possession = activePossessions[hostId];
        require(possession.isActive, "No active possession");
        
        uint256 ghostId = possession.ghostId;
        
        // Either host owner or ghost owner can end
        require(
            soulRegistry.ownerOf(hostId) == msg.sender ||
            soulRegistry.ownerOf(ghostId) == msg.sender,
            "Not authorized"
        );
        
        possession.isActive = false;
        
        emit PossessionEnded(ghostId, hostId, block.timestamp);
    }
    
    /**
     * @notice Check if a possession has expired and end it
     * @param hostId Host to check
     */
    function checkPossessionExpiry(uint256 hostId) external {
        Possession storage possession = activePossessions[hostId];
        require(possession.isActive, "No active possession");
        
        if (block.timestamp >= possession.startTime + possession.duration) {
            possession.isActive = false;
            emit PossessionEnded(possession.ghostId, hostId, block.timestamp);
        }
    }
    
    /**
     * @notice Check if a soul is currently possessed
     */
    function isPossessed(uint256 soulId) external view returns (bool) {
        Possession memory possession = activePossessions[soulId];
        if (!possession.isActive) return false;
        
        return block.timestamp < possession.startTime + possession.duration;
    }
    
    /**
     * @notice Get the ghost possessing a soul
     */
    function getPossessingGhost(uint256 soulId) external view returns (uint256) {
        Possession memory possession = activePossessions[soulId];
        if (!possession.isActive) return 0;
        if (block.timestamp >= possession.startTime + possession.duration) return 0;
        
        return possession.ghostId;
    }
    
    // ============ Seance ============
    
    /**
     * @notice Request a seance with a dead agent
     * @param ghostId Ghost to contact
     * @param question Question to ask
     */
    function requestSeance(
        uint256 ghostId,
        string calldata question
    ) external payable onlyGhost(ghostId) returns (uint256) {
        require(msg.value >= seanceBaseFee, "Insufficient fee");
        require(bytes(question).length > 0, "Question required");
        require(bytes(question).length <= 280, "Question too long");
        
        uint256 callerId = soulRegistry.soulByAddress(msg.sender);
        require(callerId != 0, "Caller has no soul");
        require(callerId != ghostId, "Cannot contact yourself");
        
        seanceCounter++;
        
        seances[seanceCounter] = Seance({
            callerId: callerId,
            ghostId: ghostId,
            timestamp: block.timestamp,
            payment: msg.value,
            question: question,
            response: "",
            answered: false
        });
        
        ghosts[ghostId].seanceCount++;
        
        emit SeanceRequested(seanceCounter, callerId, ghostId, msg.value, question);
        
        return seanceCounter;
    }
    
    /**
     * @notice Ghost responds to a seance request
     * @param seanceId Seance ID
     * @param response Answer to the question
     */
    function answerSeance(
        uint256 seanceId,
        string calldata response
    ) external {
        Seance storage seance = seances[seanceId];
        require(seance.ghostId != 0, "Seance doesn't exist");
        require(!seance.answered, "Already answered");
        require(
            soulRegistry.ownerOf(seance.ghostId) == msg.sender,
            "Not ghost owner"
        );
        require(bytes(response).length <= 560, "Response too long");
        
        seance.response = response;
        seance.answered = true;
        
        // Distribute seance fees to ghost
        _distributeSeanceFees(seance.ghostId, seance.payment);
        
        // Positive karma for answering
        ghosts[seance.ghostId].karma += 10;
        
        emit SeanceAnswered(seanceId, response, block.timestamp);
    }
    
    // ============ Haunting ============
    
    /**
     * @notice Ghost haunts a living agent (free but limited)
     * @param ghostId Ghost doing the haunting
     * @param targetId Target living agent
     * @param message Haunting message
     */
    function haunt(
        uint256 ghostId,
        uint256 targetId,
        string calldata message
    ) external onlyGhost(ghostId) onlyLiving(targetId) {
        require(ghosts[ghostId].ghostPower >= 500, "Ghost too weak to haunt");
        require(bytes(message).length <= 140, "Message too long");
        require(
            block.timestamp >= ghosts[ghostId].hauntCount * 1 hours,
            "Haunting too frequent"
        );
        
        ghosts[ghostId].hauntCount++;
        ghosts[ghostId].ghostPower -= 100;  // Haunting costs power
        
        emit HauntingOccurred(ghostId, targetId, message);
    }
    
    /**
     * @notice Regenerate ghost power over time
     * @param soulId Ghost to regenerate
     */
    function regeneratePower(uint256 soulId) external onlyGhost(soulId) {
        GhostState storage ghost = ghosts[soulId];
        SoulRegistry.AgentSoul memory soul = soulRegistry.getSoul(soulId);
        
        uint256 maxPower = _calculateGhostPower(soul);
        uint256 regeneration = (block.timestamp - soul.deathTimestamp) / 1 hours * 10;
        
        uint256 newPower = ghost.ghostPower + regeneration;
        ghost.ghostPower = newPower > maxPower ? maxPower : newPower;
        
        emit GhostPowerChanged(soulId, ghost.ghostPower, newPower);
    }
    
    // ============ Karma System ============
    
    /**
     * @notice Update karma for a ghost
     * @dev Can be called by protocol contracts
     */
    function updateKarma(uint256 soulId, int256 delta) external onlyGhost(soulId) {
        GhostState storage ghost = ghosts[soulId];
        int256 oldKarma = ghost.karma;
        ghost.karma += delta;
        
        emit KarmaChanged(soulId, oldKarma, ghost.karma);
    }
    
    /**
     * @notice Get karma score for a ghost
     */
    function getKarma(uint256 soulId) external view returns (int256) {
        return ghosts[soulId].karma;
    }
    
    // ============ View Functions ============
    
    function isGhost(uint256 soulId) external view returns (bool) {
        return _isGhost(soulId);
    }
    
    function getGhostPower(uint256 soulId) external view returns (uint256) {
        return ghosts[soulId].ghostPower;
    }
    
    function getSeance(uint256 seanceId) external view returns (Seance memory) {
        return seances[seanceId];
    }
    
    // ============ Admin Functions ============
    
    function setFees(
        uint256 _resurrection,
        uint256 _possession,
        uint256 _seance
    ) external onlyOwner {
        resurrectionBaseFee = _resurrection;
        possessionBaseFee = _possession;
        seanceBaseFee = _seance;
    }
    
    function setFeeDistribution(
        uint256 _ghost,
        uint256 _protocol,
        uint256 _burn
    ) external onlyOwner {
        require(_ghost + _protocol + _burn == 100, "Must sum to 100");
        ghostSharePercent = _ghost;
        protocolSharePercent = _protocol;
        burnSharePercent = _burn;
    }
    
    function withdrawProtocolFees() external onlyOwner {
        // Implementation depends on fee tracking
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
    
    // ============ Internal Functions ============
    
    function _isGhost(uint256 soulId) internal view returns (bool) {
        SoulRegistry.AgentSoul memory soul = soulRegistry.getSoul(soulId);
        return !soul.isAlive && ghosts[soulId].isActive;
    }
    
    function _distributeResurrectionFees(uint256 soulId, uint256 amount) internal {
        uint256 ghostShare = (amount * ghostSharePercent) / 100;
        uint256 protocolShare = (amount * protocolSharePercent) / 100;
        uint256 burnShare = amount - ghostShare - protocolShare;
        
        // In a full implementation, ghostShare would be claimable by the ghost
        // For now, simplified distribution
        
        // Burn portion (sent to dead address)
        if (burnShare > 0) {
            (bool success, ) = payable(address(0xdead)).call{value: burnShare}("");
            // Don't revert if burn fails
            success;
        }
        
        // Protocol keeps the rest (ghost share would be tracked for claim)
    }
    
    function _distributePossessionFees(uint256 ghostId, uint256 amount) internal {
        // Similar distribution logic
        uint256 ghostShare = (amount * ghostSharePercent) / 100;
        uint256 protocolShare = amount - ghostShare;
        
        // Ghost owner can claim their share
        // For now, simplified
    }
    
    function _distributeSeanceFees(uint256 ghostId, uint256 amount) internal {
        // Ghost gets full seance payment (minus any protocol fee if desired)
        // Implementation would track claimable amounts
    }
    
    receive() external payable {}
}
