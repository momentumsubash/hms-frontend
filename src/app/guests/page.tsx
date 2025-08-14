"use client";
import { getGuests } from "@/lib/api";
import { useEffect, useState } from "react";

export default function GuestsPage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getGuests()
      .then(setGuests)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Guests</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Email</th>
            <th className="border px-2 py-1">Phone</th>
            <th className="border px-2 py-1">Room</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((guest: any) => (
            <tr key={guest._id}>
              <td className="border px-2 py-1">{guest.firstName} {guest.lastName}</td>
              <td className="border px-2 py-1">{guest.email}</td>
              <td className="border px-2 py-1">{guest.phone}</td>
              <td className="border px-2 py-1">{guest.roomNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
