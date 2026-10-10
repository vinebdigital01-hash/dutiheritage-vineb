import os
import re

path = 'src/app/account/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

useEffect_code = """
  useEffect(() => {
    if (!authLoading && !user) {
      const timer = setTimeout(() => {
        if (!window.recaptchaVerifier && document.getElementById('recaptcha-container')) {
          try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              size: 'invisible',
            });
            window.recaptchaVerifier.render().catch(() => {});
          } catch(e) {
            console.error('Recaptcha init error:', e);
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    
    // Cleanup on unmount
    return () => {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch(e) {}
        window.recaptchaVerifier = null;
      }
    };
  }, [authLoading, user]);

  const completeEmailLinkSignIn"""

# 1. Insert useEffect
code = code.replace('const completeEmailLinkSignIn', useEffect_code)

# 2. Remove the manual setupRecaptcha call inside handleSendOTP
code = code.replace('setupRecaptcha();\n          const appVerifier = window.recaptchaVerifier;', 'const appVerifier = window.recaptchaVerifier;\n          if (!appVerifier) throw new Error("reCAPTCHA is still initializing. Please wait a second and try again.");')

# 3. Remove the setupRecaptcha function definition completely
setup_regex = r"const setupRecaptcha = \(\) => \{[\s\S]*?size: 'invisible',\s*\}\);\s*\};"
code = re.sub(setup_regex, '', code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Refactored reCAPTCHA to useEffect.")
