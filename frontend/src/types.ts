export type Party = "customer" | "tailor";

export type OrderStatus = "negotiating" | "accepted" | "rejected" | "confirmed";
export type BidStatus = "pending" | "countered" | "accepted" | "rejected";

export interface Bid {
  id: string;
  orderId: string;
  amount: number;
  proposedBy: Party;
  message: string | null;
  status: BidStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  tailorId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerLocation: string | null;
  tailorName: string | null;
  tailorShopName: string | null;
  tailorPhone: string | null;
  tailorLocation: string | null;
  description: string | null;
  status: OrderStatus;
  agreedPrice: number | null;
  createdAt: string;
  updatedAt: string;
  bids: Bid[];
  payment: Payment | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Party;
  shopName: string | null;
  phone: string | null;
  location: string | null;
}
