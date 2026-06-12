"use client";
import { useEffect, useState } from "react";
import { subscribeToOrders } from "@/lib/firestore";
import { Order } from "@/types";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { orders, loading };
}
