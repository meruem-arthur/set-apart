export type Product = {
  id: number;
  name: string;
  collection: string;
  price: number;
  color: string;
  sizes: string[];
  image: string;
  description: string;
  badge?: string;
};

export const PRODUCTS: Product[] = [
  { id: 101, name: "Shadow Signal", collection: "Anime", price: 95, color: "Black", sizes: ["S","M","L","XL","XXL"], image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85", description: "A heavyweight graphic tee built for quiet confidence.", badge: "NEW" },
  { id: 102, name: "Do Unto Others", collection: "Faith", price: 85, color: "Cream", sizes: ["S","M","L","XL"], image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85", description: "A clean statement piece inspired by the principle of treating others well." },
  { id: 103, name: "Set Apart Core", collection: "Originals", price: 80, color: "White", sizes: ["S","M","L","XL","XXL"], image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=85", description: "The essential SET APART tee. Minimal front. Identity at the back." },
  { id: 104, name: "Lost In The Frame", collection: "Anime", price: 100, color: "Black", sizes: ["M","L","XL","XXL"], image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=85", description: "Oversized graphic energy with a darker anime-inspired edge.", badge: "LIMITED" },
  { id: 105, name: "Different By Design", collection: "Originals", price: 90, color: "Nude", sizes: ["S","M","L","XL"], image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85", description: "A relaxed graphic tee for people who refuse to blend in." },
  { id: 106, name: "Still Becoming", collection: "Faith", price: 90, color: "Black", sizes: ["S","M","L","XL","XXL"], image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1200&q=85", description: "A quiet reminder that growth is part of the story." },
];

export const COLLECTIONS = [
  { name: "Anime", slug: "anime", description: "Graphic energy for the ones who live in another frame." },
  { name: "Faith", slug: "faith", description: "Statements rooted in what matters." },
  { name: "Originals", slug: "originals", description: "The core SET APART language." },
  { name: "Limited Drops", slug: "limited", description: "Small runs. No guarantees. When it's gone, it's gone." },
];
