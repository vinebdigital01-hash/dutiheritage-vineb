import os
import re

path = 'src/app/account/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_setup = """const setupRecaptcha = () => {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }
    };"""

new_setup = """const setupRecaptcha = () => {
      // FIX FOR NEXT.JS SPA ROUTING:
      // Clear any existing verifier to prevent it from attaching to a dead/unmounted DOM node.
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
      
      // Ensure the container exists in the DOM right now
      if (!document.getElementById('recaptcha-container')) {
        console.error("recaptcha-container not found in DOM!");
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    };"""

code = code.replace(old_setup, new_setup)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Firebase recaptcha bug fixed.")
