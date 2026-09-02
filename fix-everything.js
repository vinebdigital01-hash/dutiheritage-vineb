const fs = require('fs');

// --- APP CONTEXT ---
const appFile = 'src/context/AppContext.tsx';
let appContent = fs.readFileSync(appFile, 'utf8');

appContent = appContent.replace(
  'selectedSize: string;\\n  selectedColor?: string;',
  'selectedSize: string;\n  selectedColor?: string;'
);

fs.writeFileSync(appFile, appContent, 'utf8');
console.log('Fixed AppContext.tsx');

// --- PRODUCT CLIENT ---
const prodFile = 'src/app/products/[slug]/ProductClient.tsx';
let prodContent = fs.readFileSync(prodFile, 'utf8');

// 1. Fix the Ulta Price Logic using Regex to bypass whitespace issues
const priceRegex = /\{\/\* Price Block \*\/\}[\s\S]*?<\/div>/;
const newPriceBlock = `{/* Price Block */}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[32px] md:text-[36px] font-bold text-gray-900 tracking-tight">
                    ₹{product.salePrice || product.price}
                  </span>
                  {(product.salePrice && product.salePrice < product.price) ? (
                    <>
                      <span className="text-[18px] md:text-[20px] text-gray-400 line-through mt-2 font-medium">
                        ₹{product.price}
                      </span>
                      <span className="bg-[#EAF5EC] text-[#2E7D32] px-2 py-1 rounded-md text-[11px] font-bold uppercase mt-2">
                        Save Rs. {product.price - product.salePrice}
                      </span>
                    </>
                  ) : null}
                </div>`;

prodContent = prodContent.replace(priceRegex, newPriceBlock);

// 2. Add Colors State
prodContent = prodContent.replace(
  'const [selectedSize, setSelectedSize] = useState(sizes[0]);',
  'const [selectedSize, setSelectedSize] = useState(sizes[0]);\n  const colors = product.colors || [];\n  const [selectedColor, setSelectedColor] = useState(colors.length > 0 ? colors[0] : undefined);'
);

// 3. Update addToCart calls
prodContent = prodContent.replace(
  /addToCart\(product, selectedSize\)/g,
  'addToCart(product, selectedSize, selectedColor)'
);

// 4. Update isAdded logic
prodContent = prodContent.replace(
  /item\.selectedSize === selectedSize/g,
  'item.selectedSize === selectedSize && item.selectedColor === selectedColor'
);

// 5. Add Colors UI below Sizes
const sizeUIEnd = `                      </button>
                    ))}
                  </div>
                </div>`;

const colorsUI = `
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

prodContent = prodContent.replace(sizeUIEnd, sizeUIEnd + '\n' + colorsUI);

fs.writeFileSync(prodFile, prodContent, 'utf8');
console.log('ProductClient updated!');
