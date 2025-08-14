"use client";
import { useEffect, useState } from "react";
import { getCurrentUser, getUserById } from "@/lib/api";

export default function UserPanel() {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [searchedUser, setSearchedUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const handleSearch = async (e: any) => {
    e.preventDefault();
    setError("");
    try {
      const u = await getUserById(userId);
      setSearchedUser(u);
    } catch (err: any) {
      setError(err.message);
      setSearchedUser(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Current User</h2>
      {loading ? "Loading..." : user ? (
        <div className="mb-4">{user.email} ({user.role})</div>
      ) : error ? <div className="text-red-500">{error}</div> : null}
      <form onSubmit={handleSearch} className="space-y-2 mb-4">
        <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="User ID" className="border px-2 py-1" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Search User</button>
      </form>
      {searchedUser && (
        <div className="border p-2">
          <div>Email: {searchedUser.email}</div>
          <div>Name: {searchedUser.firstName} {searchedUser.lastName}</div>
          <div>Role: {searchedUser.role}</div>
        </div>
      )}
    </div>
  );
}
