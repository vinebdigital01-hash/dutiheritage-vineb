"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  badge?: string;
}

export const ProductGallery = ({ images, productName, badge }: ProductGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageContainerRef.current) return;
    
    // Calculate mouse position relative to the image container
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    if (isZoomed) {
      setIsZoomed(false);
    }
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 w-full">
      {/* Thumbnails */}
      <div className="flex md:flex-col gap-4 overflow-x-auto md:w-[100px] shrink-0 no-scrollbar">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => {
              setActiveIndex(idx);
              setIsZoomed(false);
            }}
            className={`relative w-20 h-28 md:w-full md:h-[133px] shrink-0 transition-all border-2 ${
              activeIndex === idx ? "border-black" : "border-transparent"
            }`}
          >
            <Image
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              fill
              className="object-cover"
              sizes="100px"
            />
          </button>
        ))}
      </div>

      {/* Main Image (In-place Zoom) */}
      <div
        ref={imageContainerRef}
        className={`relative w-full aspect-[3/4] bg-gray-50 overflow-hidden ${
          isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
        }`}
        onClick={() => setIsZoomed(!isZoomed)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={images[activeIndex]}
          alt={productName}
          fill
          className="object-cover transition-transform duration-200 ease-out"
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          style={{
            transform: isZoomed ? "scale(2.5)" : "scale(1)",
            transformOrigin: `${mousePos.x}% ${mousePos.y}%`
          }}
        />
        
        {badge && (
          <div className="absolute top-4 left-4 z-10 bg-[var(--color-accent)] text-white text-[12px] font-medium py-1.5 px-3 tracking-[1px] uppercase pointer-events-none">
            {badge}
          </div>
        )}
      </div>
    </div>
  );
};
