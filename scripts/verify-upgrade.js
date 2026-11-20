const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const proxyAddress = process.env.PROXY_ADDRESS;

  if (!proxyAddress || proxyAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("Definis PROXY_ADDRESS dans le fichier .env avant la verification.");
  }

  const implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);
  const marketV2 = await hre.ethers.getContractAt("FruitMarketV2", proxyAddress);

  console.log("Proxy :", proxyAddress);
  console.log("Implementation actuelle :", implementationAddress);

  try {
    const rating = await marketV2.getProductRating(1);
    console.log("La fonction getProductRating existe. Retour :", rating);
  } catch (error) {
    console.log("Appel getProductRating impossible :", error.shortMessage || error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

