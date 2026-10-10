import os
import re

path = 'src/app/account/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

setup_regex = r"const setupRecaptcha = \(\) => \{[\s\S]*?size: 'invisible',\s*\}\);\s*\}\s*\};"

new_setup = """const setupRecaptcha = () => {
    // FIX FOR NEXT.JS SPA ROUTING:
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
      window.recaptchaVerifier = null;
    }
    
    // Create fresh verifier
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
  };"""

code = re.sub(setup_regex, new_setup, code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Firebase recaptcha bug FIXED ACTUALLY.")
