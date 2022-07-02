// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Collection721 is Ownable, ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private nextTokenId;
    using ECDSA for bytes32;
    enum Sale {
        PRIVATE_SALE,
        PUBLIC_SALE,
        NO_SALE
    }
    struct SaleConfig {
        string saleName;
        Sale saleType;
        uint256 mintCharge;
        uint256 startTime;
        uint256 endTime;
        bytes32 whitelistRoot;
    }

    SaleConfig[] public saleWaves;
    address public feeDestination;

    mapping(bytes => bool) public isSignatureRedeemed;

    constructor(
        address _feeDestination,
        string[] memory saleNames,
        uint8[] memory saleTypes,
        uint256[] memory mintCharges,
        uint256[] memory startTimes,
        uint256[] memory endTimes,
        bytes32[] memory whitelistRoots
    ) ERC721("", "") {
        require(saleNames.length == saleTypes.length, "Array Size mismatch 1");
        require(
            saleNames.length == mintCharges.length,
            "Array Size mismatch 2"
        );
        require(saleNames.length == startTimes.length, "Array Size mismatch 3");
        require(saleNames.length == endTimes.length, "Array Size mismatch 4");
        require(
            saleNames.length == whitelistRoots.length,
            "Array Size mismatch 5"
        );
        for (uint256 i = 0; i < saleNames.length; ++i) {
            require(saleTypes[i] <= 2, "Invalid Saletype");
            SaleConfig memory config;
            config.saleName = saleNames[i];
            config.saleType = Sale(saleTypes[i]);
            config.mintCharge = mintCharges[i];
            config.startTime = startTimes[i];
            config.endTime = endTimes[i];
            config.whitelistRoot = whitelistRoots[i];
            saleWaves.push(config);
        }
        feeDestination = _feeDestination;
    }

    function updateSalewaves(
        string[] memory saleNames,
        uint8[] memory saleTypes,
        uint256[] memory mintCharges,
        uint256[] memory startTimes,
        uint256[] memory endTimes,
        bytes32[] memory whitelistRoots
    ) public onlyOwner {
        require(saleNames.length == saleTypes.length, "Array Size mismatch 1");
        require(
            saleNames.length == mintCharges.length,
            "Array Size mismatch 2"
        );
        require(saleNames.length == startTimes.length, "Array Size mismatch 3");
        require(saleNames.length == endTimes.length, "Array Size mismatch 4");
        require(
            saleNames.length == whitelistRoots.length,
            "Array Size mismatch 5"
        );
        for (uint256 i = 0; i < saleNames.length; ++i) {
            require(saleTypes[i] <= 2, "Invalid Saletype");
            SaleConfig memory config;
            config.saleName = saleNames[i];
            config.saleType = Sale(saleTypes[i]);
            config.mintCharge = mintCharges[i];
            config.startTime = startTimes[i];
            config.endTime = endTimes[i];
            config.whitelistRoot = whitelistRoots[i];
            if (saleWaves.length <= i) {
                saleWaves.push(config);
            } else {
                saleWaves[i] = config;
            }
        }
    }

    function totalWaves() public view returns (uint256 length) {
        length = saleWaves.length;
    }

    function addWave(
        string memory _saleName,
        uint8 _saleType,
        uint256 _mintCharge,
        uint256 _startTime,
        uint256 _endTime,
        bytes32 _whitelistRoot
    ) public onlyOwner {
        require(_saleType <= 2, "Invalid Saletype");
        SaleConfig memory config;
        config.saleName = _saleName;
        config.saleType = Sale(_saleType);
        config.mintCharge = _mintCharge;
        config.startTime = _startTime;
        config.endTime = _endTime;
        config.whitelistRoot = _whitelistRoot;
        saleWaves.push(config);
    }

    function currentSale() public view returns (SaleConfig memory saleWave) {
        uint256 time = block.timestamp;
        bool found = false;
        for (uint256 i = 0; i < saleWaves.length; ++i) {
            if (
                (saleWaves[i].startTime <= time &&
                    saleWaves[i].endTime >= time) ||
                (saleWaves[i].startTime <= time && saleWaves[i].endTime == 0)
            ) {
                saleWave = saleWaves[i];
                found = true;
                break;
            }
        }
        // require(found, "No Sale found");
    }

    modifier feeProvided() {
        require(msg.value >= currentSale().mintCharge, "Fee not provided");
        payable(feeDestination).transfer(msg.value);
        _;
    }

    modifier onlyWhitelisted(bytes32[] memory proof) {
        require(
            MerkleProof.verify(
                proof,
                currentSale().whitelistRoot,
                keccak256(abi.encodePacked(msg.sender))
            ),
            "Not whitelisted"
        );
        _;
    }

    modifier onlyPrivateSale() {
        SaleConfig memory saleWave = currentSale();
        require(saleWave.saleType == Sale(1), "Not a private sale");
        _;
    }

    modifier onlyPublicSale() {
        SaleConfig memory saleWave = currentSale();
        require(saleWave.saleType == Sale(2), "Not a public sale");
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

    function mintPrivateTo(
        address to,
        string memory _tokenURI,
        bytes32[] memory proof,
        bytes memory signature
    )
        public
        payable
        onlyPrivateSale
        onlyWhitelisted(proof)
        onlyValidTokenUri(_tokenURI, signature)
        feeProvided
    {
        _mint(to, nextTokenId.current());
        _setTokenURI(nextTokenId.current(), _tokenURI);
        nextTokenId.increment();
        isSignatureRedeemed[signature] = true;
    }

    function mintPrivate(
        string memory _tokenURI,
        bytes32[] memory proof,
        bytes memory signature
    )
        public
        payable
        onlyPrivateSale
        onlyWhitelisted(proof)
        onlyValidTokenUri(_tokenURI, signature)
        feeProvided
    {
        _mint(msg.sender, nextTokenId.current());
        _setTokenURI(nextTokenId.current(), _tokenURI);
        nextTokenId.increment();
        isSignatureRedeemed[signature] = true;
    }

    function mint(
        address to,
        string memory _tokenURI,
        bytes memory signature
    )
        public
        payable
        onlyPublicSale
        onlyValidTokenUri(_tokenURI, signature)
        feeProvided
    {
        _mint(to, nextTokenId.current());
        _setTokenURI(nextTokenId.current(), _tokenURI);
        nextTokenId.increment();
        isSignatureRedeemed[signature] = true;
    }

    function updateTokenUri(uint256 tokenId, string memory _tokenURI)
        public
        onlyOwner
    {
        _setTokenURI(tokenId, _tokenURI);
    }
}
