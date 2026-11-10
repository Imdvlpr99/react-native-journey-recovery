export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  postalCode: string;
}

export type DeliveryMethod = 'standard' | 'express' | 'same_day';

export interface CheckoutJourneyData {
  step: 'cart' | 'shipping' | 'delivery' | 'review';
  cartItems: CartItem[];
  shippingAddress?: ShippingAddress;
  deliveryMethod?: DeliveryMethod;
}

