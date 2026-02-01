import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { SafeImage } from '@/components/ui/safe-image';
import { isValidImageUrl, normalizeImageUrl } from '@/lib/imageLoader';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  images: string[];
  title?: string;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  images,
  title = "Select Image"
}) => {
  // Filter to only valid URLs and normalize them
  const validImages = images
    .filter(img => img && typeof img === 'string' && img.trim() !== '')
    .map(img => normalizeImageUrl(img))
    .filter((img): img is string => img !== null)
    .filter(img => isValidImageUrl(img));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {validImages.map((image, index) => (
              <div 
                key={index} 
                className="relative aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  onSelect(image);
                  onClose();
                }}
              >
                <SafeImage
                  src={image}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};