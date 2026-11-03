export type Category = {
  slug: string;
  name: string;
  caption: string;
  image: string;
};
export type ProductVariant = {
  id: string;
  label: string;
  price: number;
  stock: number;
  container: string;
};
export type Product = {
  id: string;
  slug: string;
  name: string;
  latin: string;
  category: string;
  sku: string;
  description: string;
  shortDescription?: string;
  isDemo?: boolean;
  images?: { url: string; alt: string }[];
  image: string;
  isNew: boolean;
  publishedAt: number;
  attributes: { name: string; value: string }[];
  variants: ProductVariant[];
};
export type CatalogFilters = {
  q: string;
  category: string;
  min: string;
  max: string;
  available: boolean;
  sort: "newest" | "price-asc" | "price-desc";
  page: number;
};
export interface CatalogRepository {
  list(
    filters: CatalogFilters,
  ): Promise<{
    products: Product[];
    total: number;
    pages: number;
    page: number;
  }>;
  findBySlug(slug: string): Promise<Product | undefined>;
  categories(): Promise<Category[]>;
}
