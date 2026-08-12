"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { FcGoogle } from "react-icons/fc";
import { FiPhone } from "react-icons/fi";

export default function AccountPage() {
  const { user, login, logout } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    // In a real app, you would validate with a backend here.
    // For now, we just log them in to test the flow.
    login(email);
  };

  // ----------------------------------------------------
  // LOGGED IN VIEW
  // ----------------------------------------------------
  if (user) {
    return (
      <main className="w-full min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-bg)]">
        <div className="max-w-[600px] w-full text-center">
          <h1 className="text-3xl font-serif tracking-[3px] uppercase mb-4">My Account</h1>
          <p className="text-[14px] text-[var(--color-text-muted)] mb-12">
            Welcome back, {user.name}!
          </p>

          <div className="bg-gray-50 border border-[var(--color-border)] p-8 text-left mb-8">
            <h2 className="text-[13px] tracking-[2px] uppercase mb-4">Account Details</h2>
            <p className="text-[14px] mb-1"><span className="text-[var(--color-text-muted)]">Name:</span> {user.name}</p>
            <p className="text-[14px] mb-4"><span className="text-[var(--color-text-muted)]">Email:</span> {user.email}</p>
            
            <h2 className="text-[13px] tracking-[2px] uppercase mb-4 mt-8 border-t border-[var(--color-border)] pt-8">Order History</h2>
            <p className="text-[14px] text-[var(--color-text-muted)]">You haven&apos;t placed any orders yet.</p>
          </div>

          <button 
            onClick={logout}
            className="text-[13px] tracking-[2px] uppercase border border-[var(--color-text)] px-8 py-3 hover:bg-[var(--color-text)] hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------
  // LOGGED OUT VIEW (LOGIN FORM)
  // ----------------------------------------------------
  return (
    <main className="w-full min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-bg)]">
      <div className="max-w-[400px] w-full">
        <h1 className="text-3xl font-serif tracking-[3px] uppercase mb-8 text-center">Login</h1>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-transparent"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-transparent"
          />
          
          <div className="text-left mb-2 mt-1">
            <Link href="#" className="text-[12px] text-[var(--color-text-muted)] underline underline-offset-4 hover:text-black">
              Forgot your password?
            </Link>
          </div>

          <button 
            type="submit"
            className="w-full bg-[var(--color-text)] text-white text-[13px] tracking-[2px] uppercase py-4 hover:opacity-90 transition-opacity mt-2"
          >
            Sign in
          </button>

          <div className="relative flex items-center justify-center mt-6 mb-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]"></div>
            </div>
            <div className="relative bg-[var(--color-bg)] px-4 text-[12px] text-[var(--color-text-muted)] uppercase tracking-[1px]">
              Or continue with
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-3 border border-[var(--color-border)] py-3 hover:bg-[var(--color-surface)] transition-colors"
            >
              <FcGoogle className="text-xl" />
              <span className="text-[13px]">Google</span>
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-3 border border-[var(--color-border)] py-3 hover:bg-[var(--color-surface)] transition-colors"
            >
              <FiPhone className="text-xl" />
              <span className="text-[13px]">Phone</span>
            </button>
          </div>

          <div className="text-center mt-6">
            <Link href="/account/register" className="text-[13px] text-[var(--color-text)] underline underline-offset-4 hover:opacity-70">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
