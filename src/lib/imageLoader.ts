/**
 * Custom image loader for Next.js Image component
 * Handles invalid URLs gracefully by returning a placeholder or the original URL
 */

export const customImageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
  // Return placeholder for invalid or empty URLs
  if (!src || typeof src !== 'string') {
    return '/abstract-geometric-shapes.png';
  }

  // Check if URL is valid
  try {
    // If it's a relative path, return as-is
    if (src.startsWith('/') || src.startsWith('data:')) {
      return src;
    }

    // Try to parse as absolute URL
    new URL(src);
    return src;
  } catch {
    // Return placeholder for invalid URLs
    return '/abstract-geometric-shapes.png';
  }
};

/**
 * Validate if a URL can be used with Next.js Image component
 */
export const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim();
  if (trimmed === '') {
    return false;
  }

  try {
    // Relative paths starting with / are valid
    if (trimmed.startsWith('/')) {
      return true;
    }

    // Data URIs are valid
    if (trimmed.startsWith('data:')) {
      return true;
    }

    // Simple image names without slashes (like "hero.png") are valid
    // They will be converted to relative paths with / prefix
    if (!trimmed.includes('/') && !trimmed.startsWith('http')) {
      // Basic check: should look like a filename
      return /\.[a-zA-Z0-9]+$/i.test(trimmed);
    }

    // Try to parse as absolute URL
    try {
      new URL(trimmed);
      return true;
    } catch {
      // If URL constructor fails, return false
      return false;
    }
  } catch {
    return false;
  }
};

/**
 * Normalize image URL to be compatible with Next.js Image component
 */
export const normalizeImageUrl = (url: string | undefined): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (trimmed === '') {
    return null;
  }

  // If already starts with / or is data URI, return as-is
  if (trimmed.startsWith('/') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // If it looks like an absolute URL, return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If it's a simple filename without path (like "hero.png"), prepend /
  if (!trimmed.includes('/')) {
    return `/${trimmed}`;
  }

  // Default: return with leading / if not already present
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

/**
 * Get a safe image URL with fallback
 */
export const getSafeImageUrl = (
  primaryUrl?: string,
  fallbackUrl?: string,
  defaultImage = '/abstract-geometric-shapes.png'
): string => {
  // Try to normalize and validate primary URL
  if (primaryUrl) {
    const normalizedPrimary = normalizeImageUrl(primaryUrl);
    if (normalizedPrimary && isValidImageUrl(normalizedPrimary)) {
      return normalizedPrimary;
    }
  }

  // Try to normalize and validate fallback URL
  if (fallbackUrl) {
    const normalizedFallback = normalizeImageUrl(fallbackUrl);
    if (normalizedFallback && isValidImageUrl(normalizedFallback)) {
      return normalizedFallback;
    }
  }

  return defaultImage;
};
