export interface Product {
  id: number;
  type: 'account' | 'service';
  category: string;
  title: string;
  desc: string;
  price: string;
  icon: string;
}
