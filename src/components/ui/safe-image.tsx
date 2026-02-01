import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { isValidImageUrl, getSafeImageUrl, normalizeImageUrl } from '@/lib/imageLoader';

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
  onLoadError?: () => void;
}

/**
 * Safe Image Wrapper Component
 * Validates and normalizes image URLs before rendering
 * Prevents "Invalid URL" errors from reaching the Next.js Image component
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackSrc,
  onLoadError,
  alt,
  onError,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  // Normalize and validate the URL
  if (!src || (typeof src === 'string' && src.trim() === '')) {
    return null;
  }

  try {
    // Normalize the image URL (adds / prefix if needed)
    const normalizedUrl = normalizeImageUrl(src);
    
    if (!normalizedUrl || !isValidImageUrl(normalizedUrl)) {
      // Try fallback
      if (fallbackSrc) {
        const normalizedFallback = normalizeImageUrl(fallbackSrc);
        if (normalizedFallback && isValidImageUrl(normalizedFallback)) {
          return (
            <Image
              {...props}
              src={normalizedFallback}
              alt={alt || 'Image'}
              onError={(e) => {
                setHasError(true);
                onLoadError?.();
                onError?.(e);
              }}
            />
          );
        }
      }
      return null;
    }

    return (
      <Image
        {...props}
        src={normalizedUrl}
        alt={alt || 'Image'}
        onError={(e) => {
          setHasError(true);
          onLoadError?.();
          onError?.(e);
        }}
      />
    );
  } catch (error) {
    console.error('SafeImage error:', error);
    return null;
  }
};
