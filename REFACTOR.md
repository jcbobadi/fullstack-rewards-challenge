# Ejercicio 2 — Diagnóstico y refactor

## Alcance

Se priorizan los defectos con mayor impacto funcional y de rendimiento. No se reescribe toda la arquitectura porque el enunciado pide corregir las partes críticas y justificar los recortes.

## Problemas priorizados

1. **Petición HTTP durante el renderizado.** `fetch` se ejecuta en cada render y la respuesta llama a `setProducts`, provocando renders y nuevas peticiones repetidas. Se mueve la carga a `useEffect` y se cancela con `AbortController`.
2. **Mutación directa del estado.** `cart.push(product)` conserva la misma referencia y puede impedir que React detecte correctamente el cambio. Se reemplaza por una actualización inmutable.
3. **Búsqueda destructiva.** El código reemplaza `products` por la lista filtrada; al borrar el término no se recuperan productos. Se conserva el catálogo y se deriva `filteredProducts`.
4. **Estado potencialmente obsoleto.** `setPoints(points + 10)` puede calcular desde un valor viejo en actualizaciones agrupadas. Se usa `setPoints(current => current + 10)` en la UI de ejemplo.
5. **Lógica de recompensas confiada al cliente.** El cliente calcula y manda el total de puntos, que puede manipularse. La regla debe estar en el backend, con validación e idempotencia.
6. **Sin control de errores, carga ni cancelación.** Se añaden estados explícitos y manejo de errores.
7. **Lista sin `key` y controles no accesibles.** Se añade `key` estable, texto alternativo y botones con nombres comprensibles.

## Fragmentos refactorizados

### Carga controlada por efecto

```jsx
useEffect(() => {
  const controller = new AbortController();

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/products?category=${encodeURIComponent(category)}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error("No fue posible cargar los productos.");
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      if (error.name !== "AbortError") {
        setError(error.message);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  loadProducts();
  return () => controller.abort();
}, [category]);
```

### Filtrado derivado, sin perder el catálogo

```jsx
const filteredProducts = useMemo(() => {
  const query = search.trim().toLocaleLowerCase();
  return products.filter((product) =>
    product.name.toLocaleLowerCase().includes(query)
  );
}, [products, search]);
```

### Actualización inmutable del carrito

```jsx
function addToCart(product) {
  setCart((currentCart) => [...currentCart, product]);
}
```

### Recompensas en el servidor

El frontend envía `userId`, `productId` y el nombre de la acción, nunca el número de puntos. El backend valida la solicitud, consulta usuario/producto y aplica la regla de puntos. Para producción, la prevención de duplicados debe estar respaldada por una restricción única en base de datos y una transacción.

## Qué dejaría para una segunda iteración

- Persistencia en base de datos y autenticación.
- Pruebas de componentes y cobertura de casos de error.
- Servicio/hook de acceso a datos separado del componente.
- Contrato de API tipado, validación de esquema y observabilidad.
- Reversión del estado optimista del carrito si la API falla.
- Revisión de accesibilidad y rendimiento con datos de mayor volumen.

## Supuestos

- La carga de productos y las recompensas son operaciones distintas.
- La regla de puntos de la app demo es una vez por usuario/producto/acción.
- No se procesa ningún pago.
- El catálogo original debe permanecer intacto al buscar.


## Codigo COmpleto

```jsx
import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://api.tienda.com";

function ProductCatalog({ category }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar productos cuando cambia la categoría.
  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/products?category=${encodeURIComponent(category)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("No fue posible cargar los productos.");
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Ocurrió un error inesperado.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [category]);

  // Filtrar sin modificar el catálogo original.
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return products.filter((product) =>
      product.name.toLocaleLowerCase().includes(query)
    );
  }, [products, search]);

  function addToCart(product) {
    setCart((currentCart) => [...currentCart, product]);

    // Actualización funcional para evitar estados obsoletos.
    setPoints((currentPoints) => currentPoints + 10);
  }

  return (
    <section>
      <h2>Catálogo de productos</h2>

      <label htmlFor="product-search">
        Buscar productos
      </label>
      <input
        id="product-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Escribe el nombre de un producto"
      />

      <p aria-live="polite">Puntos: {points}</p>

      {loading && <p>Cargando productos...</p>}

      {error && (
        <p role="alert">
          {error}
          <button onClick={() => setSearch((value) => value)}>
            {/* El botón de reintento real se implementaría
                mediante una función de carga reutilizable. */}
            Cerrar
          </button>
        </p>
      )}

      {!loading && !error && filteredProducts.length === 0 && (
        <p>No se encontraron productos.</p>
      )}

      <div>
        {filteredProducts.map((product) => (
          <article key={product.id}>
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              width="160"
            />

            <h3>{product.name}</h3>
            <p>
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 0,
              }).format(product.price)}
            </p>

            <button
              type="button"
              onClick={() => addToCart(product)}
            >
              Agregar al carrito
            </button>
          </article>
        ))}
      </div>

      <p>Items en carrito: {cart.length}</p>
    </section>
  );
}

export default ProductCatalog;
```