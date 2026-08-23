"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { FcGoogle } from "react-icons/fc";
import { FiPhone } from "react-icons/fi";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";

const getCleanErrorMessage = (err: any) => {
  if (!err) return "An error occurred. Please try again.";
  if (err.code === "auth/weak-password") return "Password should be at least 6 characters.";
  if (err.code === "auth/email-already-in-use") return "An account already exists with this email address.";
  if (err.code === "auth/invalid-email") return "Please enter a valid email address.";
  
  let msg = err.message || "An unexpected error occurred.";
  msg = msg.replace(/^Firebase:\s*/i, "");
  msg = msg.replace(/\s*\(auth\/[a-zA-Z0-9-]+\)\.?$/, "");
  return msg;
};

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName) return;
    
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCredential.user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim()
      });
      router.push("/account");
    } catch (err: any) {
      setError(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/account");
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      } else {
        setError(getCleanErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-start pt-16 md:pt-12 px-4 pb-8 bg-[var(--color-bg)]">
      <div className="max-w-[400px] w-full">
        <div className="flex justify-center mb-2">
          <img src="/logo.svg" alt="Duti Heritage" className="h-28 md:h-32 w-auto object-contain" />
        </div>
        <h1 className="text-3xl font-serif tracking-[3px] uppercase mb-6 text-center">Create account</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-[13px] mb-6 text-center">
            {error}
          </div>
        )}

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
            disabled={loading}
            className="w-full bg-[var(--color-text)] text-white text-[13px] tracking-[2px] uppercase py-4 hover:opacity-90 transition-opacity mt-4 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>

          <div className="text-center mt-2">
            <Link href="/account" className="text-[12px] text-[var(--color-text-muted)] hover:text-black transition-colors">
              Already have an account? <span className="underline underline-offset-4">Sign In</span>
            </Link>
          </div>

          <div className="relative flex items-center justify-center mt-6 mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]"></div>
            </div>
            <div className="relative bg-[var(--color-bg)] px-4 text-[12px] text-[var(--color-text-muted)] uppercase tracking-[1px]">
              Or register with
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-3 border border-[var(--color-border)] py-3 hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
            >
              <FcGoogle className="text-xl" />
              <span className="text-[13px]">Google</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/account")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-3 border border-[var(--color-border)] py-3 hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
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
