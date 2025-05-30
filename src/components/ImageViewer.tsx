import React, { useState, useRef } from "react";

interface ImageViewerProps {
  imageUrl: string;
  onClose: () => void;
}

function ImageViewer({ imageUrl, onClose }: ImageViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState("center");
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setTransformOrigin(`${x}% ${y}%`);
    }

    setIsZoomed(!isZoomed);
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl"
      >
        ✕
      </button>
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Full size"
        style={{ transformOrigin }}
        className={`transition-transform duration-200 ${
          isZoomed ? "scale-150" : "scale-100"
        } max-h-[90vh] max-w-[90vw] object-contain cursor-zoom-in`}
        onClick={handleImageClick}
      />
    </div>
  );
}

export default ImageViewer;
