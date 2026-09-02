const fs = require('fs');
const file = 'src/app/api/bot/analytics/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'direction: { $in: ["outbound", "admin"] }',
  'direction: { $in: ["outgoing", "admin"] }'
);

content = content.replace(
  'direction: "inbound"',
  'direction: "incoming"'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed typescript error in bot analytics');
