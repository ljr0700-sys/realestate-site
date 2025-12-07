
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RealEstateRegistry
 * @dev 실물 부동산과 온체인 자산(NFT/토큰)을 연결하는 기본 레지스트리 예시입니다.
 * 실제 서비스에서는 접근제어(Ownable/AccessControl), 실명 검증, 법률 검토 절차가 필요합니다.
 */
contract RealEstateRegistry {
    struct PropertyMeta {
        uint256 propertyId;
        string offchainHash; // 등기부등본/계약서 등의 해시값(IPFS 등)
        address owner;       // 소유자(또는 신탁사/플랫폼)
        address nftContract; // 소유권 NFT 컨트랙트 주소
        address fractionToken; // 지분 토큰(ERC-20) 주소
        bool isFractionalized;
        bool isActive;
        string countryCode; // 예: "KR"
    }

    uint256 private _nextId = 1;
    mapping(uint256 => PropertyMeta) public properties;

    event PropertyRegistered(uint256 indexed propertyId, address indexed owner, string offchainHash);
    event PropertyUpdated(uint256 indexed propertyId);
    event PropertyDeactivated(uint256 indexed propertyId);

    modifier onlyExisting(uint256 propertyId) {
        require(properties[propertyId].propertyId != 0, "Property does not exist");
        _;
    }

    // 단순 예시: msg.sender를 관리자라고 가정 (실제 구현 시 Ownable/AccessControl 적용)
    function registerProperty(
        string memory offchainHash,
        address owner,
        string memory countryCode
    ) external returns (uint256) {
        uint256 propertyId = _nextId++;
        properties[propertyId] = PropertyMeta({
            propertyId: propertyId,
            offchainHash: offchainHash,
            owner: owner,
            nftContract: address(0),
            fractionToken: address(0),
            isFractionalized: false,
            isActive: true,
            countryCode: countryCode
        });

        emit PropertyRegistered(propertyId, owner, offchainHash);
        return propertyId;
    }

    function linkNFT(uint256 propertyId, address nft) external onlyExisting(propertyId) {
        properties[propertyId].nftContract = nft;
        emit PropertyUpdated(propertyId);
    }

    function linkFractionToken(uint256 propertyId, address token) external onlyExisting(propertyId) {
        properties[propertyId].fractionToken = token;
        properties[propertyId].isFractionalized = true;
        emit PropertyUpdated(propertyId);
    }

    function deactivateProperty(uint256 propertyId) external onlyExisting(propertyId) {
        properties[propertyId].isActive = false;
        emit PropertyDeactivated(propertyId);
    }
}
