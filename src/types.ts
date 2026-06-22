export interface Group {
  id: number;
  title: string;
  image: string; // url or name
  active: boolean;
}

export interface SubGroup {
  id: number;
  groupId: number;
  title: string;
  image: string;
  active: boolean;
}

export interface ProductVariation {
  id: string;
  duration: string;
  type: string;
  provider: string;
  price: number;
}

export interface Product {
  id: number;
  type: 'account' | 'service';
  category: string;
  title: string;
  desc: string;
  price: string;
  icon: string;
  image?: string; // image selection URL/path
  active?: boolean;
  specs?: string; // New field for customizable detailed features/specs
  groupId?: number;
  subGroupId?: number;
  variations?: ProductVariation[];
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
