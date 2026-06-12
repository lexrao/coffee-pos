import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { MenuItem, Order, CartItem, calcItemPrice } from "@/types";

// ─── Menu ───────────────────────────────────────────────────────────────────

export async function getMenuItems(): Promise<MenuItem[]> {
  const snap = await getDocs(collection(db, "menuItems"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem));
}

export async function seedMenuIfEmpty() {
  const snap = await getDocs(collection(db, "menuItems"));
  if (!snap.empty) return;

  const items: Omit<MenuItem, "id">[] = [
    { name: "Espresso", price: 85, category: "coffee", emoji: "☕", available: true, description: "Pure, bold single shot", allowHotIce: true },
    { name: "Americano", price: 95, category: "coffee", emoji: "☕", available: true, description: "Espresso diluted with hot water", allowHotIce: true },
    { name: "Cappuccino", price: 120, category: "coffee", emoji: "☕", available: true, description: "Equal parts espresso, steam, foam", allowHotIce: true },
    { name: "Latte", price: 130, category: "coffee", emoji: "☕", available: true, description: "Espresso with steamed milk", allowHotIce: true },
    { name: "Flat White", price: 135, category: "coffee", emoji: "☕", available: true, description: "Ristretto with velvety microfoam", allowHotIce: true },
    { name: "Mocha", price: 145, category: "coffee", emoji: "☕", available: true, description: "Espresso, chocolate, steamed milk", allowHotIce: true },
    { name: "Cold Brew", price: 150, category: "coffee", emoji: "🧊", available: true, description: "12-hour steeped cold brew", allowHotIce: false },
    { name: "Frappuccino", price: 160, category: "coffee", emoji: "🥤", available: true, description: "Blended iced coffee drink", allowHotIce: false },
    { name: "Matcha Latte", price: 140, category: "tea", emoji: "🍵", available: true, description: "Ceremonial grade matcha", allowHotIce: true },
    { name: "Chamomile", price: 95, category: "tea", emoji: "🌼", available: true, description: "Calming floral blend", allowHotIce: true },
    { name: "Earl Grey", price: 90, category: "tea", emoji: "🫖", available: true, description: "Classic bergamot black tea", allowHotIce: true },
    { name: "Taro Latte", price: 145, category: "tea", emoji: "🫛", available: true, description: "Creamy purple taro drink", allowHotIce: true },
    { name: "Butter Croissant", price: 75, category: "pastry", emoji: "🥐", available: true, description: "Flaky, golden layered pastry", allowHotIce: false },
    { name: "Cinnamon Roll", price: 95, category: "pastry", emoji: "🌀", available: true, description: "Soft dough with spiced swirl", allowHotIce: false },
    { name: "Blueberry Muffin", price: 80, category: "pastry", emoji: "🫐", available: true, description: "Bursting with fresh blueberries", allowHotIce: false },
    { name: "Banana Bread", price: 85, category: "pastry", emoji: "🍌", available: true, description: "Moist slice with walnuts", allowHotIce: false },
  ];

  for (const item of items) {
    await addDoc(collection(db, "menuItems"), item);
  }
}

export async function addMenuItem(item: Omit<MenuItem, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "menuItems"), item);
  return ref.id;
}

export async function updateMenuItem(id: string, updates: Partial<Omit<MenuItem, "id">>): Promise<void> {
  await updateDoc(doc(db, "menuItems", id), updates);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db, "menuItems", id));
}

// ─── Orders ──────────────────────────────────────────────────────────────────

async function getNextOrderNumber(): Promise<number> {
  const counterRef = doc(db, "counters", "orders");
  const snap = await getDoc(counterRef);
  const next = snap.exists() ? (snap.data().value as number) + 1 : 1;
  await setDoc(counterRef, { value: next });
  return next;
}

export async function createOrder(
  items: CartItem[],
  paymentMethod: Order["paymentMethod"],
  customerName?: string
): Promise<string> {
  const total = items.reduce((sum, i) => sum + calcItemPrice(i.menuItem, i.customization) * i.quantity, 0);
  const orderNumber = await getNextOrderNumber();
  const ref = await addDoc(collection(db, "orders"), {
    items,
    total,
    paymentMethod,
    status: "pending",
    createdAt: Timestamp.now(),
    orderNumber,
    customerName: customerName || "",
  });
  return ref.id;
}

export async function updateOrderStatus(orderId: string, status: Order["status"]) {
  await updateDoc(doc(db, "orders", orderId), { status });
}

export function subscribeToOrders(callback: (orders: Order[]) => void) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate() ?? new Date(),
      } as Order;
    });
    callback(orders);
  });
}
