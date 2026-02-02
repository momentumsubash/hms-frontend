import React from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isValidImageUrl, normalizeImageUrl } from '@/lib/imageLoader';
import { SafeImage } from '@/components/ui/safe-image';
import styles from '@/styles/websiteContent.module.css';

interface ImageSelectorProps {
  currentImage?: string;
  onSelectImage: () => void;
  aspectRatio?: 'square' | 'wide';
  label?: string;
}

export const ImageSelector: React.FC<ImageSelectorProps> = ({
  currentImage,
  onSelectImage,
  aspectRatio = 'wide',
  label = 'Select Image'
}) => {
  return (
    <div
      className={styles['image-selector']}
      style={{ aspectRatio: aspectRatio === 'square' ? '1' : '16/9' }}
      onClick={onSelectImage}
    >
      {currentImage && isValidImageUrl(normalizeImageUrl(currentImage) || currentImage) ? (
        <>
          <SafeImage
            src={currentImage}
            alt="Selected image"
            fill
            className="object-cover"
          />
          <div className={styles['image-selector-overlay']}>
            <Button variant="secondary" size="sm">
              Change Image
            </Button>
          </div>
        </>
      ) : (
        <div className={styles['image-selector-overlay']}>
          <div className="text-center">
            <ImageIcon className="w-8 h-8 mb-2 mx-auto" />
            <span>{label}</span>
          </div>
        </div>
      )}
    </div>
  );
};