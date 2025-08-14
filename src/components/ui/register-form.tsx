"use client";
import { useState } from "react";
import { register } from "@/lib/api";

export default function RegisterForm() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "staff",
    hotel: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await register(form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
      <div>
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border rounded px-2 py-1"
          required
        />
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className="w-full border rounded px-2 py-1"
          required
        />
      </div>
      <div>
        <label>First Name</label>
        <input
          type="text"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          className="w-full border rounded px-2 py-1"
          required
        />
      </div>
      <div>
        <label>Last Name</label>
        <input
          type="text"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          className="w-full border rounded px-2 py-1"
          required
        />
      </div>
      <div>
        <label>Role</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full border rounded px-2 py-1"
        >
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>
      <div>
        <label>Hotel</label>
        <input
          type="text"
          name="hotel"
          value={form.hotel}
          onChange={handleChange}
          className="w-full border rounded px-2 py-1"
        />
      </div>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-500">Registration successful!</div>}
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>
        {loading ? "Registering..." : "Register"}
      </button>
    </form>
  );
}
