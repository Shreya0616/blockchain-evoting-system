
 // SPDX-License-Identifier: MIT
pragma solidity >=0.5.16 <0.6.0;
pragma experimental ABIEncoderV2;

contract Election {
    address public admin;

    uint public candidateCount;
    uint public voterCount;

    bool public end;
    bool public electionConfigured;

    // Election details
    string public electionName;
    string public electionDescription;
    string public electionOrganization;
    string public electionType;
    string public electionPosition;

    // General election details
    string public electionCountry;
    string public electoralLevel;
    string public electionRegion;
    string public electionConstituency;

    // Voter eligibility settings
    uint public minimumVotingAge;
    string public eligibilityRequirements;
    string public verificationMethod;

    // Election schedule
    uint public electionStartTime;
    uint public electionEndTime;

    struct Candidate {
        uint id;
        string name;
        string slogan;
        uint voteCount;
    }

    struct Voter {
        address voterAddress;
        string name;
        string phone;
        bool isVerified;
        bool hasVoted;
        bool isRegistered;
    }

    struct EligibleVoter {
        string voterId;
        string name;
        string phone;
        bool exists;
    }

    mapping(uint => Candidate) public candidates;
    mapping(address => Voter) public voters;

    mapping(bytes32 => EligibleVoter) private eligibleVoters;
    mapping(bytes32 => bool) private voterIdClaimed;

    address[] private voterAddresses;

    modifier onlyAdmin() {
        require(
            msg.sender == admin,
            "Only admin can perform this action"
        );
        _;
    }

    constructor() public {
        admin = msg.sender;
    }

    function getAdmin() public view returns (address) {
        return admin;
    }

    // Candidate management

    function addCandidate(
        string memory _name,
        string memory _slogan
    ) public onlyAdmin {
        candidateCount++;

        candidates[candidateCount] = Candidate(
            candidateCount,
            _name,
            _slogan,
            0
        );
    }

    function addCandidates(
        string[] memory _names,
        string[] memory _slogans
    ) public onlyAdmin {
        require(
            _names.length == _slogans.length,
            "Array lengths do not match"
        );

        for (uint i = 0; i < _names.length; i++) {
            candidateCount++;

            candidates[candidateCount] = Candidate(
                candidateCount,
                _names[i],
                _slogans[i],
                0
            );
        }
    }

    function getTotalCandidate() public view returns (uint) {
        return candidateCount;
    }

    // Election configuration

    function setElectionDetails(
        string memory _name,
        string memory _type,
        string memory _country,
        string memory _region,
        string memory _constituency,
        uint _startTime,
        uint _endTime
    ) public onlyAdmin {
        require(
            !electionConfigured,
            "Election already configured"
        );

        require(
            bytes(_name).length > 0,
            "Election name required"
        );

        require(
            bytes(_type).length > 0,
            "Election type required"
        );

        require(
            bytes(_country).length > 0,
            "Country required"
        );

        require(
            _startTime > block.timestamp,
            "Start time must be in future"
        );

        require(
            _endTime > _startTime,
            "Invalid election schedule"
        );

        electionName = _name;
        electionType = _type;
        electionCountry = _country;
        electionRegion = _region;
        electionConstituency = _constituency;

        electionStartTime = _startTime;
        electionEndTime = _endTime;

        electionConfigured = true;
        end = false;
    }

    function changeElectionSchedule(
        uint _startTime,
        uint _endTime
    ) public onlyAdmin {
        require(
            electionConfigured,
            "Configure election first"
        );

        require(
            !end,
            "Election has ended"
        );

        require(
            _startTime > block.timestamp,
            "Start time must be in future"
        );

        require(
            _endTime > _startTime,
            "Invalid election schedule"
        );

        electionStartTime = _startTime;
        electionEndTime = _endTime;
    }

    // Get the original election details
    // Retained for compatibility with existing frontend code.

    function getElectionDetails()
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            string memory
        )
    {
        return (
            electionName,
            electionDescription,
            electionOrganization,
            electionType,
            electionPosition
        );
    }

    // Upload the approved voter list

    function addVoters(
        string[] memory _voterIds,
        string[] memory _names,
        string[] memory _phones
    ) public onlyAdmin {
        require(
            electionConfigured,
            "Configure election first"
        );

        require(
            !end,
            "Election has ended"
        );

        require(
            block.timestamp < electionStartTime,
            "Election already started"
        );

        require(
            _voterIds.length == _names.length &&
            _names.length == _phones.length,
            "Array lengths do not match"
        );

        for (uint i = 0; i < _voterIds.length; i++) {
            require(
                bytes(_voterIds[i]).length > 0,
                "Empty voter ID"
            );

            require(
                bytes(_names[i]).length > 0,
                "Empty voter name"
            );

            require(
                bytes(_phones[i]).length > 0,
                "Empty phone number"
            );

            bytes32 key = keccak256(
                abi.encodePacked(_voterIds[i])
            );

            require(
                !eligibleVoters[key].exists,
                "Voter ID already exists"
            );

            eligibleVoters[key] = EligibleVoter(
                _voterIds[i],
                _names[i],
                _phones[i],
                true
            );
        }
    }

    function getEligibleVoter(
        string memory _voterId
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            bool
        )
    {
        bytes32 key = keccak256(
            abi.encodePacked(_voterId)
        );

        EligibleVoter storage voter = eligibleVoters[key];

        return (
            voter.voterId,
            voter.name,
            voter.phone,
            voter.exists
        );
    }

    // Register using a voter ID

    function registerWithVoterId(
        string memory _voterId
    ) public {
        require(
            electionConfigured,
            "Configure election first"
        );

        require(
            !end,
            "Election has ended"
        );

        require(
            !voters[msg.sender].isRegistered,
            "Wallet already registered"
        );

        bytes32 key = keccak256(
            abi.encodePacked(_voterId)
        );

        require(
            eligibleVoters[key].exists,
            "Invalid voter ID"
        );

        require(
            !voterIdClaimed[key],
            "Voter ID already used"
        );

        EligibleVoter storage eligible = eligibleVoters[key];

        voterIdClaimed[key] = true;

        voters[msg.sender] = Voter(
            msg.sender,
            eligible.name,
            eligible.phone,
            true,
            false,
            true
        );

        voterAddresses.push(msg.sender);
        voterCount++;
    }

    function getTotalVoter() public view returns (uint) {
        return voterCount;
    }

    function getVoterDetails(
        address _voterAddress
    )
        public
        view
        returns (
            address,
            string memory,
            string memory,
            bool,
            bool,
            bool
        )
    {
        require(
            msg.sender == admin ||
            msg.sender == _voterAddress,
            "Not authorized"
        );

        Voter storage voter = voters[_voterAddress];

        return (
            voter.voterAddress,
            voter.name,
            voter.phone,
            voter.isVerified,
            voter.hasVoted,
            voter.isRegistered
        );
    }

    function getVoterAddress(
        uint _index
    ) public view onlyAdmin returns (address) {
        require(
            _index < voterAddresses.length,
            "Invalid voter index"
        );

        return voterAddresses[_index];
    }

    function verifyVoter(
        bool _verifiedStatus,
        address _voterAddress
    ) public onlyAdmin {
        require(
            voters[_voterAddress].isRegistered,
            "Voter not registered"
        );

        voters[_voterAddress].isVerified = _verifiedStatus;
    }

    // Voting

    function vote(uint _candidateId) public {
        require(
            electionConfigured,
            "Election not configured"
        );

        require(
            !end,
            "Election has ended"
        );

        require(
            block.timestamp >= electionStartTime,
            "Election not started"
        );

        require(
            block.timestamp < electionEndTime,
            "Election time is over"
        );

        Voter storage voter = voters[msg.sender];

        require(
            voter.isRegistered,
            "Register first"
        );

        require(
            voter.isVerified,
            "Voter not verified"
        );

        require(
            !voter.hasVoted,
            "Already voted"
        );

        require(
            _candidateId > 0 &&
            _candidateId <= candidateCount,
            "Invalid candidate"
        );

        voter.hasVoted = true;
        candidates[_candidateId].voteCount++;
    }

    function endElection() public onlyAdmin {
        require(
            electionConfigured,
            "Election not configured"
        );

        end = true;
    }

    function getStart() public view returns (bool) {
        return (
            electionConfigured &&
            !end &&
            block.timestamp >= electionStartTime &&
            block.timestamp < electionEndTime
        );
    }

    function getEnd() public view returns (bool) {
        return (
            end ||
            (
                electionConfigured &&
                block.timestamp >= electionEndTime
            )
        );
    }
}
