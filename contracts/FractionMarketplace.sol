
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title FractionMarketplace
 * @dev 부동산 지분 토큰을 사고파는 간단한 마켓플레이스 예시입니다.
 */
contract FractionMarketplace {
    struct Listing {
        uint256 listingId;
        address seller;
        address token;
        uint256 amount;
        uint256 pricePerToken; // wei 단위
        bool isActive;
    }

    uint256 private _nextListingId = 1;
    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed listingId, address indexed seller, address token, uint256 amount, uint256 pricePerToken);
    event Cancelled(uint256 indexed listingId);
    event Purchased(uint256 indexed listingId, address indexed buyer, uint256 amount);

    function createListing(address token, uint256 amount, uint256 pricePerToken) external returns (uint256) {
        require(amount > 0, "amount must be > 0");
        require(pricePerToken > 0, "price must be > 0");

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        uint256 listingId = _nextListingId++;
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            token: token,
            amount: amount,
            pricePerToken: pricePerToken,
            isActive: true
        });

        emit Listed(listingId, msg.sender, token, amount, pricePerToken);
        return listingId;
    }

    function cancelListing(uint256 listingId) external {
        Listing storage ls = listings[listingId];
        require(ls.isActive, "not active");
        require(ls.seller == msg.sender, "not seller");

        ls.isActive = false;
        IERC20(ls.token).transfer(ls.seller, ls.amount);

        emit Cancelled(listingId);
    }

    function buy(uint256 listingId, uint256 amount) external payable {
        Listing storage ls = listings[listingId];
        require(ls.isActive, "not active");
        require(amount > 0 && amount <= ls.amount, "invalid amount");

        uint256 cost = amount * ls.pricePerToken;
        require(msg.value == cost, "wrong ETH value");

        // ETH 전송
        payable(ls.seller).transfer(cost);
        // 토큰 전송
        IERC20(ls.token).transfer(msg.sender, amount);

        ls.amount -= amount;
        if (ls.amount == 0) {
            ls.isActive = false;
        }

        emit Purchased(listingId, msg.sender, amount);
    }
}
