export interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  quantity: number;
  sold?: number;
  photo: FormData;
  shipping: boolean;
  createdAt: string;
}

export interface Price {
  id: number;
  name: string;
  array: [number?, number?];
}
