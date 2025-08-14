"use client";
import { getOrders } from "@/lib/api";
import { useEffect, useState } from "react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Order #</th>
            <th className="border px-2 py-1">Guest</th>
            <th className="border px-2 py-1">Items</th>
            <th className="border px-2 py-1">Total</th>
            <th className="border px-2 py-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order: any) => (
            <tr key={order._id}>
              <td className="border px-2 py-1">{order.orderNumber}</td>
              <td className="border px-2 py-1">{order.guestName}</td>
              <td className="border px-2 py-1">{order.items?.map((i: any) => i.name).join(", ")}</td>
              <td className="border px-2 py-1">{order.total}</td>
              <td className="border px-2 py-1">{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
