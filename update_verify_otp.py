path = "src/app/account/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_handleVerifyOTP = """  const handleVerifyOTP = async (e: React.FormEvent) => {
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
  };"""

new_handleVerifyOTP = """  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    
    setLoading(true);
    setError(null);

    try {
      if (otpMethod === 'whatsapp') {
        const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
        const res = await fetch("/api/auth/whatsapp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: formattedNumber, otp })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid OTP");
        
        await signInWithCustomToken(auth, data.token);
      } else {
        await window.confirmationResult.confirm(otp);
      }
      // Success! AppContext will handle the redirect.
    } catch (err: any) {
      setError(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };"""

if old_handleVerifyOTP in content:
    content = content.replace(old_handleVerifyOTP, new_handleVerifyOTP)
else:
    print("Still could not find old_handleVerifyOTP")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
