export const POINTS_PER_ADD = 10;

// Persistencia en memoria para esta prueba: los datos se reinician al detener la API.
export const products = [
  { id: 1, name: "Café de origen 340 g", price: 32000, category: "Café", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=80", stock: 18 },
  { id: 2, name: "Prensa francesa", price: 65000, category: "Accesorios", image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=900&q=80", stock: 9 },
  { id: 3, name: "Café molido 500 g", price: 42000, category: "Café", image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80", stock: 12 },
  { id: 4, name: "Taza cerámica", price: 24000, category: "Accesorios", image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80", stock: 25 },
  { id: 5, name: "Café especial 250 g", price: 28000, category: "Café", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80", stock: 14 },
  { id: 6, name: "Molinillo manual", price: 79000, category: "Accesorios", image: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&w=900&q=80", stock: 6 },
  { id: 7, name: "Café de finca 1 kg", price: 76000, category: "Café", image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=80", stock: 8 },
  { id: 8, name: "Vaso térmico", price: 39000, category: "Accesorios", image: "https://images.unsplash.com/photo-1523362628745-0c100150bca?auto=format&fit=crop&w=900&q=80", stock: 11 }
];

export const users = new Map([
  [1, { id: 1, name: "Usuario demo", points: 0 }]
]);

// Evita premiar repetidamente el mismo producto/acción durante una misma sesión.
export const rewardedActions = new Set();
