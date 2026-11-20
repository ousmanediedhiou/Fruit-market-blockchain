const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploiement avec le compte :", deployer.address);

  const FruitMarketV1 = await hre.ethers.getContractFactory("FruitMarketV1");

  // deployProxy cree le proxy + l'implementation puis appelle initialize(...)
  const fruitMarket = await hre.upgrades.deployProxy(FruitMarketV1, [deployer.address], {
    initializer: "initialize",
    kind: "uups",
  });

  await fruitMarket.waitForDeployment();

  const proxyAddress = await fruitMarket.getAddress();
  const implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("Proxy address :", proxyAddress);
  console.log("Implementation v1 :", implementationAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

