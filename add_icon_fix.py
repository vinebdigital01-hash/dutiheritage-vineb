import os
import re

path = 'src/app/account/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Let's just do a simple replacement for the exact block!
block = """<div className="w-full border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none 
focus-within:border-black transition-colors bg-transparent">
                    <div className="flex items-center"><FaWhatsapp className="text-[#25D366] text-xl mr-3 shrink-0" /><PhoneInput
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
                  </div>"""

new_block = """<div className="w-full flex items-center border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none focus-within:border-black transition-colors bg-transparent">
                    <FaWhatsapp className="text-[#25D366] text-xl mr-3 shrink-0" />
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
                  </div>"""

code = code.replace(block, new_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Icon added fixed.")
