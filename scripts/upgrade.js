const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const proxyAddress = process.env.PROXY_ADDRESS;

  if (!proxyAddress || proxyAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("Definis PROXY_ADDRESS dans le fichier .env avant de lancer l'upgrade.");
  }

  const FruitMarketV2 = await hre.ethers.getContractFactory("FruitMarketV2");

  // upgradeProxy conserve l'etat stocke dans le proxy et remplace uniquement l'implementation.
  const upgraded = await hre.upgrades.upgradeProxy(proxyAddress, FruitMarketV2);
  await upgraded.waitForDeployment();

  const implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("Proxy conserve :", proxyAddress);
  console.log("Nouvelle implementation v2 :", implementationAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

