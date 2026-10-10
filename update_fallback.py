import os
import re

path = 'src/app/account/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the entire handleSendOTP function!
handle_send_otp_regex = r"const handleSendOTP = async \(e: React\.FormEvent, method: 'sms' \| 'whatsapp' = 'sms'\) => \{[\s\S]*?const handleVerifyOTP = async"

new_handle_send_otp = """const handleSendOTP = async (e: React.FormEvent, requestedMethod: 'sms' | 'whatsapp' = 'whatsapp') => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    setError(null);
    setMessage(null);

    const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
    let finalMethod: 'sms' | 'whatsapp' = requestedMethod;

    try {
      if (requestedMethod === 'whatsapp') {
        try {
          const res = await fetch("/api/auth/whatsapp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: formattedNumber })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to send WhatsApp OTP");
          
          setOtpMethod('whatsapp');
          setShowOTP(true);
          setMessage(`We've sent a code to your WhatsApp (or SMS).`);
          setLoading(false);
          return; // Success! Exit early.
        } catch (whatsappErr: any) {
          console.warn("WhatsApp OTP failed, falling back to SMS", whatsappErr);
          // Auto fallback to SMS
          finalMethod = 'sms';
        }
      }

      // If requested SMS directly, or if WhatsApp failed and fell back to SMS
      if (finalMethod === 'sms') {
        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
        window.confirmationResult = confirmationResult;
        setOtpMethod('sms');
        setShowOTP(true);
        setMessage(`We've sent a code to your WhatsApp (or SMS).`);
      }
    } catch (err: any) {
      setError(getCleanErrorMessage(err));
      if (finalMethod === 'sms' && window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async"""

code = re.sub(handle_send_otp_regex, new_handle_send_otp, code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("handleSendOTP fallback logic rewritten.")
