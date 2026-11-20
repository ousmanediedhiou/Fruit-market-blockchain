const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const { PRIVATE_KEY, SEPOLIA_RPC_URL, ETHERSCAN_API_KEY, PROXY_ADDRESS } = process.env;

  console.log("Verification de la configuration Sepolia...");
  console.log("RPC configure :", Boolean(SEPOLIA_RPC_URL));
  console.log("Cle privee configuree :", Boolean(PRIVATE_KEY));
  console.log("Cle Etherscan configuree :", Boolean(ETHERSCAN_API_KEY));
  console.log("Proxy deja renseigne :", Boolean(PROXY_ADDRESS && !PROXY_ADDRESS.endsWith("0000000000000000000000000000000000000000")));

  if (!PRIVATE_KEY || PRIVATE_KEY.includes("YOUR_PRIVATE_KEY_HERE")) {
    throw new Error("PRIVATE_KEY n'est pas configuree correctement dans .env.");
  }

  if (!SEPOLIA_RPC_URL || SEPOLIA_RPC_URL.includes("YOUR_API_KEY_HERE")) {
    throw new Error("SEPOLIA_RPC_URL n'est pas configuree correctement dans .env.");
  }

  const network = await hre.ethers.provider.getNetwork();
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("Chain ID detecte :", Number(network.chainId));
  console.log("Nom du reseau :", network.name);
  console.log("Compte de deploiement :", deployer.address);
  console.log("Solde du compte :", hre.ethers.formatEther(balance), "ETH");

  if (Number(network.chainId) !== 11155111) {
    throw new Error("Le reseau detecte n'est pas Sepolia.");
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

