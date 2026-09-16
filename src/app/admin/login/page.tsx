"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAppContext } from "@/context/AppContext";
import { defaultAdminPath } from "@/lib/rbac";

function cleanAuthError(err: unknown) {
  const code = typeof err === "object" && err && "code" in err ? String((err as { code?: string }).code) : "";
  if (code === "auth/invalid-email") return "Enter a valid email.";
  if (code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "Invalid email or password.";
  }
  if (code === "auth/too-many-requests") return "Too many attempts. Try again later.";
  return "Could not sign in. Try again.";
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
  const timedOut = searchParams.get("timeout") === "1";
  const { user, isAdmin, adminRole, authLoading, logout } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(timedOut ? "Session expired. Sign in again." : null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user && isAdmin) {
      const dest =
        next.startsWith("/admin") && next !== "/admin/login"
          ? next
          : defaultAdminPath(adminRole);
      router.replace(dest);
    }
  }, [authLoading, user, isAdmin, adminRole, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const token = await cred.user.getIdToken();
      const check = await fetch("/api/admin/check", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await check.json().catch(() => ({}))) as { isAdmin?: boolean };
      if (!check.ok || !data.isAdmin) {
        await signOut(auth);
        setError("This account is not staff. Use the store login for customer orders.");
        return;
      }
    } catch (err) {
      setError(cleanAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Password reset email sent.");
    } catch (err) {
      setError(cleanAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return <p className="text-[13px] tracking-[2px] uppercase text-neutral-400">Checking session…</p>;
  }

  if (user && !isAdmin) {
    return (
      <div className="text-center space-y-4">
        <p className="text-[14px] text-neutral-600">
          Signed in as <span className="font-medium text-black">{user.email}</span>, which is not a
          staff account.
        </p>
        <button
          type="button"
          onClick={() => logout("/admin/login")}
          className="bg-black text-white px-6 py-3 text-[12px] tracking-[2px] uppercase"
        >
          Sign out and try another
        </button>
        <p>
          <Link href="/account" className="text-[12px] uppercase tracking-wider underline">
            Customer account
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-[13px] text-red-700 bg-red-50 border border-red-100 px-3 py-2">{error}</p>}
      {message && <p className="text-[13px] text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-2">{message}</p>}
      <label className="block text-[11px] uppercase tracking-wider text-neutral-500">
        Email
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border px-3 py-2.5 text-[14px] text-black outline-none focus:border-black"
        />
      </label>
      <label className="block text-[11px] uppercase tracking-wider text-neutral-500">
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border px-3 py-2.5 text-[14px] text-black outline-none focus:border-black"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full bg-black text-white py-3 text-[12px] tracking-[2px] uppercase disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in to admin"}
      </button>
      <button
        type="button"
        onClick={reset}
        disabled={busy}
        className="w-full text-[12px] uppercase tracking-wider text-neutral-500 hover:text-black"
      >
        Forgot password
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-neutral-200 p-8 shadow-sm">
        <p className="text-[10px] tracking-[3px] uppercase text-neutral-400 mb-1">Duti Heritage</p>
        <h1 className="font-serif text-2xl tracking-[2px] uppercase mb-1">Staff login</h1>
        <p className="text-[13px] text-neutral-500 mb-8">
          Staff only. Shoppers use Account — not this page.
        </p>
        <Suspense fallback={<p className="text-[13px] text-neutral-400">Loading…</p>}>
          <AdminLoginForm />
        </Suspense>
        <p className="mt-8 text-center">
          <Link href="/" className="text-[11px] uppercase tracking-wider text-neutral-400 hover:text-black">
            Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}
