import { SkeletonPage } from '@/components/ui/Skeleton';
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { FiMail, FiPhone, FiArrowLeft, FiBox, FiMapPin, FiHeart, FiTag, FiUser, FiClock } from "react-icons/fi";
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
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
import { checkEmailExists } from "@/lib/auth-client";
import { AccountOrders } from "@/components/AccountOrders";

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

const getCleanErrorMessage = (err: any) => {
  if (!err) return "An error occurred. Please try again.";
  if (err.code === "auth/weak-password") return "Password should be at least 6 characters.";
  if (err.code === "auth/email-already-in-use") return "An account already exists with this email address.";
  if (err.code === "auth/invalid-email") return "Please enter a valid email address.";
  if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") return "Invalid email or password. Please try again.";
  if (err.code === "auth/too-many-requests") return "Too many failed attempts. Please try again later.";
  if (err.code === "auth/popup-closed-by-user") return "Login window was closed before completion.";
  if (err.code === "auth/invalid-verification-code") return "Invalid OTP code. Please try again.";
  if (err.code === "auth/invalid-phone-number") return "Please enter a valid phone number.";
  
  let msg = err.message || "An unexpected error occurred.";
  msg = msg.replace(/^Firebase:\s*/i, "");
  msg = msg.replace(/\s*\(auth\/[a-zA-Z0-9-]+\)\.?$/, "");
  return msg;
};

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
            setError(getCleanErrorMessage(err));
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

  const handleSendOTP = async (e: React.FormEvent, method: 'sms' | 'whatsapp' = 'sms') => {
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
      setError(getCleanErrorMessage(err));
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
        setError(getCleanErrorMessage(err));
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
      const { exists, skipped } = await checkEmailExists(cleanEmail);
      if (!skipped && !exists) {
        setError("No account found with this email. Please register first.");
        return;
      }
      await sendPasswordResetEmail(auth, cleanEmail);
      setMessage(`A password reset link was sent to ${cleanEmail}. Check your inbox!`);
    } catch (err: any) {
      // Firebase throws auth/user-not-found only if Enumeration Protection is OFF.
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email. Please register first.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(getCleanErrorMessage(err));
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
      const { exists, skipped } = await checkEmailExists(cleanEmail);
      if (!skipped && !exists) {
        setError("No account found with this email. Please register first.");
        return;
      }
      const actionCodeSettings = {
        url: window.location.origin + '/account',
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, cleanEmail, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', cleanEmail);
      setMessage(`A magic login link was sent to ${cleanEmail}. Check your inbox!`);
    } catch (err: any) {
      setError(getCleanErrorMessage(err));
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
        <SkeletonPage />
      </main>
    );
  }

  
  if (user) {
    return (
      <div className="w-full h-full p-4 md:p-8 lg:p-12">
        <div className="md:hidden flex items-center justify-between mb-8 pb-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xl font-serif border border-gray-200">
              {user.name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-[16px] font-bold uppercase tracking-wider">{user.name}</h1>
              <p className="text-[12px] text-[var(--color-text-muted)]">{user.email}</p>
            </div>
          </div>
        </div>

        <h1 className="hidden md:block text-3xl font-serif tracking-[2px] uppercase mb-2">Overview</h1>
        <p className="hidden md:block text-[14px] text-[var(--color-text-muted)] mb-10">Welcome to your Duti Heritage account dashboard.</p>
        
        {/* Quick Action Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {[
            { name: "My Orders", icon: <FiBox className="text-2xl mb-3 text-blue-600" />, href: "/account/orders", desc: "Track & manage" },
            { name: "Wishlist", icon: <FiHeart className="text-2xl mb-3 text-rose-500" />, href: "/account/wishlist", desc: "Saved items" },
            { name: "Addresses", icon: <FiMapPin className="text-2xl mb-3 text-amber-600" />, href: "/account/addresses", desc: "Delivery info" },
            { name: "Coupons", icon: <FiTag className="text-2xl mb-3 text-green-600" />, href: "/account/coupons", desc: "Special offers" },
            { name: "Recently Viewed", icon: <FiClock className="text-2xl mb-3 text-purple-600" />, href: "/account/recently-viewed", desc: "Your history" },
            { name: "Profile Settings", icon: <FiUser className="text-2xl mb-3 text-gray-700" />, href: "/account/profile", desc: "Edit details" }
          ].map((action, i) => (
            <Link key={i} href={action.href} className="bg-white border border-[var(--color-border)] p-5 md:p-6 rounded-xl hover:shadow-md transition-shadow hover:border-black flex flex-col items-center text-center group">
              <div className="transform group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <h3 className="text-[13px] font-bold tracking-[1px] uppercase mb-1">{action.name}</h3>
              <p className="text-[11px] text-[var(--color-text-muted)]">{action.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent Orders Preview */}
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="text-[14px] font-bold tracking-[2px] uppercase">Recent Orders</h2>
            <Link href="/account/orders" className="text-[12px] text-blue-600 font-medium hover:underline">View All &rarr;</Link>
          </div>
          <div className="p-6 bg-gray-50/50">
            <AccountOrders limit={2} />
          </div>
        </div>

        <button 
          onClick={logout}
          className="md:hidden mt-8 w-full border border-red-200 text-red-600 bg-red-50 py-4 text-[13px] font-bold tracking-[2px] uppercase rounded-lg"
        >
          Log Out
        </button>
      </div>
    );
  }


  // ----------------------------------------------------
  // RENDER LOGGED OUT VIEW (LOGIN FORM)
  // ----------------------------------------------------
  return (
    <main className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-start pt-16 md:pt-12 px-4 pb-8 bg-[var(--color-bg)]">
      <div className="max-w-[400px] w-full">
        <div id="recaptcha-container"></div>
        
        <div className="flex justify-center mb-2">
          <img src="/logo.svg" alt="Duti Heritage" className="h-28 md:h-32 w-auto object-contain" />
        </div>
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
            <div className="flex gap-2 sm:gap-4 mb-4">
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

            <div className="relative flex items-center justify-center mb-6 mt-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]"></div>
              </div>
              <div className="relative bg-[var(--color-bg)] px-4 text-[12px] text-[var(--color-text-muted)] uppercase tracking-[1px]">
                Or continue with email
              </div>
            </div>

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
                {loading ? "Processing..." : "Sign In"}
              </button>

              <div className="text-center mt-2">
                <Link href="/account/register" className="text-[12px] text-[var(--color-text-muted)] hover:text-black transition-colors">
                  Don&apos;t have an account? <span className="underline underline-offset-4">Create one</span>
                </Link>
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
              <form className="flex flex-col gap-4">
                <p className="text-[13px] text-[var(--color-text-muted)] text-center mb-2">
                  Enter your phone number to receive a verification code.
                </p>
                <div className="w-full border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none focus-within:border-black transition-colors bg-transparent">
                  <PhoneInput
                    international
                    defaultCountry="IN"
                    value={phoneNumber}
                    onChange={(val) => setPhoneNumber(val || "")}
                    className="w-full bg-transparent outline-none"
                    style={{
                      '--PhoneInputCountryFlag-height': '16px',
                      '--PhoneInputCountrySelectArrow-color': 'currentColor',
                    } as React.CSSProperties}
                  />
                </div>
                
                {phoneNumber && isValidPhoneNumber(phoneNumber) ? (
                  <div className="flex gap-3 mt-2">
                    <button 
                      type="button"
                      onClick={(e) => handleSendOTP(e, 'sms')}
                      disabled={loading}
                      className="flex-1 bg-[var(--color-text)] text-white text-[12px] tracking-[1px] uppercase py-4 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {loading ? "..." : "OTP via SMS"}
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        alert("WhatsApp OTP requires backend integration (e.g. Twilio). Sending via SMS for now.");
                        handleSendOTP(e, 'whatsapp');
                      }}
                      disabled={loading}
                      className="flex-1 bg-[#25D366] text-white text-[12px] tracking-[1px] uppercase py-4 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {loading ? "..." : "OTP via WhatsApp"}
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    disabled={true}
                    className="w-full bg-gray-200 text-gray-400 text-[12px] tracking-[1px] uppercase py-4 mt-2 cursor-not-allowed"
                  >
                    Enter 10 digits to continue
                  </button>
                )}
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

