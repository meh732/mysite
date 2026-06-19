export interface Product {
  id: number;
  type: 'account' | 'service';
  category: string;
  title: string;
  desc: string;
  price: string;
  icon: string;
  active?: boolean;
}

export interface Order {
  id: number;
  productId: number;
  productTitle: string;
  productType: 'account' | 'service';
  userIdentifier: string; // email or phone
  price: string;
  status: 'pending' | 'completed' | 'canceled';
  createdAt: string;
  additionalDetails?: string;
}
