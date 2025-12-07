
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RentalContract
 * @dev 부동산 임대/펜션 예약 계약을 관리하는 기본 예시입니다.
 * 실제 서비스에서는 분쟁 해결, 강제 집행력, 세금 처리가 별도로 필요합니다.
 */
contract RentalContract {
    enum RentalStatus {
        Pending,
        Active,
        Ended,
        Cancelled
    }

    struct Rental {
        uint256 rentalId;
        uint256 propertyId;
        address landlord;
        address tenant;
        uint256 startDate;
        uint256 endDate;
        uint256 deposit;
        uint256 rentAmount;
        RentalStatus status;
    }

    uint256 private _nextRentalId = 1;
    mapping(uint256 => Rental) public rentals;

    event RentalRequested(uint256 indexed rentalId, uint256 propertyId, address tenant);
    event RentalApproved(uint256 indexed rentalId);
    event RentalEnded(uint256 indexed rentalId);
    event RentalCancelled(uint256 indexed rentalId);

    function requestRental(
        uint256 propertyId,
        uint256 startDate,
        uint256 endDate,
        uint256 deposit,
        uint256 rentAmount
    ) external returns (uint256) {
        uint256 rentalId = _nextRentalId++;
        rentals[rentalId] = Rental({
            rentalId: rentalId,
            propertyId: propertyId,
            landlord: msg.sender, // 단순 예시: msg.sender를 임대인으로 가정
            tenant: address(0),
            startDate: startDate,
            endDate: endDate,
            deposit: deposit,
            rentAmount: rentAmount,
            status: RentalStatus.Pending
        });

        emit RentalRequested(rentalId, propertyId, msg.sender);
        return rentalId;
    }

    // 예시: 임차인은 나중에 별도 계약에서 설정하거나, 수정 필요
}
