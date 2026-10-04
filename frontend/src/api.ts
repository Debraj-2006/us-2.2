import type { Category, Order, Party, Product, TailorCatalog, UserProfile } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  return body as T;
}

export function createOrder(params: {
  customerId: string;
  tailorId: string;
  description?: string;
  initialAmount: number;
  proposedBy: Party;
}) {
  return request<Order>("/api/orders", { method: "POST", body: JSON.stringify(params) });
}

export function getOrder(orderId: string) {
  return request<Order>(`/api/orders/${orderId}`);
}

export function placeCounterOffer(orderId: string, params: { amount: number; proposedBy: Party; message?: string }) {
  return request(`/api/orders/${orderId}/bids`, { method: "POST", body: JSON.stringify(params) });
}

export function acceptBid(orderId: string, bidId: string, acceptedBy: Party) {
  return request<Order>(`/api/orders/${orderId}/bids/${bidId}/accept`, {
    method: "POST",
    body: JSON.stringify({ acceptedBy }),
  });
}

export function rejectBid(orderId: string, bidId: string, rejectedBy: Party) {
  return request<Order>(`/api/orders/${orderId}/bids/${bidId}/reject`, {
    method: "POST",
    body: JSON.stringify({ rejectedBy }),
  });
}

export function createPaymentIntent(orderId: string) {
  return request<{ clientSecret: string; publishableKey: string }>(`/api/orders/${orderId}/payment/intent`, {
    method: "POST",
  });
}

export function confirmPayment(orderId: string) {
  return request<Order>(`/api/orders/${orderId}/payment/confirm`, { method: "POST" });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const res = await fetch(`${BASE_URL}/api/users/${uid}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

export function upsertUser(params: {
  uid: string;
  email: string;
  name: string;
  role: Party;
  shopName?: string;
  phone?: string;
  location?: string;
}) {
  return request<UserProfile>("/api/users", { method: "POST", body: JSON.stringify(params) });
}

export function getCategories(tailorId: string) {
  return request<Category[]>(`/api/tailors/${tailorId}/categories`);
}

export function createCategory(tailorId: string, name: string) {
  return request<Category>(`/api/tailors/${tailorId}/categories`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function deleteCategory(tailorId: string, categoryId: string) {
  return request<void>(`/api/tailors/${tailorId}/categories/${categoryId}`, { method: "DELETE" });
}

export function getProducts(tailorId: string) {
  return request<Product[]>(`/api/tailors/${tailorId}/products`);
}

export function createProduct(
  tailorId: string,
  params: { categoryId: string; name: string; price: number; imageUrl?: string; description?: string }
) {
  return request<Product>(`/api/tailors/${tailorId}/products`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function deleteProduct(tailorId: string, productId: string) {
  return request<void>(`/api/tailors/${tailorId}/products/${productId}`, { method: "DELETE" });
}

export function getCatalogByEmail(email: string) {
  return request<TailorCatalog>(`/api/tailors/by-email/${encodeURIComponent(email)}/catalog`);
}
