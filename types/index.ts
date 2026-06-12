export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: "coffee" | "tea" | "pastry";
  description?: string;
  emoji: string;
  available: boolean;
  allowHotIce?: boolean; // can be served hot or iced
}

export type CupSize = "small" | "medium" | "large";
export type Temperature = "hot" | "iced";

export interface Extra {
  id: string;
  label: string;
  price: number;
}

export const EXTRAS: Extra[] = [
  { id: "extra_shot", label: "Extra Shot", price: 30 },
  { id: "oat_milk", label: "Oat Milk", price: 25 },
  { id: "vanilla_syrup", label: "Vanilla Syrup", price: 20 },
  { id: "caramel_syrup", label: "Caramel Syrup", price: 20 },
  { id: "hazelnut_syrup", label: "Hazelnut Syrup", price: 20 },
  { id: "whipped_cream", label: "Whipped Cream", price: 15 },
  { id: "brown_sugar", label: "Brown Sugar", price: 10 },
];

export const CUP_SIZE_PRICE: Record<CupSize, number> = {
  small: 0,
  medium: 20,
  large: 40,
};

export const CUP_SIZE_LABEL: Record<CupSize, string> = {
  small: "S",
  medium: "M",
  large: "L",
};

export interface Customization {
  temperature?: Temperature;
  size: CupSize;
  extras: Extra[];
  notes?: string;
}

export interface CartItem {
  id: string; // unique cart line id (menuItem.id + customization hash)
  menuItem: MenuItem;
  quantity: number;
  customization: Customization;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  paymentMethod: "cash" | "card" | "gcash";
  createdAt: Date;
  orderNumber: number;
  customerName?: string;
}

export type PaymentMethod = "cash" | "card" | "gcash";
export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

export function calcItemPrice(item: MenuItem, customization: Customization): number {
  const sizeExtra = CUP_SIZE_PRICE[customization.size];
  const extrasTotal = customization.extras.reduce((s, e) => s + e.price, 0);
  return item.price + sizeExtra + extrasTotal;
}

export function makeCartId(itemId: string, customization: Customization): string {
  return `${itemId}__${customization.temperature ?? "na"}__${customization.size}__${customization.extras.map(e => e.id).sort().join("_")}`;
}
