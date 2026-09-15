with open("src/app/products/[slug]/ProductClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace sticky actions in video modal
old_video_actions = """              <button 
                onClick={() => { setActiveVideoUrl(null); handleAddToCart(); }}
                className={`flex-1 py-3.5 md:py-4 rounded-xl border text-[12px] font-bold tracking-[1.5px] uppercase transition-colors ${isAdded ? 'border-[#2E7D32] bg-[#EAF5EC] text-[#2E7D32]' : 'border-[var(--color-text)] bg-white text-[var(--color-text)] hover:bg-gray-50'}`}
              >
                {isAdded ? "Added to Cart" : "Add to Cart"}
              </button>
              <button 
                onClick={() => { setActiveVideoUrl(null); handleBuyNow(); }}
                disabled={isNavigating}
                className="flex-1 py-3.5 md:py-4 rounded-xl bg-[var(--color-text)] text-[var(--color-surface)] font-bold text-[12px] tracking-[1.5px] uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isNavigating ? "Wait..." : "Buy Now"}
              </button>"""

new_video_actions = """              <button 
                disabled={isTotallySoldOut}
                onClick={() => { setActiveVideoUrl(null); handleAddToCart(); }}
                className={`flex-1 py-3.5 md:py-4 rounded-xl border text-[12px] font-bold tracking-[1.5px] uppercase transition-colors ${isTotallySoldOut ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : isAdded ? 'border-[#2E7D32] bg-[#EAF5EC] text-[#2E7D32]' : 'border-[var(--color-text)] bg-white text-[var(--color-text)] hover:bg-gray-50'}`}
              >
                {isTotallySoldOut ? "Sold Out" : isAdded ? "Added to Cart" : "Add to Cart"}
              </button>
              <button 
                disabled={isTotallySoldOut || isNavigating}
                onClick={() => { setActiveVideoUrl(null); handleBuyNow(); }}
                className={`flex-1 py-3.5 md:py-4 rounded-xl font-bold text-[12px] tracking-[1.5px] uppercase transition-opacity flex items-center justify-center gap-2 ${isTotallySoldOut ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[var(--color-text)] text-[var(--color-surface)] hover:opacity-90 disabled:opacity-50'}`}
              >
                {isTotallySoldOut ? "Sold Out" : isNavigating ? "Wait..." : "Buy Now"}
              </button>"""
content = content.replace(old_video_actions, new_video_actions)

# Mobile sticky actions
old_mobile_sticky = """        <div className="w-full max-w-[450px] mx-auto flex gap-3 px-4 py-3 bg-white/80 backdrop-blur-md border-t border-gray-100">
          <button 
            onClick={handleAddToCart}
            className={`flex-1 py-3.5 rounded-xl border text-[12px] font-bold tracking-[1.5px] uppercase transition-colors ${isAdded ? 'border-[#2E7D32] bg-[#EAF5EC] text-[#2E7D32]' : 'border-[var(--color-text)] bg-white text-[var(--color-text)] hover:bg-gray-50'}`}
          >
            {isAdded ? "Added to Cart" : "Add to Cart"}
          </button>
          <button 
            onClick={handleBuyNow}
            disabled={isNavigating}
            className="flex-1 py-3.5 rounded-xl bg-[var(--color-text)] text-[var(--color-surface)] font-bold text-[12px] tracking-[1.5px] uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isNavigating ? "Wait..." : "Buy Now"}
          </button>
        </div>"""

new_mobile_sticky = """        <div className="w-full max-w-[450px] mx-auto flex gap-3 px-4 py-3 bg-white/80 backdrop-blur-md border-t border-gray-100">
          <button 
            disabled={isTotallySoldOut}
            onClick={handleAddToCart}
            className={`flex-1 py-3.5 rounded-xl border text-[12px] font-bold tracking-[1.5px] uppercase transition-colors ${isTotallySoldOut ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : isAdded ? 'border-[#2E7D32] bg-[#EAF5EC] text-[#2E7D32]' : 'border-[var(--color-text)] bg-white text-[var(--color-text)] hover:bg-gray-50'}`}
          >
            {isTotallySoldOut ? "Sold Out" : isAdded ? "Added to Cart" : "Add to Cart"}
          </button>
          <button 
            disabled={isTotallySoldOut || isNavigating}
            onClick={handleBuyNow}
            className={`flex-1 py-3.5 rounded-xl font-bold text-[12px] tracking-[1.5px] uppercase transition-opacity flex items-center justify-center gap-2 ${isTotallySoldOut ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[var(--color-text)] text-[var(--color-surface)] hover:opacity-90 disabled:opacity-50'}`}
          >
            {isTotallySoldOut ? "Sold Out" : isNavigating ? "Wait..." : "Buy Now"}
          </button>
        </div>"""
content = content.replace(old_mobile_sticky, new_mobile_sticky)

with open("src/app/products/[slug]/ProductClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated sticky actions")
