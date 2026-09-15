path = "src/app/account/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add signInWithCustomToken
content = content.replace(
    '  sendSignInLinkToEmail\n} from "firebase/auth";',
    '  sendSignInLinkToEmail,\n  signInWithCustomToken\n} from "firebase/auth";'
)

# Add otpMethod state
content = content.replace(
    'const [otp, setOtp] = useState("");',
    'const [otp, setOtp] = useState("");\n  const [otpMethod, setOtpMethod] = useState<"sms" | "whatsapp">("sms");'
)

# Update handleSendOTP
old_handleSendOTP = """  const handleSendOTP = async (e: React.FormEvent, method: 'sms' | 'whatsapp' = 'sms') => {
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
  };"""

new_handleSendOTP = """  const handleSendOTP = async (e: React.FormEvent, method: 'sms' | 'whatsapp' = 'sms') => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    setError(null);
    setMessage(null);
    setOtpMethod(method);

    try {
      const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;

      if (method === 'whatsapp') {
        const res = await fetch("/api/auth/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: formattedNumber })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send WhatsApp OTP");
        
        setShowOTP(true);
        setMessage(`WhatsApp OTP sent to ${formattedNumber}`);
      } else {
        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
        window.confirmationResult = confirmationResult;
        setShowOTP(true);
        setMessage(`SMS OTP sent to ${formattedNumber}`);
      }
    } catch (err: any) {
      setError(getCleanErrorMessage(err));
      if (method === 'sms' && window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };"""

if old_handleSendOTP in content:
    content = content.replace(old_handleSendOTP, new_handleSendOTP)
else:
    print("Could not find old handleSendOTP")

# Update handleVerifyOTP
old_handleVerifyOTP = """  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    
    setLoading(true);

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
    print("Could not find old handleVerifyOTP")

# Update WhatsApp button
old_button = """onClick={(e) => {
                          alert("WhatsApp OTP requires backend integration (e.g. Twilio). Sending via SMS for now.");
                          handleSendOTP(e, 'whatsapp');
                        }}"""
new_button = """onClick={(e) => {
                          handleSendOTP(e, 'whatsapp');
                        }}"""

content = content.replace(old_button, new_button)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
