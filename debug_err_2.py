import os

path = 'src/app/account/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_err = 'let msg = (err.code ? `[${err.code}] ` : "") + (err.message || String(err) || "An unexpected error occurred.");'
new_err = 'if (err.code === "auth/invalid-app-credential") return "reCAPTCHA failed. Please refresh the page, check the \'I am not a robot\' box, and try again.";\n  let msg = (err.code ? `[${err.code}] ` : "") + (err.message || String(err) || "An unexpected error occurred.");'

code = code.replace(old_err, new_err)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Error message improved.")
