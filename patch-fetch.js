const fs = require('fs');

function patchFetch(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Replace standard json parsing with text parsing first
  // from: const data = await res.json();
  // to: const text = await res.text(); let data; try { data = JSON.parse(text); } catch { throw new Error("Server returned an invalid response. Check Vercel logs."); }
  
  const target = `const data = await res.json();`;
  const replacement = `const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Server error: " + (text.substring(0, 50) + "..."));
        }`;
        
  if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(filePath, code);
    console.log("Patched " + filePath);
  }
}

patchFetch('src/components/AccountOrders.tsx');
patchFetch('src/app/account/orders/page.tsx');
