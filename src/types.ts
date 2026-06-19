export interface Product {
  id: number;
  type: 'account' | 'service';
  category: string;
  title: string;
  desc: string;
  price: string;
  icon: string;
  image?: string;
  details?: string;
  isAvailable?: boolean;
}

export interface Order {
  id: number;
  productId: number;
  productTitle: string;
  productPrice: string;
  userId: string;
  status: 'pending' | 'completed' | 'canceled';
  createdAt: string;
  details?: string;
  deliveredContent?: string;
}

export interface ChatMessage {
  sender: 'user' | 'admin';
  text: string;
  createdAt: string;
}

export interface Chat {
  id: number;
  userId: string;
  messages: ChatMessage[];
  updatedAt: string;
}
