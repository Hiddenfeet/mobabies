// SPDX-License-Identifier: MIT
pragma solidity ^ 0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import '@openzeppelin/contracts/finance/PaymentSplitter.sol';
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// @author omnislash
// @contact bluesoft.alan@gmail.com

contract CrosmoBaby is
ERC721,
Ownable,
ReentrancyGuard,
PaymentSplitter {
    using Strings
    for uint256;
    using Counters
    for Counters.Counter;

    address proxyRegistryAddress;

    uint256 public maxSupply = 500;
    uint256 public preSaleSupply = 250;

    string public baseURI;
    string public notRevealedUri = "ipfs://QmSvXwxoVLd9cmYNBJZkoY7Hbny8HVgsYyNCDo5mhLgf79/hidden.json";
    string public baseExtension = ".json";

    bool public paused = false;
    bool public revealed = false;
    bool public presaleM = false;
    bool public publicM = false;

    uint256 presaleAmountLimit = 4;
    uint256 maxAmountLimit = 10;
    mapping(address => uint256) public _claimed;

    uint256[] private _prices = [109000000000000000000, 129000000000000000000, 149000000000000000000]; // 109cro, 129cro, 149cro

    Counters.Counter private _tokenIds;

    address private crosmoCraftContract = 0x7C0132b3D1a5999C66F0f36Ed53f8930D481cF93;
    address private crosmoNautContract = 0xDD99b5A1d868Ba7641Ab8D13B06b2E78826a1579;
    uint256[] private _teamShares = [92, 8]; // 2 PEOPLE IN THE TEAM
    address[] private _team = [
        0xe1e4f26c0A7fE05E538197317A616bc9157C8D53, // Admin Account gets 92% of the total revenue
        0x5BC4cceDB9440c5212C94B822f363Ca130010283 // VIP Account gets 8% of the total revenue
    ];

    constructor(string memory uri)
    ERC721("CrosmoBaby", "CrosmoNaut")
    PaymentSplitter(_team, _teamShares) // Split the payment based on the teamshares percentages
    ReentrancyGuard() // A modifier that can prevent reentrancy during certain functions
    {
        setBaseURI(uri);
    }

    function setBaseURI(string memory _tokenBaseURI) public onlyOwner {
        baseURI = _tokenBaseURI;
    }

    function _baseURI() internal view override returns(string memory) {
        return baseURI;
    }

    function reveal() public onlyOwner {
        revealed = true;
    }

    modifier onlyAccounts() {
        require(msg.sender == tx.origin, "Not allowed origin");
        _;
    }

    function togglePause() public onlyOwner {
        paused = !paused;
    }

    function togglePresale() public onlyOwner {
        presaleM = !presaleM;
    }

    function togglePublicSale() public onlyOwner {
        publicM = !publicM;
    }

    function getPrice(address _owner) public view returns (uint256) {
        uint256 craft_balance = IERC721(crosmoCraftContract).balanceOf(
            _owner
        );
        uint256 naut_balance = IERC721(crosmoNautContract).balanceOf(
            _owner
        );

        if(craft_balance > 0)
        {
            return _prices[0];
        }
        else if(naut_balance > 0)
        {
            return _prices[1];
        }
        else  {
            return _prices[2];
        }
    }
    function presaleMint(uint256 _amount)
    external
    payable
    onlyAccounts {
        require(presaleM, "CrosmoBaby: Presale is OFF");
        require(!paused, "CrosmoBaby: Contract is paused");
        require(
            _claimed[msg.sender] + _amount <= presaleAmountLimit, "CrosmoBaby: You can't mint so much tokens");


        uint current = _tokenIds.current();

        require(
            current + _amount <= preSaleSupply,
            "CrosmoBaby: max supply exceeded"
        );
        uint256 price = getPrice(msg.sender);
        require( price * _amount <= msg.value, "CrosmoBaby: Not enough cro sent" );
        

        _claimed[msg.sender] += _amount;

        for (uint i = 0; i < _amount; i++) {
            mintInternal();
        }
    }

    function publicSaleMint(uint256 _amount)
    external
    payable
    onlyAccounts {
        require(publicM, "CrosmoBaby: PublicSale is OFF");
        require(!paused, "CrosmoBaby: Contract is paused");
        require(_amount > 0, "CrosmoBaby: zero amount");
        require(
            _claimed[msg.sender]  + _amount <= maxAmountLimit, "CrosmoBaby: You can't mint so much tokens");
        uint current = _tokenIds.current();

        require(
            current + _amount <= maxSupply,
            "CrosmoBaby: Max supply exceeded"
        );
        uint256 price = getPrice(msg.sender);
        require( price * _amount <= msg.value, "CrosmoBaby: Not enough cro sent" );
        _claimed[msg.sender] += _amount;
        for (uint i = 0; i < _amount; i++) {
            mintInternal();
        }
    }

    function mintInternal() internal nonReentrant {
        _tokenIds.increment();

        uint256 tokenId = _tokenIds.current();
        _safeMint(msg.sender, tokenId);
    }

    function tokenURI(uint256 tokenId)
    public
    view
    virtual
    override
    returns(string memory) {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        if (revealed == false) {
            return notRevealedUri;
        }

        string memory currentBaseURI = _baseURI();

        return
        bytes(currentBaseURI).length > 0 ?
            string(
                abi.encodePacked(
                    currentBaseURI,
                    tokenId.toString(),
                    baseExtension
                )
            ) :
            "";
    }

    function setBaseExtension(string memory _newBaseExtension)
    public
    onlyOwner {
        baseExtension = _newBaseExtension;
    }

    function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
        notRevealedUri = _notRevealedURI;
    }

    function totalSupply() public view returns(uint) {
        return _tokenIds.current();
    }
}



/**
  @title An OpenSea delegate proxy contract which we include for whitelisting.
  @author OpenSea
*/
contract OwnableDelegateProxy {}

/**
  @title An OpenSea proxy registry contract which we include for whitelisting.
  @author OpenSea
*/
contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}