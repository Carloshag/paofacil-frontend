export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Product {
  id: string;
  nome?: string;
  name?: string;
  preço?: number;
  price?: number;
  description: string;
  image: string;
  category: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'done';
export type DeliveryMethod = 'pickup' | 'delivery';

export interface Order {
  id: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  notes: string;
  createdAt: string;
}
