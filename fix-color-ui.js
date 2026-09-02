const fs = require('fs');
const file = 'src/app/products/[slug]/ProductClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const colorsUI = `
                {/* Color Selector */}
                {colors.length > 0 && (
                  <div className="flex flex-col gap-2 mt-4">
                    <span className="text-[12px] font-bold text-gray-500 tracking-[2px] uppercase">Color</span>
                    <div className="flex flex-wrap gap-3">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={\`
                            py-3 px-4 rounded-xl text-[14px] font-semibold transition-all
                            \${selectedColor === color 
                              ? 'bg-[#EAF5EC] border-2 border-[#2E7D32] text-[#2E7D32]' 
                              : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'}
                          \`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}`;

// Match the entire size map block up to the closing two divs
const sizeRegex = /\{sizes\.map\([\s\S]*?<\/div>\s*<\/div>/;

if (!content.includes('Color Selector')) {
  content = content.replace(sizeRegex, (match) => match + '\n' + colorsUI);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully injected Color UI!');
} else {
  console.log('Color UI already exists.');
}
