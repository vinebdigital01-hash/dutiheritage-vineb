with open("src/app/products/[slug]/ProductClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace main actions
old_main_actions = """              {/* Actions */}
              <div ref={mainActionsRef} className="flex flex-col gap-3 mt-4">
                <button 
                  onClick={handleAddToCart}
                  className="w-full py-4 rounded-xl border-2 border-gray-900 text-gray-900 text-[14px] font-bold tracking-wide uppercase hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Add to cart
                </button>
                <button 
                  onClick={handleBuyNow}
                  disabled={isNavigating}
                  className={`w-full py-4 rounded-xl text-[14px] font-bold tracking-wide uppercase transition-colors cursor-pointer flex justify-center items-center gap-2 ${isNavigating ? 'bg-gray-800 text-gray-300' : 'bg-gray-900 text-white hover:bg-black'}`}
                >
                  {isNavigating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : "Buy it now"}
                </button>
              </div>"""

new_main_actions = """              {/* Actions */}
              <div ref={mainActionsRef} className="flex flex-col gap-3 mt-4">
                {isTotallySoldOut ? (
                  <button 
                    disabled
                    className="w-full py-4 rounded-xl bg-gray-200 text-gray-500 text-[14px] font-bold tracking-wide uppercase cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleAddToCart}
                      className="w-full py-4 rounded-xl border-2 border-gray-900 text-gray-900 text-[14px] font-bold tracking-wide uppercase hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Add to cart
                    </button>
                    <button 
                      onClick={handleBuyNow}
                      disabled={isNavigating}
                      className={`w-full py-4 rounded-xl text-[14px] font-bold tracking-wide uppercase transition-colors cursor-pointer flex justify-center items-center gap-2 ${isNavigating ? 'bg-gray-800 text-gray-300' : 'bg-gray-900 text-white hover:bg-black'}`}
                    >
                      {isNavigating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </>
                      ) : "Buy it now"}
                    </button>
                  </>
                )}
              </div>"""
content = content.replace(old_main_actions, new_main_actions)

with open("src/app/products/[slug]/ProductClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated ProductClient buttons")
