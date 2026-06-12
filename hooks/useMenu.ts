"use client";
import { useEffect, useState, useCallback } from "react";
import { getMenuItems, seedMenuIfEmpty } from "@/lib/firestore";
import { MenuItem } from "@/types";

export function useMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      await seedMenuIfEmpty();
      const data = await getMenuItems();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { items, loading, refresh: load };
}
