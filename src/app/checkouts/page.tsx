"use client";
import { getCheckouts } from "@/lib/api";
import { useEffect, useState } from "react";

export default function CheckoutsPage() {
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCheckouts()
      .then(setCheckouts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Checkouts</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Guest</th>
            <th className="border px-2 py-1">Room</th>
            <th className="border px-2 py-1">Checkout Date</th>
            <th className="border px-2 py-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {checkouts.map((checkout: any) => (
            <tr key={checkout._id}>
              <td className="border px-2 py-1">{checkout.guestName}</td>
              <td className="border px-2 py-1">{checkout.roomNumber}</td>
              <td className="border px-2 py-1">{checkout.checkoutDate ? new Date(checkout.checkoutDate).toLocaleString() : ""}</td>
              <td className="border px-2 py-1">{checkout.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
