fetch('https://www.dutiheritage.co.in/products/mauve-meher-pure-cotton?nocache=' + Date.now())
  .then(res => res.text())
  .then(html => {
    console.log('Contains:', html.includes('tracking-[2px] uppercase\">Color<'));
  });
