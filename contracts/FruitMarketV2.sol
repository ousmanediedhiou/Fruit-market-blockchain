// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FruitMarketV1.sol";

/// @title FruitMarketV2
/// @notice Version 2 du contrat, avec une fonctionnalite additionnelle d'evaluation.
/// @dev On ajoute uniquement de nouvelles variables a la fin pour preserver le storage layout.
contract FruitMarketV2 is FruitMarketV1 {
    struct ProductRating {
        uint256 ratingSum;
        uint256 ratingCount;
    }

    error InvalidRating();
    error AlreadyRated();
    error OnlyBuyerCanRate();

    mapping(uint256 => ProductRating) internal productRatings;
    mapping(uint256 => mapping(address => bool)) internal hasRatedProduct;

    event ProductRated(uint256 indexed productId, address indexed buyer, uint8 rating);

    /// @notice Nouvelle fonctionnalite en V2 : un acheteur peut evaluer un produit de 1 a 5.
    function rateProduct(uint256 productId, uint8 rating) external {
        if (rating < 1 || rating > 5) revert InvalidRating();
        if (!_hasBuyerPurchasedProduct(msg.sender, productId)) revert OnlyBuyerCanRate();
        if (hasRatedProduct[productId][msg.sender]) revert AlreadyRated();

        hasRatedProduct[productId][msg.sender] = true;
        productRatings[productId].ratingSum += rating;
        productRatings[productId].ratingCount += 1;

        emit ProductRated(productId, msg.sender, rating);
    }

    function getProductRating(
        uint256 productId
    ) external view returns (uint256 ratingSum, uint256 ratingCount, uint256 averageScaledBy100) {
        ProductRating memory ratingData = productRatings[productId];
        uint256 average = 0;

        if (ratingData.ratingCount > 0) {
            average = (ratingData.ratingSum * 100) / ratingData.ratingCount;
        }

        return (ratingData.ratingSum, ratingData.ratingCount, average);
    }

    function _hasBuyerPurchasedProduct(address buyer, uint256 productId) internal view returns (bool) {
        uint256[] memory purchaseIds = buyerPurchaseIds[buyer];

        for (uint256 i = 0; i < purchaseIds.length; i++) {
            if (purchases[purchaseIds[i]].productId == productId) {
                return true;
            }
        }

        return false;
    }
}

