// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/// @title FruitMarketV1
/// @notice Marketplace decentralisee simple pour gerer des fruits et leurs achats.
/// @dev Le contrat est "upgradeable", donc on n'utilise pas de constructeur.
contract FruitMarketV1 is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    struct Product {
        uint256 id;
        address seller;
        string name;
        uint256 priceWei;
        uint256 stock;
        bool active;
        uint256 totalSold;
    }

    struct Purchase {
        uint256 productId;
        address buyer;
        uint256 quantity;
        uint256 totalPaidWei;
        uint256 timestamp;
    }

    error EmptyName();
    error InvalidPrice();
    error InvalidStock();
    error ProductNotFound();
    error PurchaseNotFound();
    error UnauthorizedSeller();
    error ProductInactive();
    error QuantityMustBeGreaterThanZero();
    error InsufficientStock(uint256 available, uint256 requested);
    error IncorrectPayment(uint256 expected, uint256 received);
    error TransferFailed();

    uint256 public nextProductId;
    uint256 public nextPurchaseId;

    mapping(uint256 => Product) internal products;
    mapping(uint256 => Purchase) internal purchases;
    mapping(address => uint256[]) internal sellerProductIds;
    mapping(address => uint256[]) internal buyerPurchaseIds;

    event ProductAdded(
        uint256 indexed productId,
        address indexed seller,
        string name,
        uint256 priceWei,
        uint256 stock
    );
    event ProductUpdated(uint256 indexed productId, uint256 newPriceWei, uint256 newStock);
    event ProductDeactivated(uint256 indexed productId);
    event ProductPurchased(
        uint256 indexed purchaseId,
        uint256 indexed productId,
        address indexed buyer,
        uint256 quantity,
        uint256 totalPaidWei
    );

    /// @notice Remplace le constructeur dans un contrat upgradeable.
    /// @param initialOwner Adresse qui recevra les droits d'administration.
    function initialize(address initialOwner) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        transferOwnership(initialOwner);

        nextProductId = 1;
        nextPurchaseId = 1;
    }

    /// @notice Fonction obligatoire avec le pattern UUPS.
    /// @dev Ici seul le proprietaire du proxy peut autoriser une mise a niveau.
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Permet a un vendeur d'ajouter un fruit au catalogue.
    function addProduct(
        string calldata name,
        uint256 priceWei,
        uint256 stock
    ) external returns (uint256 productId) {
        if (bytes(name).length == 0) revert EmptyName();
        if (priceWei == 0) revert InvalidPrice();
        if (stock == 0) revert InvalidStock();

        productId = nextProductId;
        nextProductId++;

        products[productId] = Product({
            id: productId,
            seller: msg.sender,
            name: name,
            priceWei: priceWei,
            stock: stock,
            active: true,
            totalSold: 0
        });

        sellerProductIds[msg.sender].push(productId);

        emit ProductAdded(productId, msg.sender, name, priceWei, stock);
    }

    /// @notice Permet au vendeur original de modifier son prix ou son stock.
    function updateProduct(uint256 productId, uint256 newPriceWei, uint256 newStock) external {
        Product storage product = _getExistingProduct(productId);
        if (product.seller != msg.sender) revert UnauthorizedSeller();
        if (newPriceWei == 0) revert InvalidPrice();
        if (newStock == 0) revert InvalidStock();

        product.priceWei = newPriceWei;
        product.stock = newStock;

        emit ProductUpdated(productId, newPriceWei, newStock);
    }

    /// @notice Permet au vendeur de retirer un produit du catalogue sans effacer l'historique.
    function deactivateProduct(uint256 productId) external {
        Product storage product = _getExistingProduct(productId);
        if (product.seller != msg.sender) revert UnauthorizedSeller();

        product.active = false;
        emit ProductDeactivated(productId);
    }

    /// @notice Achat d'un fruit.
    /// @dev On applique Checks-Effects-Interactions :
    /// 1) on valide tout,
    /// 2) on met a jour l'etat,
    /// 3) on envoie l'argent au vendeur.
    function buyProduct(uint256 productId, uint256 quantity) external payable nonReentrant {
        Product storage product = _getExistingProduct(productId);
        if (!product.active) revert ProductInactive();
        if (quantity == 0) revert QuantityMustBeGreaterThanZero();
        if (product.stock < quantity) revert InsufficientStock(product.stock, quantity);

        uint256 totalPrice = product.priceWei * quantity;
        if (msg.value != totalPrice) revert IncorrectPayment(totalPrice, msg.value);

        product.stock -= quantity;
        product.totalSold += quantity;

        if (product.stock == 0) {
            product.active = false;
        }

        uint256 purchaseId = nextPurchaseId;
        nextPurchaseId++;

        purchases[purchaseId] = Purchase({
            productId: productId,
            buyer: msg.sender,
            quantity: quantity,
            totalPaidWei: totalPrice,
            timestamp: block.timestamp
        });

        buyerPurchaseIds[msg.sender].push(purchaseId);

        (bool success, ) = payable(product.seller).call{value: totalPrice}("");
        if (!success) revert TransferFailed();

        emit ProductPurchased(purchaseId, productId, msg.sender, quantity, totalPrice);
    }

    function getProduct(uint256 productId) external view returns (Product memory) {
        return _getExistingProduct(productId);
    }

    function getPurchase(uint256 purchaseId) external view returns (Purchase memory) {
        Purchase memory purchase = purchases[purchaseId];
        if (purchase.timestamp == 0) revert PurchaseNotFound();
        return purchase;
    }

    function getSellerProductIds(address seller) external view returns (uint256[] memory) {
        return sellerProductIds[seller];
    }

    function getBuyerPurchaseIds(address buyer) external view returns (uint256[] memory) {
        return buyerPurchaseIds[buyer];
    }

    function getActiveProducts() external view returns (Product[] memory) {
        uint256 totalProducts = nextProductId - 1;
        uint256 activeCount = 0;

        for (uint256 i = 1; i <= totalProducts; i++) {
            if (products[i].id != 0 && products[i].active) {
                activeCount++;
            }
        }

        Product[] memory activeProducts = new Product[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalProducts; i++) {
            if (products[i].id != 0 && products[i].active) {
                activeProducts[currentIndex] = products[i];
                currentIndex++;
            }
        }

        return activeProducts;
    }

    function _getExistingProduct(uint256 productId) internal view returns (Product storage product) {
        product = products[productId];
        if (product.id == 0) revert ProductNotFound();
    }
}
