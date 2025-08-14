"use client";
import React, { useEffect, useState } from "react";
import { getHotels } from "@/lib/api";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await getHotels();
        setHotels(res?.data || []);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading hotels...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Hotels</h1>
      <ul>
        {hotels.map((hotel, i) => (
          <li key={hotel._id || i}>{JSON.stringify(hotel)}</li>
        ))}
      </ul>
    </div>
  );
}
