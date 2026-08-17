"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { FcGoogle } from "react-icons/fc";
import { FiMail } from "react-icons/fi"; // Changed from Phone to Mail for Magic Link
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink 
} from "firebase/auth";

export default function AccountPage() {
  const { user, authLoading, logout } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ----------------------------------------------------
  // HANDLE MAGIC LINK (PASSWORDLESS) COMPLETION
  // ----------------------------------------------------
  useEffect(() => {
    // If the user clicked a magic link in their email, they land here.
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      if (!emailForSignIn) {
        // User opened the link on a different device. Prompt for email.
        emailForSignIn = window.prompt('Please provide your email for confirmation');
      }
      if (emailForSignIn) {
        setLoading(true);
        signInWithEmailLink(auth, emailForSignIn, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            setMessage("Successfully logged in with Magic Link!");
            // Remove the URL params to clean up the URL
            window.history.replaceState(null, "", "/account");
          })
          .catch((err) => {
            setError(err.message);
          })
          .finally(() => setLoading(false));
      }
    }
  }, []);

  // ----------------------------------------------------
  // AUTHENTICATION HANDLERS
  // ----------------------------------------------------
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      // If user not found, automatically sign them up
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          setMessage("Account created successfully!");
        } catch (signupErr: any) {
          setError(signupErr.message);
        }
      } else {
        setError(err.message);
      }
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkLogin = async () => {
    if (!email) {
      setError("Please enter your email above to receive a magic link.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const actionCodeSettings = {
        // URL you want to redirect back to. The domain must be in Firebase Authorized Domains.
        url: window.location.origin + '/account',
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage(`A magic login link was sent to ${email}. Check your inbox!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // RENDER LOGGED IN VIEW
  // ----------------------------------------------------
  if (authLoading) {
    return (
      <main className="w-full min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-bg)]">
        <p className="text-[14px] text-[var(--color-text-muted)] animate-pulse">Loading...</p>
      </main>
    );
  }

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
  // RENDER LOGGED OUT VIEW (LOGIN FORM)
  // ----------------------------------------------------
  return (
    <main className="w-full min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-bg)]">
      <div className="max-w-[400px] w-full">
        <h1 className="text-3xl font-serif tracking-[3px] uppercase mb-8 text-center">Login</h1>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-[13px] border border-red-100">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 text-green-700 text-[13px] border border-green-100">{message}</div>}

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-transparent"
          />
          
          <div className="text-left mb-2 mt-1 flex justify-between">
            <Link href="#" className="text-[12px] text-[var(--color-text-muted)] underline underline-offset-4 hover:text-black">
              Forgot your password?
            </Link>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-text)] text-white text-[13px] tracking-[2px] uppercase py-4 hover:opacity-90 transition-opacity mt-2 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Sign In / Register"}
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
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-3 border border-[var(--color-border)] py-3 hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
            >
              <FcGoogle className="text-xl" />
              <span className="text-[13px]">Google</span>
            </button>
            <button
              type="button"
              onClick={handleMagicLinkLogin}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-3 border border-[var(--color-border)] py-3 hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
            >
              <FiMail className="text-xl" />
              <span className="text-[13px]">Magic Link</span>
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}
