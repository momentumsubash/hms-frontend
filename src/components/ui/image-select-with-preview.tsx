import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageIcon, X } from 'lucide-react';

interface ImageSelectWithPreviewProps {
  value: string;
  onValueChange: (value: string) => void;
  availableImages: string[];
  label?: string;
  aspectRatio?: 'square' | 'wide';
}

export const ImageSelectWithPreview: React.FC<ImageSelectWithPreviewProps> = ({
  value,
  onValueChange,
  availableImages,
  label = "Select Image",
  aspectRatio = 'wide'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectImage = (imageUrl: string) => {
    onValueChange(imageUrl);
    setIsOpen(false);
  };

  const clearSelection = () => {
    onValueChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {value ? (
          <>
            <div className="relative w-16 h-16 rounded-md overflow-hidden border">
              <Image
                src={value}
                alt="Selected image"
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <button
                onClick={clearSelection}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
              >
                <X size={12} />
              </button>
            </div>
            <span className="text-sm text-gray-500 truncate max-w-xs">
              {value}
            </span>
          </>
        ) : (
          <div className="text-sm text-gray-500">No image selected</div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <ImageIcon size={16} />
        {label}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Image</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="grid grid-cols-3 gap-4 p-4">
              {availableImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                    value === imageUrl ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                  onClick={() => handleSelectImage(imageUrl)}
                >
                  <div className="relative aspect-video">
                    <Image
                      src={imageUrl}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="p-2 text-xs truncate">
                    {imageUrl}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};