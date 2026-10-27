import { useCallback, useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
const USER_ID = 1;
const PAGE_SIZE = 6;
const money = (value) => new Intl.NumberFormat("es-CO", {
  style: "currency", currency: "COP", maximumFractionDigits: 0
}).format(value);

async function request(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message ?? "No fue posible completar la solicitud.");
  }
  return body;
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [cart, setCart] = useState([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingRewards, setPendingRewards] = useState(new Set());

  useEffect(() => {
    const controller = new AbortController();
    async function loadCategoriesAndPoints() {
      try {
        const [categoryResult, pointResult] = await Promise.all([
          request(`${API}/categories`, { signal: controller.signal }),
          request(`${API}/users/${USER_ID}/points`, { signal: controller.signal })
        ]);
        setCategories(categoryResult.data);
        setPoints(pointResult.points);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      }
    }
    loadCategoriesAndPoints();
    return () => controller.abort();
  }, []);

  const loadProducts = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (category) params.set("category", category);
    if (search) params.set("search", search);

    try {
      const result = await request(`${API}/products?${params}`, { signal });
      setProducts(result.data);
      setPagination(result.pagination);
    } catch (err) {
      if (!signal.aborted) setError(err.message);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, category, search]);

  useEffect(() => {
    const controller = new AbortController();
    loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts]);

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );
  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart]
  );

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function updateQuantity(productId, delta) {
    setCart((current) => current
      .map((item) => item.id === productId
        ? { ...item, quantity: Math.min(item.stock, item.quantity + delta) }
        : item)
      .filter((item) => item.quantity > 0));
  }

  async function addToCart(product) {
    // Actualización optimista: la interfaz responde inmediatamente.
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return current;
        return current.map((item) => item.id === product.id
          ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { ...product, quantity: 1 }];
    });

    // Una recompensa por producto y usuario en esta demo; el servidor impone la regla.
    if (pendingRewards.has(product.id)) return;
    setPendingRewards((current) => new Set(current).add(product.id));
    try {
      const result = await request(`${API}/rewards/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: USER_ID, productId: product.id, action: "ADD_TO_CART" })
      });
      setPoints(result.points);
      setNotice(result.awarded > 0
        ? `¡Ganaste ${result.awarded} puntos!`
        : "Este producto ya había generado puntos.");
    } catch (err) {
      setNotice(`El producto se agregó al carrito, pero no se pudieron actualizar los puntos: ${err.message}`);
    } finally {
      setPendingRewards((current) => {
        const next = new Set(current);
        next.delete(product.id);
        return next;
      });
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Origen, inicio">
          <span className="brand-mark">O</span>
          <span>origen<span className="brand-dot">.</span><small>TIENDA CON PROPÓSITO</small></span>
        </a>
        <div className="topbar-right">
          <div className="points-pill"><span aria-hidden="true">✦</span> {points} puntos</div>
          <a className="cart-link" href="#cart">Carrito <span>{cartCount}</span></a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">SELECCIÓN CONSCIENTE · RECOMPENSAS REALES</p>
            <h1>Pequeños rituales.<br /><em>Grandes recompensas.</em></h1>
            <p>Encuentra tus favoritos, arma tu carrito y suma puntos en cada nueva interacción.</p>
            <a className="hero-cta" href="#catalog">Explorar productos <span aria-hidden="true">↘</span></a>
          </div>
          <div className="hero-art" role="img" aria-label="Café servido en una taza sobre una mesa">
            <div className="hero-stamp">BUEN<br />ORIGEN<br /><span>✳</span></div>
          </div>
        </section>

        <section className="catalog-section" id="catalog">
          <div className="section-heading">
            <div><p className="eyebrow">DESCUBRE TU PRÓXIMO FAVORITO</p><h2>El catálogo</h2></div>
            <p className="muted">{pagination.total} productos disponibles</p>
          </div>

          <form className="toolbar" onSubmit={submitSearch}>
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Busca un producto..." aria-label="Buscar productos por nombre" />
            </label>
            <label className="category-select">
              <span className="sr-only">Filtrar por categoría</span>
              <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
                <option value="">Todas las categorías</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <button className="search-button" type="submit">Buscar</button>
          </form>

          {notice && <p className="notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Cerrar aviso">×</button></p>}
          {error && <div className="error-box" role="alert"><p>{error}</p><button onClick={() => window.location.reload()}>Volver a intentar</button></div>}

          {loading ? <div className="state-message"><span className="spinner" />Cargando catálogo…</div>
            : !error && products.length === 0
              ? <div className="state-message empty-state"><span>⌕</span><h3>No encontramos resultados</h3><p>Prueba otra búsqueda o cambia la categoría.</p></div>
              : !error && <div className="product-grid">
                {products.map((product, index) => <article className="product-card" key={product.id}>
                  <div className="product-image-wrap">
                    <img src={product.image} alt={product.name} loading="lazy" />
                    <span className="product-category">{product.category}</span>
                    {index === 0 && page === 1 && <span className="product-tag">DESTACADO</span>}
                  </div>
                  <div className="product-info">
                    <div><h3>{product.name}</h3><p className="stock">{product.stock} disponibles</p></div>
                    <p className="price">{money(product.price)}</p>
                    <button className="add-button" onClick={() => addToCart(product)}
                      disabled={product.stock < 1} aria-label={`Agregar ${product.name} al carrito`}>
                      <span>＋</span> Agregar al carrito
                    </button>
                  </div>
                </article>)}
              </div>}

          {!loading && !error && pagination.pages > 1 && <nav className="pagination" aria-label="Paginación del catálogo">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Anterior</button>
            <span>Página <strong>{page}</strong> de {pagination.pages}</span>
            <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Siguiente →</button>
          </nav>}
        </section>

        <section className="rewards-banner">
          <div className="reward-icon">✳</div>
          <div><p className="eyebrow">CADA INTERACCIÓN CUENTA</p><h2>Tu próxima recompensa<br />está más cerca.</h2></div>
          <div className="reward-total"><span>Tu saldo actual</span><strong>{points} <small>pts</small></strong><p>Acumula puntos explorando la tienda.</p></div>
        </section>

        <section className="cart-section" id="cart">
          <div className="section-heading"><div><p className="eyebrow">TU SELECCIÓN</p><h2>Tu carrito <span className="cart-count">({cartCount})</span></h2></div></div>
          {cart.length === 0 ? <div className="cart-empty">Tu carrito está esperando algo especial.</div> :
            <div className="cart-layout">
              <div className="cart-items">{cart.map((item) => <article className="cart-item" key={item.id}>
                <img src={item.image} alt="" />
                <div className="cart-item-name"><strong>{item.name}</strong><span>{money(item.price)}</span></div>
                <div className="quantity-control">
                  <button aria-label={`Quitar una unidad de ${item.name}`} onClick={() => updateQuantity(item.id, -1)}>−</button>
                  <span>{item.quantity}</span>
                  <button aria-label={`Agregar una unidad de ${item.name}`} disabled={item.quantity >= item.stock} onClick={() => updateQuantity(item.id, 1)}>＋</button>
                </div>
                <button className="remove-button" onClick={() => setCart((current) => current.filter((p) => p.id !== item.id))}>Quitar</button>
              </article>)}</div>
              <aside className="cart-summary"><p>RESUMEN DEL PEDIDO</p><div><span>Productos</span><span>{cartCount}</span></div><div className="total-row"><span>Total</span><strong>{money(cartTotal)}</strong></div><button onClick={() => setNotice("La compra es una demostración; no se ha realizado ningún cobro.")}>Continuar <span>→</span></button><small>Demo técnica · No se procesan pagos</small></aside>
            </div>}
        </section>
      </main>
      <footer><a className="brand footer-brand" href="#"><span className="brand-mark">O</span><span>origen<span className="brand-dot">.</span></span></a><span>Una experiencia de compra con recompensas.</span><span>Prueba técnica Fullstack · 2026</span></footer>
    </div>
  );
}
