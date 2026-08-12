"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { FcGoogle } from "react-icons/fc";
import { FiPhone } from "react-icons/fi";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAppContext();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName) return;
    
    // In a real app, you would create the user in the database here.
    // For now, we just log them in to test the flow.
    login(email);
    router.push("/account");
  };

  return (
    <main className="w-full min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-bg)]">
      <div className="max-w-[400px] w-full">
        <h1 className="text-3xl font-serif tracking-[3px] uppercase mb-8 text-center">Create account</h1>
        
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="First name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-transparent"
          />
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-transparent"
          />
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

          <button 
            type="submit"
            className="w-full bg-[var(--color-text)] text-white text-[13px] tracking-[2px] uppercase py-4 hover:opacity-90 transition-opacity mt-4"
          >
            Create
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
            <Link href="/account" className="text-[13px] text-[var(--color-text)] underline underline-offset-4 hover:opacity-70">
              Return to login
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
