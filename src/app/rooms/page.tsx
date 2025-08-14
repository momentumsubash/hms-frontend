"use client";
import { getRooms } from "@/lib/api";
import { useEffect, useState } from "react";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getRooms()
      .then(setRooms)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Rooms</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Room #</th>
            <th className="border px-2 py-1">Type</th>
            <th className="border px-2 py-1">Occupied</th>
            <th className="border px-2 py-1">Price</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room: any) => (
            <tr key={room._id}>
              <td className="border px-2 py-1">{room.roomNumber}</td>
              <td className="border px-2 py-1">{room.type}</td>
              <td className="border px-2 py-1">{room.isOccupied ? "Yes" : "No"}</td>
              <td className="border px-2 py-1">{room.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
