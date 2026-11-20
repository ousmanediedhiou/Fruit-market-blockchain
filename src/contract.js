export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
export const SUPPORTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 11155111);

// ABI minimale contenant seulement les fonctions utilisees par le front-end.
export const FRUIT_MARKET_ABI = [
  "function addProduct(string name, uint256 priceWei, uint256 stock) returns (uint256)",
  "function buyProduct(uint256 productId, uint256 quantity) payable",
  "function getActiveProducts() view returns ((uint256 id, address seller, string name, uint256 priceWei, uint256 stock, bool active, uint256 totalSold)[])",
  "function getProductRating(uint256 productId) view returns (uint256 ratingSum, uint256 ratingCount, uint256 averageScaledBy100)",
  "function rateProduct(uint256 productId, uint8 rating)"
];

