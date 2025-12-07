
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RealEstateNFT
 * @dev 부동산 전체 소유권 또는 호수 단위 소유권을 나타내는 ERC-721 NFT 예시입니다.
 */
contract RealEstateNFT is ERC721, Ownable {
    uint256 private _nextTokenId = 1;
    mapping(uint256 => uint256) public tokenToPropertyId;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function mintPropertyNFT(address to, uint256 propertyId) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        tokenToPropertyId[tokenId] = propertyId;
        return tokenId;
    }
}
