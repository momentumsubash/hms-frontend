"use client";
import { useEffect, useState } from "react";
import { getItems } from "@/lib/api";

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getItems()
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Items</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Category</th>
            <th className="border px-2 py-1">Price</th>
            <th className="border px-2 py-1">Stock</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => (
            <tr key={item._id}>
              <td className="border px-2 py-1">{item.name}</td>
              <td className="border px-2 py-1">{item.category}</td>
              <td className="border px-2 py-1">{item.price}</td>
              <td className="border px-2 py-1">{item.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
