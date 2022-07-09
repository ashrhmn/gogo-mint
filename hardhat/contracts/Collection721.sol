// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Collection721 is Ownable, ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private nextTokenId;
    using ECDSA for bytes32;
    struct SaleConfig {
        bool status;
        uint256 startTime;
        uint256 endTime;
    }

    uint256 public privateMintCharge;
    uint256 public publicMintCharge;

    bytes32 public whitelistRoot;

    address public feeDestination;

    SaleConfig public privateSale1;
    SaleConfig public privateSale2;
    SaleConfig public publicSale;

    uint256 public maxMintInPrivate;
    uint256 public maxMintInPublic;

    mapping(bytes => bool) public isSignatureRedeemed;

    event Mint(address msgSender, string tokenUri, uint256 tokenId);

    constructor(
        address _feeDestination,
        bytes32 _whitelistRoot,
        uint256 _privateMintCharge,
        uint256 _publicMintCharge,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        feeDestination = _feeDestination;
        whitelistRoot = _whitelistRoot;
        privateMintCharge = _privateMintCharge;
        publicMintCharge = _publicMintCharge;
    }

    function updateMaxMintInPrivate(uint256 _maxMintInPrivate)
        public
        onlyOwner
    {
        maxMintInPrivate = _maxMintInPrivate;
    }

    function updateMaxMintInPublic(uint256 _maxMintInPublic) public onlyOwner {
        maxMintInPublic = _maxMintInPublic;
    }

    function updatePrivateMintCharge(uint256 charge) public onlyOwner {
        privateMintCharge = charge;
    }

    function updatePublicMintCharge(uint256 charge) public onlyOwner {
        publicMintCharge = charge;
    }

    function updatePrivateSale1(
        uint256 _startTime,
        uint256 _endTime,
        bool _status
    ) public onlyOwner {
        privateSale1.startTime = _startTime;
        privateSale1.endTime = _endTime;
        privateSale1.status = _status;
    }

    function updatePrivateSale2(
        uint256 _startTime,
        uint256 _endTime,
        bool _status
    ) public onlyOwner {
        privateSale2.startTime = _startTime;
        privateSale2.endTime = _endTime;
        privateSale2.status = _status;
    }

    function updatePublicSale(
        uint256 _startTime,
        uint256 _endTime,
        bool _status
    ) public onlyOwner {
        publicSale.startTime = _startTime;
        publicSale.endTime = _endTime;
        publicSale.status = _status;
    }

    function updateWhitelist(bytes32 _root) public onlyOwner {
        whitelistRoot = _root;
    }

    function updateFeeToAddress(address _feeDestination) public onlyOwner {
        feeDestination = _feeDestination;
    }

    function updateTokenUri(uint256 tokenId, string memory _tokenURI)
        public
        onlyOwner
    {
        _setTokenURI(tokenId, _tokenURI);
    }

    modifier privateFeeProvided() {
        require(msg.value >= privateMintCharge, "Fee not provided");
        payable(feeDestination).transfer(msg.value);
        _;
    }

    modifier publicFeeProvided() {
        require(msg.value >= publicMintCharge, "Fee not provided");
        payable(feeDestination).transfer(msg.value);
        _;
    }

    modifier onlyWhitelisted(bytes32[] memory proof) {
        require(
            MerkleProof.verify(
                proof,
                whitelistRoot,
                keccak256(abi.encodePacked(msg.sender))
            ),
            "Not whitelisted"
        );
        _;
    }

    modifier onlyPrivateSale() {
        uint256 time = block.timestamp;
        require(
            (privateSale1.status &&
                time > privateSale1.startTime &&
                (privateSale1.endTime > time || privateSale1.endTime == 0)) ||
                (privateSale2.status &&
                    time > privateSale2.startTime &&
                    (privateSale2.endTime > time || privateSale2.endTime == 0)),
            "Not a private sale"
        );
        _;
    }

    modifier onlyPublicSale() {
        uint256 time = block.timestamp;
        require(
            publicSale.status &&
                time > publicSale.startTime &&
                (publicSale.endTime > time || publicSale.endTime == 0),
            "Not a public sale"
        );
        _;
    }

    modifier onlyValidTokenUri(
        string memory _tokenURI,
        bytes memory signature
    ) {
        require(!isSignatureRedeemed[signature], "Signature already redeemed");
        require(
            keccak256(abi.encodePacked(_tokenURI))
                .toEthSignedMessageHash()
                .recover(signature) == owner(),
            "Invalid token URI"
        );
        _;
    }

    modifier maxPrivateLimitNotReached() {
        if (maxMintInPrivate != 0) {
            require(
                balanceOf(msg.sender) < maxMintInPrivate,
                "Max limit reached"
            );
        }
        _;
    }

    modifier maxPublicLimitNotReached() {
        if (maxMintInPublic != 0) {
            require(
                balanceOf(msg.sender) < maxMintInPublic,
                "Max limit reached"
            );
        }
        _;
    }

    function mintPrivate(
        string memory _tokenURI,
        bytes32[] memory proof,
        bytes memory signature
    )
        public
        payable
        onlyPrivateSale
        maxPrivateLimitNotReached
        onlyWhitelisted(proof)
        onlyValidTokenUri(_tokenURI, signature)
        privateFeeProvided
    {
        _mint(msg.sender, nextTokenId.current());
        _setTokenURI(nextTokenId.current(), _tokenURI);
        isSignatureRedeemed[signature] = true;
        emit Mint(msg.sender, _tokenURI, nextTokenId.current());
        nextTokenId.increment();
    }

    function mint(string memory _tokenURI, bytes memory signature)
        public
        payable
        onlyPublicSale
        maxPublicLimitNotReached
        onlyValidTokenUri(_tokenURI, signature)
        publicFeeProvided
    {
        _mint(msg.sender, nextTokenId.current());
        _setTokenURI(nextTokenId.current(), _tokenURI);
        isSignatureRedeemed[signature] = true;
        emit Mint(msg.sender, _tokenURI, nextTokenId.current());
        nextTokenId.increment();
    }
}
