import re

path = 'src/app/checkout/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove country-state-city import
content = re.sub(r'import \{ State, City \} from "country-state-city";\n', '', content)

# 2. Add Firebase imports
import_fb = 'import { auth } from "@/lib/firebase";\nimport { RecaptchaVerifier, signInWithPhoneNumber, linkWithPhoneNumber, ConfirmationResult } from "firebase/auth";\n'
content = content.replace('import type { PublicCouponDTO } from "@/lib/coupons";\n', 'import type { PublicCouponDTO } from "@/lib/coupons";\n' + import_fb)

# 3. New state variables and logic (combining location API + Firebase OTP)
new_logic = r"""  const [formData, setFormData] = useState({
    email: "", country: "India", firstName: "", lastName: "", address: "", apartment: "", city: "", state: "", pinCode: "", phone: ""
  });

  const [indianStates, setIndianStates] = useState<{name: string; isoCode: string}[]>([]);
  const [indianCities, setIndianCities] = useState<{name: string}[]>([]);

  useEffect(() => {
    fetch("/api/checkout/locations?type=states")
      .then(r => r.json())
      .then(data => setIndianStates(data.states || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!formData.state) { setIndianCities([]); return; }
    const st = indianStates.find(s => s.name === formData.state);
    if (!st) return;
    fetch(`/api/checkout/locations?type=cities&stateCode=${st.isoCode}`)
      .then(r => r.json())
      .then(data => setIndianCities(data.cities || []))
      .catch(() => {});
  }, [formData.state, indianStates]);

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [confResult, setConfResult] = useState<ConfirmationResult | null>(null);

  // Auto-verify if logged in user's saved phone matches
  useEffect(() => {
    const currentPhone = formData.phone.trim().replace(/^\+91/, "").replace(/\s/g, "");
    const savedPhone1 = user?.phone?.replace(/^\+91/, "").replace(/\s/g, "");
    const savedPhone2 = userProfile?.phone?.replace(/^\+91/, "").replace(/\s/g, "");
    
    if (currentPhone && currentPhone.length >= 10 && (currentPhone === savedPhone1 || currentPhone === savedPhone2)) {
      setPhoneVerified(true);
      setOtpSent(false);
      setOtpError("");
    } else {
      setPhoneVerified(false);
      setOtpSent(false);
      setOtpInput("");
    }
  }, [formData.phone, user, userProfile]);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
  };

  const handleSendOtp = async () => {
    const phoneNum = formData.phone.trim().replace(/^\+91/, "").replace(/\s/g, "");
    if (!/^[6-9]\d{9}$/.test(phoneNum)) { setOtpError("Enter valid 10-digit phone number"); return; }
    
    setSendingOtp(true); 
    setOtpError("");
    
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const formattedPhone = `+91${phoneNum}`;
      
      let confirmationResult;
      if (auth.currentUser && !auth.currentUser.isAnonymous) {
        confirmationResult = await linkWithPhoneNumber(auth.currentUser, formattedPhone, appVerifier);
      } else {
        confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      }
      
      setConfResult(confirmationResult);
      setOtpSent(true);
    } catch (err: any) {
      console.error("Firebase OTP Error:", err);
      setOtpError(err.message || "Failed to send OTP. Try again.");
    }
    setSendingOtp(false);
  };

  const handleVerifyOtp = async () => {
    if (!confResult || !otpInput) return;
    setOtpError("");
    try {
      await confResult.confirm(otpInput);
      setPhoneVerified(true);
      setOtpSent(false);
    } catch (err: any) {
      console.error("OTP Verify Error:", err);
      setOtpError("Invalid OTP. Please check and try again.");
    }
  };"""
content = re.sub(r'  const \[formData, setFormData\] = useState\(\{.*?\n  \}\);\n', lambda m: new_logic + '\n', content, flags=re.DOTALL)

# 4. Remove old state declarations
old_states_regex = r'  const indianStates = State\.getStatesOfCountry\("IN"\);\s*\n\s*const selectedState = indianStates\.find\(s => s\.name === formData\.state\);\s*\n\s*const indianCities = selectedState \? City\.getCitiesOfState\("IN", selectedState\.isoCode\) : \[\];\s*\n'
content = re.sub(old_states_regex, lambda m: '  // Location states are fetched via API\n', content)

# 5. Add phone verification check to payment submit
submit_logic = r"""  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((paymentMethod === "cod" || paymentMethod === "partial") && !phoneVerified) {
      setCheckoutError("Please verify your phone number with OTP before placing COD order.");
      setIsProcessing(false);
      return;
    }

    if (isProcessing) return;"""
content = re.sub(r'  const handlePaymentSubmit = async \(e: React\.FormEvent\) => \{\n    e\.preventDefault\(\);\n    if \(isProcessing\) return;', lambda m: submit_logic, content)

# 6. Add OTP UI
otp_ui = r"""              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Mobile number (For delivery updates)" aria-label="Mobile number (For delivery updates)" className="w-full border border-gray-300 p-3.5 text-[15px] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-white shadow-sm" required />

              {/* OTP Verification for COD */}
              <div id="recaptcha-container"></div>
              {(paymentMethod === "cod" || paymentMethod === "partial") && !phoneVerified && (
                <div className="mt-2 space-y-2">
                  {!otpSent ? (
                    <button type="button" onClick={handleSendOtp} disabled={sendingOtp || !formData.phone}
                      className="text-sm px-4 py-2 bg-[var(--color-text)] text-[var(--color-bg)] rounded disabled:opacity-50">
                      {sendingOtp ? "Sending..." : "Verify Phone (Send OTP)"}
                    </button>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <input type="text" value={otpInput} onChange={e => setOtpInput(e.target.value)}
                        placeholder="Enter 6-digit OTP" maxLength={6}
                        className="flex-1 px-3 py-2 border border-[var(--color-border)] bg-transparent text-sm rounded" />
                      <button type="button" onClick={handleVerifyOtp}
                        className="text-sm px-4 py-2 bg-[var(--color-text)] text-[var(--color-bg)] rounded">Verify</button>
                    </div>
                  )}
                  {otpError && <p className="text-red-500 text-xs">{otpError}</p>}
                </div>
              )}
              {phoneVerified && (paymentMethod === "cod" || paymentMethod === "partial") && (
                <p className="text-green-600 text-xs mt-1">✓ Phone verified</p>
              )}"""

content = re.sub(r'              <input type="tel" name="phone" value=\{formData\.phone\}[^\>]+required />', lambda m: otp_ui, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
