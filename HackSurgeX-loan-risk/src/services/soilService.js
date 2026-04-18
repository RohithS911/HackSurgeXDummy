import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png'];

/**
 * Validate image file
 * @param {File} imageFile - Image file to validate
 * @throws {Error} if validation fails
 */
function validateImage(imageFile) {
  // Check if file exists
  if (!imageFile) {
    throw new Error('No image file provided');
  }

  // Check file type
  if (!ALLOWED_FORMATS.includes(imageFile.type)) {
    throw new Error('Invalid image format. Please upload JPG, JPEG, or PNG');
  }

  // Check file size
  if (imageFile.size > MAX_IMAGE_SIZE) {
    throw new Error('Image size exceeds 5MB limit. Please compress the image');
  }
}

/**
 * Compress image before upload
 * @param {File} imageFile - Original image file
 * @param {number} maxWidth - Maximum width (default 1024px)
 * @param {number} quality - JPEG quality 0-1 (default 0.8)
 * @returns {Promise<Blob>} Compressed image blob
 */
async function compressImage(imageFile, maxWidth = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`Image compressed: ${imageFile.size} → ${blob.size} bytes`);
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(imageFile);
  });
}

export async function analyzeSoil(imageFile, language = 'en') {
  try {
    // Step 1: Validate image
    validateImage(imageFile);
    
    // Step 2: Compress image if needed
    let processedImage = imageFile;
    if (imageFile.size > 1024 * 1024) { // Compress if > 1MB
      console.log('Compressing image...');
      const compressed = await compressImage(imageFile);
      processedImage = new File([compressed], imageFile.name, { type: 'image/jpeg' });
    }
    
    // Step 3: Get GPS location
    const location = await getLocation();
    
    // Step 4: Upload image for classification
    const formData = new FormData();
    formData.append('image', processedImage);
    formData.append('latitude', location.latitude);
    formData.append('longitude', location.longitude);
    formData.append('language', language);

    console.log('Sending soil analysis request...', {
      imageSize: processedImage.size,
      location
    });

    const response = await axios.post(`${API_BASE}/analyze`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60 second timeout for ML inference
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });

    return response.data;
  } catch (error) {
    console.error('Soil analysis error:', error);
    
    // Handle specific error types
    if (error.message.includes('Invalid image format') || 
        error.message.includes('Image size exceeds')) {
      throw error; // Re-throw validation errors as-is
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your internet connection and try again');
    }
    
    if (error.response?.status === 400) {
      throw new Error(error.response.data.error || 'Invalid request');
    }
    
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later');
    }
    
    throw new Error(error.response?.data?.error || 'Failed to analyze soil. Please try again');
  }
}

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // Fallback to default location if GPS not available
      resolve({ latitude: 12.9716, longitude: 77.5946 }); // Bangalore
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.warn('GPS error, using default location:', error);
        // Fallback to default location
        resolve({ latitude: 12.9716, longitude: 77.5946 });
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}
