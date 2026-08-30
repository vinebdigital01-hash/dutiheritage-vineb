const fs = require('fs');

let code = fs.readFileSync('src/components/Footer/Footer.tsx', 'utf8');

// Update submit button
const oldButton = `<button
                type="submit"
                aria-label="Subscribe"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M2 4l10 8 10-8"></path>
                </svg>
              </button>`;

const newButton = `<button
                type="submit"
                aria-label="Subscribe"
                disabled={isSubmitting}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="text-xs">Wait...</span>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="M2 4l10 8 10-8"></path>
                  </svg>
                )}
              </button>`;

code = code.replace(oldButton, newButton);
fs.writeFileSync('src/components/Footer/Footer.tsx', code);
console.log("Fixed button UI feedback");
