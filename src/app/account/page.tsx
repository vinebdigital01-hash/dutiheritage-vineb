"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { FiMail, FiPhone, FiArrowLeft } from "react-icons/fi"; 
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider, 
  FacebookAuthProvider,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail
} from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

export default function AccountPage() {
  const { user, authLoading, logout } = useAppContext();
  
  // View States
  const [authMode, setAuthMode] = useState<"email" | "phone">("email");
  const [showOTP, setShowOTP] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      if (!emailForSignIn) {
        emailForSignIn = window.prompt('Please provide your email for confirmation');
      }
      if (emailForSignIn) {
        setLoading(true);
        signInWithEmailLink(auth, emailForSignIn, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
          })
          .catch((err: any) => {
            setError(err.message);
          })
          .finally(() => setLoading(false));
      }
    }
  }, []);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  
  // Status States
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  // ----------------------------------------------------
  // PHONE AUTH HANDLERS
  // ----------------------------------------------------
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      // Format number to ensure it has a country code. Defaulting to India if none provided.
      const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      
      const confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      setShowOTP(true);
      setMessage(`OTP sent to ${formattedNumber}`);
    } catch (err: any) {
      setError(err.message);
      // Reset recaptcha if it fails
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    
    setLoading(true);
    setError(null);

    try {
      await window.confirmationResult.confirm(otp);
      // Success! AppContext will handle the redirect.
    } catch (err: any) {
      setError("Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // EMAIL / GOOGLE AUTH HANDLERS
  // ----------------------------------------------------
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const cleanEmail = email.trim();
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        try {
          await createUserWithEmailAndPassword(auth, cleanEmail, password);
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
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new FacebookAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        const provider = new FacebookAuthProvider();
        await signInWithRedirect(auth, provider);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email above and click 'Forgot your password?' again to receive a reset link.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setMessage(`A password reset link was sent to ${cleanEmail}. Check your inbox!`);
    } catch (err: any) {
      // Firebase throws auth/user-not-found only if Enumeration Protection is OFF.
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email. Please register first.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email address to receive a login link.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/account',
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, cleanEmail, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', cleanEmail);
      setMessage(`A magic login link was sent to ${cleanEmail}. Check your inbox!`);
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
      <main className="w-full min-h-[100vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-bg)]">
        <p className="text-[14px] text-[var(--color-text-muted)] animate-pulse">Loading...</p>
      </main>
    );
  }

  if (user) {
    return (
      <main className="w-full min-h-[100vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-bg)]">
        <div className="max-w-[600px] w-full text-center">
          <h1 className="text-3xl font-serif tracking-[3px] uppercase mb-4">My Account</h1>
          <p className="text-[14px] text-[var(--color-text-muted)] mb-12">
            Welcome back, {user.name}!
          </p>

          <div className="bg-gray-50 border border-[var(--color-border)] p-8 text-left mb-8">
            <h2 className="text-[13px] tracking-[2px] uppercase mb-4">Account Details</h2>
            <p className="text-[14px] mb-1"><span className="text-[var(--color-text-muted)]">Name:</span> {user.name}</p>
            {user.email && <p className="text-[14px] mb-4"><span className="text-[var(--color-text-muted)]">Email:</span> {user.email}</p>}
            
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
    <main className="w-full min-h-[100vh] flex flex-col items-center justify-center px-4 py-8 bg-[var(--color-bg)]">
      <div className="max-w-[400px] w-full">
        <div id="recaptcha-container"></div>
        
        <h1 className="text-3xl font-serif tracking-[3px] uppercase mb-6 text-center">
          {authMode === "email" ? "Login" : "Phone Login"}
        </h1>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-[13px] border border-red-100">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 text-green-700 text-[13px] border border-green-100">{message}</div>}

        {/* ------------------------------------------------ */}
        {/* FORGOT MODE UI */}
        {/* ------------------------------------------------ */}
        {forgotMode && (
          <div className="flex flex-col gap-3 w-full">
            <h2 className="text-xl font-serif text-center mb-4 tracking-[2px] uppercase">Login Help</h2>
            <p className="text-center text-[13px] text-[var(--color-text-muted)] mb-4 leading-relaxed">
              Do you want to receive a direct login link or reset your password?
            </p>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-transparent mb-2"
            />
            <button 
              onClick={handleMagicLink}
              disabled={loading}
              className="w-full bg-[var(--color-text)] text-white text-[13px] tracking-[2px] uppercase py-3 hover:bg-black/90 transition-colors disabled:opacity-50"
            >
              Direct Login via Link
            </button>
            <button 
              onClick={handleForgotPassword}
              disabled={loading}
              className="w-full border border-[var(--color-border)] text-[var(--color-text)] text-[13px] tracking-[2px] uppercase py-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Reset Password
            </button>
            <button 
              onClick={() => { setForgotMode(false); setError(null); setMessage(null); }} 
              className="w-full text-center text-[12px] mt-4 text-[var(--color-text-muted)] underline underline-offset-4 hover:text-black"
            >
              Back to login
            </button>
          </div>
        )}

        {/* ------------------------------------------------ */}
        {/* EMAIL FORM */}
        {/* ------------------------------------------------ */}
        {!forgotMode && authMode === "email" && (
          <>
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
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
              
              <div className="text-left mb-1 flex justify-between">
                <button 
                  type="button" 
                  onClick={() => { setForgotMode(true); setError(null); setMessage(null); }}
                  className="text-[12px] text-[var(--color-text-muted)] underline underline-offset-4 hover:text-black"
                >
                  Forgot your password?
                </button>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--color-text)] text-white text-[13px] tracking-[2px] uppercase py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Processing..." : "Sign In / Register"}
              </button>

              <div className="relative flex items-center justify-center mt-4 mb-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-border)]"></div>
                </div>
                <div className="relative bg-[var(--color-bg)] px-4 text-[12px] text-[var(--color-text-muted)] uppercase tracking-[1px]">
                  Or continue with
                </div>
              </div>

              <div className="flex gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 border border-[var(--color-border)] py-3 hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
                >
                  <FcGoogle className="text-xl" />
                  <span className="text-[12px] sm:text-[13px]">Google</span>
                </button>
                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 border border-[var(--color-border)] py-3 hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
                >
                  <FaFacebook className="text-xl text-[#1877F2]" />
                  <span className="text-[12px] sm:text-[13px]">Facebook</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("phone");
                    setError(null);
                    setMessage(null);
                  }}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 border border-[var(--color-border)] py-3 hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
                >
                  <FiPhone className="text-xl" />
                  <span className="text-[12px] sm:text-[13px]">Phone</span>
                </button>
              </div>
            </form>
          </>
        )}

        {/* ------------------------------------------------ */}
        {/* PHONE FORM */}
        {/* ------------------------------------------------ */}
        {authMode === "phone" && (
          <>
            {!showOTP ? (
              <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
                <p className="text-[13px] text-[var(--color-text-muted)] text-center mb-2">
                  Enter your phone number to receive a verification code.
                </p>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-transparent"
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--color-text)] text-white text-[13px] tracking-[2px] uppercase py-4 hover:opacity-90 transition-opacity mt-2 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                <p className="text-[13px] text-[var(--color-text-muted)] text-center mb-2">
                  Enter the 6-digit code sent to {phoneNumber}
                </p>
                <input
                  type="text"
                  placeholder="123456"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-transparent tracking-[4px] text-center"
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--color-text)] text-white text-[13px] tracking-[2px] uppercase py-4 hover:opacity-90 transition-opacity mt-2 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setAuthMode("email");
                setShowOTP(false);
                setError(null);
                setMessage(null);
              }}
              className="mt-6 w-full flex items-center justify-center gap-2 text-[12px] text-[var(--color-text-muted)] hover:text-black uppercase tracking-[1px] transition-colors"
            >
              <FiArrowLeft /> Back to Email Login
            </button>
          </>
        )}
      </div>
    </main>
  );
}
