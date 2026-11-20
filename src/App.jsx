import { useEffect, useState } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { CONTRACT_ADDRESS, FRUIT_MARKET_ABI, SUPPORTED_CHAIN_ID } from "./contract";

function App() {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [status, setStatus] = useState("Connectez votre portefeuille pour commencer.");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [networkName, setNetworkName] = useState("inconnu");
  const [form, setForm] = useState({
    name: "",
    priceEth: "",
    stock: "",
  });
  const [purchaseQuantities, setPurchaseQuantities] = useState({});
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    if (!window.ethereum) {
      setStatus("MetaMask n'est pas detecte. Installez-le pour utiliser la DApp.");
      return;
    }

    const browserProvider = new BrowserProvider(window.ethereum);
    setProvider(browserProvider);

    async function restoreSession() {
      const accounts = await browserProvider.send("eth_accounts", []);
      if (accounts.length > 0) {
        await connectWallet(browserProvider, false);
      }
    }

    restoreSession();

    const handleAccountsChanged = () => {
      connectWallet(browserProvider, false);
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  async function connectWallet(existingProvider = provider, shouldRequestAccounts = true) {
    try {
      if (!existingProvider) return;

      const accounts = shouldRequestAccounts
        ? await existingProvider.send("eth_requestAccounts", [])
        : await existingProvider.send("eth_accounts", []);

      if (accounts.length === 0) {
        setAccount("");
        setContract(null);
        setStatus("Aucun compte connecte.");
        return;
      }

      const network = await existingProvider.getNetwork();
      setNetworkName(network.name);

      if (Number(network.chainId) !== SUPPORTED_CHAIN_ID) {
        setAccount(accounts[0]);
        setContract(null);
        setStatus(
          `Reseau non supporte. Selectionnez le chainId ${SUPPORTED_CHAIN_ID} dans votre wallet.`
        );
        return;
      }

      if (!CONTRACT_ADDRESS) {
        setStatus("Definissez VITE_CONTRACT_ADDRESS dans votre fichier .env local du front-end.");
        return;
      }

      const signer = await existingProvider.getSigner();
      const marketContract = new Contract(CONTRACT_ADDRESS, FRUIT_MARKET_ABI, signer);

      setAccount(accounts[0]);
      setContract(marketContract);
      setStatus("Portefeuille connecte avec succes.");
      await loadProducts(marketContract);
    } catch (error) {
      setStatus(readableError(error));
    }
  }

  async function loadProducts(contractInstance = contract) {
    try {
      if (!contractInstance) return;

      setLoadingProducts(true);
      const activeProducts = await contractInstance.getActiveProducts();

      const productsWithRatings = await Promise.all(
        activeProducts.map(async (product) => {
          let ratingData = { ratingCount: 0, averageScaledBy100: 0 };

          try {
            const [, ratingCount, averageScaledBy100] = await contractInstance.getProductRating(product.id);
            ratingData = {
              ratingCount: Number(ratingCount),
              averageScaledBy100: Number(averageScaledBy100),
            };
          } catch (_) {
            // Le front-end reste compatible meme si on pointe encore sur la version v1.
          }

          return {
            id: Number(product.id),
            seller: product.seller,
            name: product.name,
            priceWei: product.priceWei,
            priceEth: formatEther(product.priceWei),
            stock: Number(product.stock),
            totalSold: Number(product.totalSold),
            ratingCount: ratingData.ratingCount,
            ratingAverage: ratingData.averageScaledBy100 / 100,
          };
        })
      );

      setProducts(productsWithRatings);
    } catch (error) {
      setStatus(readableError(error));
    } finally {
      setLoadingProducts(false);
    }
  }

  async function handleAddProduct(event) {
    event.preventDefault();

    try {
      if (!contract) return;

      setStatus("Transaction d'ajout en cours...");
      const tx = await contract.addProduct(form.name, parseEther(form.priceEth), Number(form.stock));
      await tx.wait();

      setForm({ name: "", priceEth: "", stock: "" });
      setStatus("Produit ajoute avec succes.");
      await loadProducts();
    } catch (error) {
      setStatus(readableError(error));
    }
  }

  async function handlePurchase(productId, priceEth) {
    try {
      if (!contract) return;

      const quantity = Number(purchaseQuantities[productId] || 1);
      if (quantity <= 0) {
        setStatus("La quantite doit etre superieure a zero.");
        return;
      }

      setStatus("Transaction d'achat en cours...");
      const totalPrice = parseEther(priceEth) * BigInt(quantity);
      const tx = await contract.buyProduct(productId, quantity, { value: totalPrice });
      await tx.wait();

      setStatus("Achat confirme sur la blockchain.");
      await loadProducts();
    } catch (error) {
      setStatus(readableError(error));
    }
  }

  async function handleRate(productId) {
    try {
      if (!contract) return;

      const rating = Number(ratings[productId] || 0);
      if (rating < 1 || rating > 5) {
        setStatus("La note doit etre comprise entre 1 et 5.");
        return;
      }

      setStatus("Envoi de la note au contrat...");
      const tx = await contract.rateProduct(productId, rating);
      await tx.wait();

      setStatus("Evaluation enregistree.");
      await loadProducts();
    } catch (error) {
      setStatus(readableError(error));
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">IFT-4100/7100 • TP3</p>
          <h1>Fruit Market DApp</h1>
          <p className="lead">
            Une marketplace decentralisee pour ajouter, acheter et evaluer des fruits sur une
            blockchain compatible EVM.
          </p>
        </div>
        <div className="wallet-card">
          <button className="primary-button" onClick={() => connectWallet()}>
            Connecter MetaMask
          </button>
          <p><strong>Compte :</strong> {account || "non connecte"}</p>
          <p><strong>Reseau :</strong> {networkName}</p>
          <p className="status">{status}</p>
        </div>
      </section>

      <section className="panel">
        <h2>Ajouter un produit</h2>
        <form className="form-grid" onSubmit={handleAddProduct}>
          <input
            type="text"
            placeholder="Nom du fruit"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            type="text"
            placeholder="Prix en ETH"
            value={form.priceEth}
            onChange={(event) => setForm({ ...form, priceEth: event.target.value })}
          />
          <input
            type="number"
            placeholder="Stock"
            min="1"
            value={form.stock}
            onChange={(event) => setForm({ ...form, stock: event.target.value })}
          />
          <button className="primary-button" type="submit">
            Publier le produit
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Catalogue</h2>
          <button className="secondary-button" onClick={() => loadProducts()} disabled={loadingProducts}>
            {loadingProducts ? "Chargement..." : "Rafraichir"}
          </button>
        </div>

        <div className="products-grid">
          {products.length === 0 && <p>Aucun produit actif pour le moment.</p>}

          {products.map((product) => (
            <article key={product.id} className="product-card">
              <span className="badge">Produit #{product.id}</span>
              <h3>{product.name}</h3>
              <p><strong>Prix :</strong> {product.priceEth} ETH</p>
              <p><strong>Stock :</strong> {product.stock}</p>
              <p><strong>Vendu :</strong> {product.totalSold}</p>
              <p><strong>Vendeur :</strong> {shortAddress(product.seller)}</p>
              <p>
                <strong>Note moyenne :</strong>{" "}
                {product.ratingCount > 0 ? `${product.ratingAverage.toFixed(2)} / 5` : "pas encore de note"}
              </p>

              <div className="inline-controls">
                <input
                  type="number"
                  min="1"
                  value={purchaseQuantities[product.id] || 1}
                  onChange={(event) =>
                    setPurchaseQuantities({
                      ...purchaseQuantities,
                      [product.id]: event.target.value,
                    })
                  }
                />
                <button
                  className="primary-button"
                  onClick={() => handlePurchase(product.id, product.priceEth)}
                >
                  Acheter
                </button>
              </div>

              <div className="inline-controls">
                <select
                  value={ratings[product.id] || ""}
                  onChange={(event) => setRatings({ ...ratings, [product.id]: event.target.value })}
                >
                  <option value="">Choisir une note</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
                <button className="secondary-button" onClick={() => handleRate(product.id)}>
                  Noter
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function readableError(error) {
  const message = error?.shortMessage || error?.reason || error?.message || "Erreur inconnue.";

  if (message.includes("user rejected")) {
    return "Transaction rejetee par l'utilisateur.";
  }

  if (message.includes("insufficient funds")) {
    return "Fonds insuffisants pour payer le gaz ou l'achat.";
  }

  if (message.includes("ProductInactive")) {
    return "Le produit n'est plus disponible.";
  }

  if (message.includes("IncorrectPayment")) {
    return "Le montant envoye ne correspond pas au prix total.";
  }

  if (message.includes("InsufficientStock")) {
    return "Le stock n'est pas suffisant pour cette commande.";
  }

  return message;
}

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default App;
