// Coordinate conversion utilities for PDF signature injection
// Converts between browser pixels and PDF points (72 DPI)

/**
 * Convert browser pixel coordinates to normalized PDF coordinates (0-1)
 * @param {Object} pixelCoords - {x, y, width, height} in browser pixels
 * @param {Object} pdfRect - PDF page bounding rectangle
 * @param {Object} containerRect - Container bounding rectangle
 * @returns {Object} Normalized coordinates {x, y, width, height}
 */
export const pixelsToNormalized = (pixelCoords, pdfRect, containerRect) => {
  if (!pdfRect || !containerRect) return pixelCoords;

  // Calculate the offset of PDF within container
  const pdfOffsetX = pdfRect.left - containerRect.left;
  const pdfOffsetY = pdfRect.top - containerRect.top;

  // Convert pixel coordinates relative to PDF
  const relativeX = pixelCoords.x - pdfOffsetX;
  const relativeY = pixelCoords.y - pdfOffsetY;

  // Normalize to 0-1 range based on PDF dimensions
  const normalizedX = Math.max(0, Math.min(1, relativeX / pdfRect.width));
  const normalizedY = Math.max(0, Math.min(1, relativeY / pdfRect.height));
  const normalizedWidth = Math.max(0, Math.min(1, pixelCoords.width / pdfRect.width));
  const normalizedHeight = Math.max(0, Math.min(1, pixelCoords.height / pdfRect.height));

  return {
    x: normalizedX,
    y: normalizedY,
    width: normalizedWidth,
    height: normalizedHeight,
  };
};

/**
 * Convert normalized PDF coordinates (0-1) back to browser pixels
 * @param {Object} normalizedCoords - {x, y, width, height} normalized (0-1)
 * @param {Object} pdfRect - PDF page bounding rectangle
 * @param {Object} containerRect - Container bounding rectangle
 * @returns {Object} Pixel coordinates {x, y, width, height}
 */
export const normalizedToPixels = (normalizedCoords, pdfRect, containerRect) => {
  if (!pdfRect || !containerRect) return normalizedCoords;

  // Calculate the offset of PDF within container
  const pdfOffsetX = pdfRect.left - containerRect.left;
  const pdfOffsetY = pdfRect.top - containerRect.top;

  // Convert normalized coordinates to pixel coordinates relative to container
  const pixelX = pdfOffsetX + (normalizedCoords.x * pdfRect.width);
  const pixelY = pdfOffsetY + (normalizedCoords.y * pdfRect.height);
  const pixelWidth = normalizedCoords.width * pdfRect.width;
  const pixelHeight = normalizedCoords.height * pdfRect.height;

  return {
    x: pixelX,
    y: pixelY,
    width: pixelWidth,
    height: pixelHeight,
  };
};

/**
 * Get PDF page dimensions and position for coordinate conversion
 * @param {HTMLElement} pdfContainer - Container element holding the PDF
 * @returns {Object} PDF rectangle and container rectangle
 */
export const getPDFDimensions = (pdfContainer) => {
  if (!pdfContainer) return null;

  const containerRect = pdfContainer.getBoundingClientRect();
  const pdfPage = pdfContainer.querySelector('.react-pdf__Page__canvas');

  if (!pdfPage) return { containerRect };

  const pdfRect = pdfPage.getBoundingClientRect();

  return {
    pdfRect,
    containerRect,
  };
};

/**
 * Convert PDF points (72 DPI) to pixels for a given screen DPI
 * @param {number} points - PDF points
 * @param {number} screenDPI - Screen DPI (default: 96)
 * @returns {number} Pixels
 */
export const pointsToPixels = (points, screenDPI = 96) => {
  return (points * screenDPI) / 72;
};

/**
 * Convert pixels to PDF points (72 DPI)
 * @param {number} pixels - Screen pixels
 * @param {number} screenDPI - Screen DPI (default: 96)
 * @returns {number} PDF points
 */
export const pixelsToPoints = (pixels, screenDPI = 96) => {
  return (pixels * 72) / screenDPI;
};

/**
 * Validate coordinate bounds
 * @param {Object} coords - Coordinate object
 * @returns {boolean} True if coordinates are valid
 */
export const validateCoordinates = (coords) => {
  if (!coords) return false;
  
  const { x, y, width, height } = coords;
  
  return (
    typeof x === 'number' && !isNaN(x) &&
    typeof y === 'number' && !isNaN(y) &&
    typeof width === 'number' && !isNaN(width) && width > 0 &&
    typeof height === 'number' && !isNaN(height) && height > 0 &&
    x >= 0 && x <= 1 &&
    y >= 0 && y <= 1 &&
    width <= 1 &&
    height <= 1
  );
};

/**
 * Clamp coordinates to valid range (0-1)
 * @param {Object} coords - Coordinate object
 * @returns {Object} Clamped coordinates
 */
export const clampCoordinates = (coords) => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  
  return {
    x: clamp(coords.x || 0, 0, 1),
    y: clamp(coords.y || 0, 0, 1),
    width: clamp(coords.width || 0, 0, 1),
    height: clamp(coords.height || 0, 0, 1),
  };
};
// export const pixelsToPoints = (pixels, screenDPI = 96) => {
//   return (pixels * 72) / screenDPI;
// };

/**
 * Calculate responsive coordinates that maintain position across different screen sizes
 * @param {Object} originalCoords - Original normalized coordinates
 * @param {Object} originalViewport - Original viewport dimensions
 * @param {Object} currentViewport - Current viewport dimensions
 * @returns {Object} Adjusted normalized coordinates
 */
export const calculateResponsiveCoordinates = (originalCoords, originalViewport, currentViewport) => {
  // This is a simplified approach - in a real implementation, you'd want more sophisticated
  // logic based on the PDF's aspect ratio and content layout
  const scaleX = currentViewport.width / originalViewport.width;
  const scaleY = currentViewport.height / originalViewport.height;

  return {
    ...originalCoords,
    x: Math.max(0, Math.min(1, originalCoords.x * scaleX)),
    y: Math.max(0, Math.min(1, originalCoords.y * scaleY)),
    width: Math.max(0, Math.min(1, originalCoords.width * scaleX)),
    height: Math.max(0, Math.min(1, originalCoords.height * scaleY)),
  };
};
