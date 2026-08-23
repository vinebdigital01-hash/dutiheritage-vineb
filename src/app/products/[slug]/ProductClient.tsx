"use client";
import React, { useState, useEffect, useRef } from "react";
import { Product } from "@/types";
import { FaTwitter, FaPinterestP } from "react-icons/fa";
import { FiShare2, FiLink, FiCopy } from "react-icons/fi";
import { MdLocalOffer } from "react-icons/md";
import { ProductGallery } from "@/components/ProductGallery/ProductGallery";
import { CollectionSection } from "@/components/CollectionSection/CollectionSection";
import Link from "next/link";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";

export const ProductClient = ({ product, suggestedProducts = [] }: { product: Product; suggestedProducts?: Product[] }) => {
  // Global State
  const { addToCart, addRecentlyViewed, recentlyViewed, user } = useAppContext();
  const router = useRouter();

  // Local State for Review Modal & Toast
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hasMockPurchased, setHasMockPurchased] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const mainActionsRef = useRef<HTMLDivElement>(null);
  const [isMainActionsVisible, setIsMainActionsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsMainActionsVisible(entry.isIntersecting);
      },
      { threshold: 0 } // trigger as soon as any part is visible
    );

    if (mainActionsRef.current) {
      observer.observe(mainActionsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [currentUrl, setCurrentUrl] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentUrl(window.location.href);
  }, []);

  // Rotating Offers Logic
  const hasOffers = product.offers && product.offers.length > 0;
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);

  useEffect(() => {
    if (!hasOffers || product.offers!.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentOfferIndex((prev) => (prev + 1) % product.offers!.length);
    }, 4000); // Rotate every 4 seconds
    
    return () => clearInterval(interval);
  }, [hasOffers, product.offers]);

  // Track Recently Viewed
  useEffect(() => {
    if (product) {
      addRecentlyViewed(product);
    }
  }, [product, addRecentlyViewed]);

  // Fallback defaults
  const images = product.images || [product.image, product.image, product.image]; 
  const sizes = product.sizes?.length ? product.sizes : ["Free Size"];

  const [selectedSize, setSelectedSize] = useState(sizes[0]);

  const handleAddToCart = () => {
    addToCart(product, selectedSize);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize);
    setHasMockPurchased(true); // Mocking purchase for testing the review logic
    router.push("/checkout");
  };

  const handleWriteReviewClick = () => {
    if (!user) {
      showToast("Please login to write a review.");
      return;
    }
    if (!hasMockPurchased) {
      // In production, this checks if MongoDB order status === 'Delivered'
      showToast("Only customers who have received this product can review it.");
      return;
    }
    setIsReviewModalOpen(true);
  };

  return (
    <main className="w-full min-h-screen pb-[90px] lg:pb-0">
      <div className="max-w-[1440px] mx-auto px-4 py-8 md:py-12">
        
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          
          {/* Left Column: Image Gallery & Video */}
          <div className="w-full lg:w-1/2 flex flex-col gap-8">
            <ProductGallery images={images} productName={product.name} badge={product.badge} />
            
            {/* Small Reels Thumbnails */}
            {product.videoUrls && product.videoUrls.length > 0 && (
              <div className="w-full">
                <h3 className="text-[13px] font-bold text-gray-500 tracking-[2px] uppercase mb-4">See it in motion</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {product.videoUrls.map((url, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setActiveVideoUrl(url)}
                      className="relative w-[120px] h-[213px] shrink-0 rounded-xl overflow-hidden cursor-pointer group shadow-md border-2 border-transparent hover:border-gray-900 transition-all duration-300"
                    >
                      <video 
                        src={url} 
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 text-white text-[10px] font-bold tracking-wider uppercase bg-black/50 px-2 py-1 rounded">
                        Reel {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Product Info */}
          <div className="w-full lg:w-1/2 flex flex-col pt-4 lg:pt-0 max-w-[600px]">

            <h1 className="text-2xl md:text-[28px] font-normal tracking-[2px] uppercase mb-3 font-serif leading-tight">
              {product.name}
            </h1>
            
            <p className="text-[15px] text-gray-600 mb-6 leading-relaxed">
              Give your Festive look a dreamy update with this beautiful set. Team these with heels or flats and shoulder bag for a look we&apos;re loving. Made with high-quality materials for maximum comfort.
            </p>

            {/* Premium Info Card */}
            <div className="border border-gray-200 rounded-[24px] p-5 md:p-7 bg-white flex flex-col gap-5 relative shadow-sm">
              
              <div className="text-[11px] font-bold text-gray-500 tracking-[2px] uppercase">
                Highlights
              </div>

              {/* Badges Row */}
              <div className="flex gap-3 items-center flex-wrap">
                {product.tags ? (
                  product.tags.map(tag => (
                    <div key={tag} className="bg-[#DFF7E5] text-[#0E7A2E] px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 border border-[#c4eecf]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      {tag}
                    </div>
                  ))
                ) : product.badge ? (
                  <div className="bg-[#DFF7E5] text-[#0E7A2E] px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 border border-[#c4eecf]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    {product.badge}
                  </div>
                ) : null}
              </div>

              {/* FOMO Social Proof */}
              {product.boughtLast7Days && product.boughtLast7Days > 0 && (
                <div className="bg-[#F6F4EB] text-[#333] px-4 py-3 rounded-xl text-[13.5px] font-semibold flex items-center gap-2.5 border border-[#EBE7D9]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B6554]"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  {product.boughtLast7Days}+ customers bought this in the last 7 days
                </div>
              )}

              {/* Special Offer Box (Moved Inside Card) */}
              {hasOffers && (
                <div className="bg-[#FDF9F1] border border-[#E8DFCE] rounded-lg p-5">
                  <div className="text-[#9B7126] font-bold text-[12px] tracking-wider mb-4 flex items-center gap-1">
                    SPECIAL OFFERS <span className="text-[14px]">🎉</span>
                  </div>
                  
                  <div className="relative h-[75px] md:h-[80px] w-full">
                    {product.offers!.map((offer, idx) => (
                      <div 
                        key={idx}
                        className={`absolute inset-0 bg-white rounded-md p-2.5 md:p-4 shadow-sm flex items-center justify-between transition-all duration-500 ease-in-out ${
                          idx === currentOfferIndex 
                            ? 'opacity-100 translate-x-0' 
                            : 'opacity-0 translate-x-8 pointer-events-none'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 md:gap-4 pr-2">
                          <MdLocalOffer className="text-[#D4C3A3] text-[20px] md:text-[24px] -rotate-90 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-black font-bold text-[12.5px] md:text-[15px] leading-tight">{offer.title}</span>
                            <span className="text-gray-500 text-[11px] md:text-[13px] leading-tight mt-0.5 line-clamp-1 md:line-clamp-none">{offer.description}</span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => {
                            if (offer.code) {
                              navigator.clipboard.writeText(offer.code);
                              showToast(`Coupon ${offer.code} copied!`);
                            }
                          }}
                          className="bg-[#F5A623] hover:bg-[#E09612] text-black font-bold text-[9.5px] md:text-[11px] px-2.5 md:px-3 py-1.5 md:py-2 rounded flex items-center gap-1.5 md:gap-2 transition-colors flex-shrink-0 whitespace-nowrap uppercase"
                        >
                          {offer.code ? (
                            <>
                              {offer.code}
                              <FiCopy className="text-[12px] md:text-[14px]" />
                            </>
                          ) : (
                            <>
                              <span className="sm:hidden">NO CODE</span>
                              <span className="hidden sm:inline">NO CODE REQUIRED</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Carousel Progress Indicators */}
                  {product.offers!.length > 1 && (
                    <>
                      <style>{`
                        @keyframes fillProgress {
                          0% { width: 0%; }
                          100% { width: 100%; }
                        }
                      `}</style>
                      <div className="flex gap-2 mt-4">
                        {product.offers!.map((_, idx) => (
                          <div 
                            key={idx} 
                            className="relative h-[2px] flex-1 rounded-full bg-[#E8DFCE] overflow-hidden"
                          >
                            {idx === currentOfferIndex && (
                              <div 
                                className="absolute top-0 left-0 h-full bg-[#D4C3A3]"
                                style={{ animation: 'fillProgress 4s linear forwards' }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Reviews Mock */}
              <div className="flex items-center gap-2 text-[14px]">
                <div className="flex text-[#CDDC39]">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>☆</span>
                </div>
                <span className="text-gray-600 font-medium ml-1">732 reviews</span>
              </div>

              {/* Price Block */}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[32px] md:text-[36px] font-bold text-gray-900 tracking-tight">
                  ₹{product.price}
                </span>
                {product.salePrice && (
                  <>
                    <span className="text-[16px] text-gray-400 line-through font-medium mt-2">
                      ₹{product.salePrice}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-[11px] font-bold uppercase mt-2">
                      Save Rs. {product.salePrice - product.price}
                    </span>
                  </>
                )}
              </div>
              <span className="text-[12px] text-gray-500 -mt-3">
                Tax included. <Link href="/shipping" className="underline underline-offset-2">Shipping</Link> calculated at checkout.
              </span>

              {/* Size Selector */}
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-[12px] font-bold text-gray-500 tracking-[2px] uppercase">Size</span>
                <div className="grid grid-cols-3 gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`
                        py-3 px-2 rounded-xl text-[14px] font-semibold flex flex-col items-center justify-center transition-all
                        ${selectedSize === size 
                          ? 'bg-[#EAF5EC] border-2 border-[#2E7D32] text-[#2E7D32]' 
                          : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'}
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div ref={mainActionsRef} className="flex flex-col gap-3 mt-4">
                <button 
                  onClick={handleAddToCart}
                  className="w-full py-4 rounded-xl border-2 border-gray-900 text-gray-900 text-[14px] font-bold tracking-wide uppercase hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Add to cart
                </button>
                <button 
                  onClick={handleBuyNow}
                  className="w-full py-4 rounded-xl bg-gray-900 text-white text-[14px] font-bold tracking-wide uppercase hover:bg-black transition-colors cursor-pointer"
                >
                  Buy it now
                </button>
              </div>

            </div>



            {/* Social Share */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] text-[var(--color-text-muted)] mt-2">
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: product.name,
                      text: `Check out ${product.name} on Duti Heritage`,
                      url: window.location.href,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    showToast("Link copied to clipboard!");
                  }
                }}
                className="flex items-center gap-2 hover:text-[var(--color-text)] transition-colors"
              >
                <FiShare2 className="text-[15px]" />
                Share
              </button>
              
              <a 
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=Check out ${product.name} on Duti Heritage`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#1DA1F2] transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=Check out ${product.name} on Duti Heritage`, '_blank');
                }}
              >
                <FaTwitter className="text-[15px]" />
                Tweet
              </a>
              
              <a 
                href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(currentUrl)}&media=${encodeURIComponent(currentUrl ? window.location.origin + product.image : "")}&description=${product.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#E60023] transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(window.location.origin + product.image)}&description=${product.name}`, '_blank');
                }}
              >
                <FaPinterestP className="text-[15px]" />
                Pin it
              </a>

              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast("Link copied to clipboard!");
                }}
                className="flex items-center gap-2 hover:text-[var(--color-text)] transition-colors"
              >
                <FiLink className="text-[15px]" />
                Copy Link
              </button>
            </div>

          </div>
        </div>
        
        {/* Reviews Section */}
        <div className="mt-24 border-t border-[var(--color-border)] pt-12 text-center">
          <div className="flex justify-between items-center max-w-[800px] mx-auto mb-8">
            <div className="flex gap-1 text-[24px]">☆☆☆☆☆</div>
            <div className="flex items-center gap-2">
              <button onClick={handleWriteReviewClick} className="border border-[var(--color-border)] px-4 py-2 text-[13px] hover:border-[var(--color-text)]">Write a review</button>
              <button className="border border-[var(--color-border)] p-2 hover:border-[var(--color-text)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
              </button>
            </div>
          </div>
          <p className="text-[13px]">Be the first to <button onClick={handleWriteReviewClick} className="underline underline-offset-4">write a review</button></p>
        </div>

      </div>

      {/* You May Also Like */}
      {suggestedProducts.length > 0 && (
        <div className="mt-16">
          <CollectionSection 
            collection={{ id: "similar", name: "You May Also Like", slug: "all" }} 
            products={suggestedProducts} 
            gridClass="grid-5"
          />
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="mt-8 bg-[var(--color-surface)] py-16">
           <div className="max-w-[1440px] mx-auto px-4 text-center">
             <h2 className="text-[14px] tracking-[2px] uppercase mb-12">Recently Viewed</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-16 justify-center">
                {recentlyViewed.filter(p => p.id !== product.id).slice(0, 6).map(p => (
                  <Link href={`/products/${p.slug}`} key={p.id} className="flex flex-col text-center hover:opacity-80 transition-opacity">
                    <Image src={p.image} alt={p.name} width={200} height={266} className="w-full aspect-[3/4] object-cover mb-4" />
                    <span className="text-[12px] tracking-[1px] uppercase">{p.name}</span>
                  </Link>
                ))}
             </div>
             
             <Link href="/collections/new-arrivals" className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-8 py-4 text-[12px] tracking-[2px] uppercase hover:bg-opacity-90">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
               Back to New Arrivals
             </Link>
           </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg)] max-w-[500px] w-full p-8 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-black"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <h2 className="text-[18px] font-serif uppercase tracking-[2px] mb-6 text-center">Write a Review</h2>
            
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-[11px] uppercase tracking-[1px] text-[var(--color-text-muted)] mb-2 block">Rating</label>
                <div className="flex gap-2 text-[28px] cursor-pointer">
                  <span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span>
                </div>
              </div>
              
              <div>
                <label className="text-[11px] uppercase tracking-[1px] text-[var(--color-text-muted)] mb-2 block">Your Review</label>
                <textarea 
                  className="w-full border border-[var(--color-border)] p-3 text-[14px] outline-none min-h-[120px] resize-none"
                  placeholder="What did you like or dislike about this product?"
                ></textarea>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-[1px] text-[var(--color-text-muted)] mb-2 block">Add a Photo</label>
                <div className="border-2 border-dashed border-[var(--color-border)] p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="text-[24px] mb-2 block">📸</span>
                  <span className="text-[12px] text-[var(--color-text-muted)]">Click to upload an image (Cloudinary ready)</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  showToast("Review submitted! (Will save to database in Phase 3)");
                  setIsReviewModalOpen(false);
                }}
                className="w-full mt-2 bg-[var(--color-text)] text-white py-4 text-[12px] uppercase tracking-[2px] hover:opacity-90 transition-opacity"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-[100px] lg:bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-4 text-[12px] tracking-[2px] uppercase z-[150] shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          {toastMessage}
        </div>
      )}

      {/* Video Modal (Reels style) */}
      {activeVideoUrl && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <button 
            onClick={() => setActiveVideoUrl(null)}
            className="absolute top-6 right-6 z-[210] w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-md"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          
          <div className="relative w-full max-w-[450px] h-[100dvh] md:h-[85vh] md:rounded-2xl overflow-hidden shadow-2xl bg-black">
            <video 
              src={activeVideoUrl} 
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay 
              controls
              playsInline
            />
          </div>
        </div>
      )}

      {/* Sticky Mobile Actions Bar */}
      <div 
        className={`fixed bottom-0 left-0 w-full bg-white border-t border-[var(--color-border)] p-3 px-4 z-[90] flex gap-3 lg:hidden shadow-[0_-5px_15px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out ${
          isMainActionsVisible ? 'opacity-0 translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        <button 
          onClick={handleAddToCart}
          className="flex-1 py-3.5 border border-[var(--color-text)] text-[12px] font-medium tracking-[1.5px] uppercase active:bg-[var(--color-surface)] transition-colors"
        >
          Add to cart
        </button>
        <button 
          onClick={handleBuyNow}
          className="flex-1 py-3.5 bg-[var(--color-accent)] text-white text-[12px] font-medium tracking-[1.5px] uppercase active:bg-opacity-90 transition-opacity"
        >
          Buy it now
        </button>
      </div>

    </main>
  );
};
