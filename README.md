# Origen — Catálogo y recompensas (prueba Fullstack)

Mini aplicación de e-commerce para la prueba técnica de Desarrollador Senior Fullstack. Incluye catálogo paginado, filtro por categoría, búsqueda por nombre, carrito y puntos administrados por el backend.

## Stack

- Frontend: React 18, Vite y CSS responsivo.
- Backend: Node.js + Express, API REST.
- Persistencia: memoria del proceso, permitida por el enunciado. Los datos demo se reinician al reiniciar el backend.
- Pruebas: `node:test` para endpoints básicos.

## Requisitos

- Node.js 20 o superior recomendado.
- npm 10 o compatible.
- Conexión a internet para cargar las imágenes remotas y la fuente web (la app no requiere conexión para instalar dependencias después de tenerlas disponibles).

## Instalación y ejecución

Desde la raíz del repositorio:

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001/api/health

Para ejecutar solo una parte:

```bash
npm run dev:backend
npm run dev:frontend
```

## Pruebas y build

```bash
npm test
npm run build
```

## Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/health` | Estado de la API |
| GET | `/api/categories` | Categorías disponibles |
| GET | `/api/products?page=1&limit=6` | Catálogo paginado |
| GET | `/api/products?category=Café&search=molido` | Filtro de categoría y búsqueda en servidor |
| GET | `/api/users/1/points` | Saldo de puntos del usuario demo |
| POST | `/api/rewards/actions` | Registra una acción de recompensa |

Ejemplo de recompensa:

```json
{
  "userId": 1,
  "productId": 1,
  "action": "ADD_TO_CART"
}
```

El cliente no envía un valor de puntos. El backend aplica la regla fija de 10 puntos por primera acción de agregar cada producto por usuario durante la vida del proceso. Si la misma acción se repite, no se vuelve a premiar.

## Decisiones y supuestos

1. Se usa React porque permite construir la interfaz solicitada rápidamente sin sacrificar separación de responsabilidades.
2. La paginación, la categoría y la búsqueda se aplican en el backend.
3. El carrito es estado del frontend y ofrece respuesta optimista al usuario. No hay checkout real ni cobros.
4. La demo utiliza un único usuario (`id=1`) para evitar añadir autenticación fuera del alcance temporal.
5. Las recompensas son por producto distinto agregado al carrito y por usuario, una sola vez en el proceso actual. Es una regla de demostración que debe confirmarse con producto/negocio.
6. El servidor calcula los puntos y no confía en un monto enviado por el navegador.
7. La persistencia en memoria cumple la alternativa explícita de la prueba, pero no sobrevive a reinicios y no sirve para múltiples instancias de API.
8. Las imágenes son URLs remotas de Unsplash; para producción se verificarían licencias, disponibilidad y optimización.
9. La acción “Continuar” del resumen es demostrativa y no procesa pagos.

## Limitaciones conocidas / siguiente iteración

- Sustituir el almacenamiento en memoria por SQLite o PostgreSQL si se requiere persistencia real.
- Agregar autenticación/autorización; no exponer un usuario fijo.
- Persistir carrito y registrar pedidos reales.
- Hacer la recompensa idempotente en una base de datos con una restricción única transaccional.
- Mejorar la actualización optimista con rollback del carrito si la acción falla; en esta demo el carrito se actualiza aunque la petición de puntos falle.
- Añadir pruebas de integración para filtros, errores, stock, idempotencia y flujo de carrito.
- Añadir validación de esquema (por ejemplo, Zod), rate limiting, logs estructurados y configuración por variables de entorno.
- Reemplazar imágenes remotas por assets controlados y añadir estrategia de fallback.
- Para una prueba de producción, revisar accesibilidad con teclado/lector de pantalla y pruebas visuales en varios tamaños.

## Arquitectura

```text
React (Vite)
  ├── GET /api/products?page&limit&category&search
  ├── GET /api/categories
  ├── GET /api/users/:userId/points
  └── POST /api/rewards/actions
             ↓
        Express API
             ↓
       Store en memoria
```