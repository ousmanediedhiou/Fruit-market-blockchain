const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("FruitMarket upgradeable DApp", function () {
  async function deployFixture() {
    const [owner, seller, buyer, otherBuyer] = await ethers.getSigners();

    const FruitMarketV1 = await ethers.getContractFactory("FruitMarketV1");
    const market = await upgrades.deployProxy(FruitMarketV1, [owner.address], {
      initializer: "initialize",
      kind: "uups",
    });
    await market.waitForDeployment();

    return { market, owner, seller, buyer, otherBuyer };
  }

  it("deploie le proxy correctement", async function () {
    const { market } = await deployFixture();
    const address = await market.getAddress();

    expect(address).to.properAddress;
  });

  it("permet a un vendeur d'ajouter un fruit", async function () {
    const { market, seller } = await deployFixture();

    await market.connect(seller).addProduct("Mangue", ethers.parseEther("0.01"), 25);
    const product = await market.getProduct(1);

    expect(product.name).to.equal("Mangue");
    expect(product.seller).to.equal(seller.address);
    expect(product.stock).to.equal(25);
    expect(product.active).to.equal(true);
  });

  it("permet l'achat et met a jour le stock", async function () {
    const { market, seller, buyer } = await deployFixture();
    const price = ethers.parseEther("0.02");

    await market.connect(seller).addProduct("Banane", price, 10);
    await market.connect(buyer).buyProduct(1, 3, { value: price * 3n });

    const product = await market.getProduct(1);
    const purchase = await market.getPurchase(1);

    expect(product.stock).to.equal(7);
    expect(product.totalSold).to.equal(3);
    expect(purchase.buyer).to.equal(buyer.address);
    expect(purchase.totalPaidWei).to.equal(price * 3n);
  });

  it("refuse un achat si les fonds sont insuffisants", async function () {
    const { market, seller, buyer } = await deployFixture();
    const price = ethers.parseEther("0.015");

    await market.connect(seller).addProduct("Orange", price, 8);

    await expect(
      market.connect(buyer).buyProduct(1, 2, { value: price })
    ).to.be.revertedWithCustomError(market, "IncorrectPayment");

    const product = await market.getProduct(1);
    expect(product.stock).to.equal(8);
  });

  it("applique le controle d'acces pour la mise a jour d'une annonce", async function () {
    const { market, seller, buyer } = await deployFixture();
    const price = ethers.parseEther("0.01");

    await market.connect(seller).addProduct("Pomme", price, 12);

    await expect(
      market.connect(buyer).updateProduct(1, ethers.parseEther("0.02"), 20)
    ).to.be.revertedWithCustomError(market, "UnauthorizedSeller");
  });

  it("conserve l'etat apres upgrade vers v2 et permet la notation", async function () {
    const { market, seller, buyer } = await deployFixture();
    const price = ethers.parseEther("0.03");

    await market.connect(seller).addProduct("Ananas", price, 5);
    await market.connect(buyer).buyProduct(1, 1, { value: price });

    const FruitMarketV2 = await ethers.getContractFactory("FruitMarketV2");
    const upgraded = await upgrades.upgradeProxy(await market.getAddress(), FruitMarketV2);

    const productAfterUpgrade = await upgraded.getProduct(1);
    expect(productAfterUpgrade.name).to.equal("Ananas");
    expect(productAfterUpgrade.stock).to.equal(4);

    await upgraded.connect(buyer).rateProduct(1, 5);
    const [, ratingCount, averageScaledBy100] = await upgraded.getProductRating(1);

    expect(ratingCount).to.equal(1);
    expect(averageScaledBy100).to.equal(500);
  });
});
