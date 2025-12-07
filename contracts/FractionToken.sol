
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FractionToken
 * @dev 부동산 지분 투자용 ERC-20 토큰 예시입니다.
 */
contract FractionToken is ERC20, Ownable {
    uint256 public propertyId;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 propertyId_,
        uint256 initialSupply
    ) ERC20(name_, symbol_) {
        propertyId = propertyId_;
        _mint(msg.sender, initialSupply);
    }
}
