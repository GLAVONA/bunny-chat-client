import React, { useState, useCallback, useRef } from "react";
import { Modal, Image } from "@mantine/core";

interface ImageViewerProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // Calculate click position relative to container
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate click position as percentage
      const xPercent = x / rect.width;
      const yPercent = y / rect.height;

      // Toggle between zoomed and normal state
      if (scale === 1) {
        setScale(2);
        // Calculate new position to center on click point
        setPosition({
          x: (0.5 - xPercent) * 100, // Inverted x-axis calculation
          y: (0.5 - yPercent) * 100, // Inverted y-axis calculation
        });
      } else {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    },
    [scale]
  );

  return (
    <Modal
      opened={true}
      onClose={onClose}
      size="xl"
      centered
      withCloseButton
      title="Image Preview"
    >
      <div
        ref={containerRef}
        style={{
          overflow: "hidden",
          maxHeight: "80vh",
          cursor: "zoom-in",
          position: "relative",
        }}
        onClick={handleClick}
      >
        <Image
          src={imageUrl}
          alt="Full size image"
          fit="contain"
          style={{
            maxHeight: "80vh",
            transform: `scale(${scale}) translate(${position.x}%, ${position.y}%)`,
            transition: "transform 0.2s ease",
            transformOrigin: "center",
          }}
        />
      </div>
    </Modal>
  );
};

export default ImageViewer;
