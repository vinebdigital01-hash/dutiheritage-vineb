import os
import re

path = 'src/app/account/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Revert default authMode to 'email'
code = code.replace(
    'const [authMode, setAuthMode] = useState<"email" | "phone">("phone");',
    'const [authMode, setAuthMode] = useState<"email" | "phone">("email");'
)
code = code.replace(
    '{authMode === "email" ? "Login" : "Login / Register"}',
    '{authMode === "email" ? "Login" : "Phone Login"}'
)

# 2. Add FaWhatsapp import
if 'FaWhatsapp' not in code:
    code = code.replace(
        'import { FaFacebook } from "react-icons/fa";',
        'import { FaFacebook, FaWhatsapp } from "react-icons/fa";'
    )

# 3. Update the description text and add WhatsApp icon next to the input
code = code.replace(
    'Enter your phone number to receive a verification code.',
    'Enter your phone/WhatsApp number to receive an OTP.'
)

# Find the PhoneInput container to add the FaWhatsapp icon
old_phone_container = """<div className="w-full border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none 
focus-within:border-black transition-colors bg-transparent">
                    <PhoneInput"""

new_phone_container = """<div className="w-full flex items-center border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none focus-within:border-black transition-colors bg-transparent">
                    <FaWhatsapp className="text-[#25D366] text-xl mr-3" />
                    <PhoneInput"""
code = code.replace(old_phone_container, new_phone_container)

# 4. Restore the two buttons logic!
old_buttons_regex = r'<div className="flex flex-col gap-4 mt-2">[\s\S]*?</div>'
new_buttons = """<div className="flex gap-3 mt-2">
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
                      onClick={(e) => handleSendOTP(e, 'whatsapp')}
                      disabled={loading}
                      className="flex-1 bg-[#25D366] text-white text-[12px] tracking-[1px] uppercase py-4 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {loading ? "..." : "OTP via WhatsApp"}
                    </button>
                  </div>"""

code = re.sub(old_buttons_regex, new_buttons, code, count=1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Done restoring email default and both buttons.")
