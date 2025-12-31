import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from '@fluidjs/multer-cloudinary';
import multer from 'multer';

const cloudName = process.env.CLOUDINARY_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Cloudinary configuration missing:');
  console.error('CLOUDINARY_NAME:', cloudName ? '***set***' : 'NOT SET');
  console.error('CLOUDINARY_API_KEY:', apiKey ? '***set***' : 'NOT SET');
  console.error('CLOUDINARY_SECRET:', apiSecret ? '***set***' : 'NOT SET');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const createStorage = (folder = 'auth-system') => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' }
      ],
    },
  });
};

export const createUploadMiddleware = (folder = 'auth-system') => {
  const storage = createStorage(folder);
  return multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(file.originalname.toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    },
  });
};
export const uploadToCloudinary = async (fileBuffer, options = {}) => {
  try {
    const {
      folder = 'auth-system',
      public_id,
      transformation = [],
      resource_type = 'image'
    } = options;

    let buffer;
    if (Buffer.isBuffer(fileBuffer)) {
      buffer = fileBuffer;
    } else if (fileBuffer instanceof ArrayBuffer) {
      buffer = Buffer.from(fileBuffer);
    } else if (fileBuffer && fileBuffer.buffer instanceof ArrayBuffer) {
      buffer = Buffer.from(fileBuffer.buffer);
    } else {
      throw new Error('Invalid file buffer type');
    }

    const dataURI = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    const uploadOptions = {
      folder,
      resource_type,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        ...transformation
      ]
    };

    if (public_id) {
      uploadOptions.public_id = public_id;
    }

    const result = await cloudinary.uploader.upload(dataURI, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const uploadOnCloudinary = async (localFilePath, options = {}) => {
  const fs = await import('fs');

  try {
    const {
      folder = 'auth-system',
      public_id,
      transformation = [],
      resource_type = 'image'
    } = options;

    if (!localFilePath) {
      throw new Error('File path is required');
    }

    const uploadOptions = {
      folder,
      resource_type,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        ...transformation
      ]
    };

    if (public_id) {
      uploadOptions.public_id = public_id;
    }

    const result = await cloudinary.uploader.upload(localFilePath, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
        console.log(`Temp file cleaned up: ${localFilePath}`);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
  }
};

export const uploadMultipleToCloudinary = async (files, options = {}) => {
  try {
    const uploadPromises = files.map(file =>
      uploadToCloudinary(file, options)
    );

    const results = await Promise.all(uploadPromises);

    const successful = results.filter(result => result.success);
    const failed = results.filter(result => !result.success);

    return {
      success: successful.length > 0,
      urls: successful.map(result => result.url),
      uploaded: successful,
      failed: failed,
      totalUploaded: successful.length,
      totalFailed: failed.length,
    };
  } catch (error) {
    console.error('Multiple upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    return {
      success: true,
      result: result.result,
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    const deletePromises = publicIds.map(publicId => deleteFromCloudinary(publicId));
    const results = await Promise.all(deletePromises);

    const successful = results.filter(result => result.success);
    const failed = results.filter(result => !result.success);

    return {
      success: successful.length > 0,
      deleted: successful,
      failed: failed,
      totalDeleted: successful.length,
      totalFailed: failed.length,
    };
  } catch (error) {
    console.error('Multiple delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width = 500,
    height = 500,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    format,
    secure: true,
  });
};

export const createImageVariants = (publicId) => {
  return {
    thumbnail: getOptimizedImageUrl(publicId, { width: 150, height: 150, crop: 'thumb' }),
    small: getOptimizedImageUrl(publicId, { width: 300, height: 300, crop: 'fill' }),
    medium: getOptimizedImageUrl(publicId, { width: 600, height: 600, crop: 'fill' }),
    large: getOptimizedImageUrl(publicId, { width: 1000, height: 1000, crop: 'limit' }),
    original: cloudinary.url(publicId, { secure: true }),
  };
};

export const extractPublicId = (url) => {
  try {
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

export const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_SECRET
  );
};

export const getCloudinaryStatus = () => {
  return {
    configured: isCloudinaryConfigured(),
    cloud_name: process.env.CLOUDINARY_NAME ? '***configured***' : 'not set',
    api_key: process.env.CLOUDINARY_API_KEY ? '***configured***' : 'not set',
    api_secret: process.env.CLOUDINARY_SECRET ? '***configured***' : 'not set',
  };
};

export const isBase64Image = (str) => {
  if (typeof str !== 'string') return false;
  const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  return base64Regex.test(str);
};

export const base64ToBuffer = (base64String) => {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};

export const isCloudinaryUrl = (url) => {
  if (typeof url !== 'string') return false;
  return url.startsWith('https://res.cloudinary.com/') || url.startsWith('http://res.cloudinary.com/');
};

export const isValidImageUrl = (url) => {
  if (typeof url !== 'string') return false;
  const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
  return urlRegex.test(url) || isCloudinaryUrl(url);
};

export const downloadImageFromUrl = async (url) => {
  try {
    const https = await import('https');
    const http = await import('http');
    
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    return new Promise((resolve, reject) => {
      const request = client.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }
        
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
          reject(new Error('URL does not point to an image'));
          return;
        }
        
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
      });
      
      request.on('error', (error) => {
        reject(new Error(`Failed to download image: ${error.message}`));
      });
      
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Image download timeout'));
      });
    });
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
};

export const processProfileImage = async (imageInput, options = {}) => {
  const { folder = 'auth-system/profiles' } = options;

  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      error: 'File upload service is not configured',
    };
  }

  if (isCloudinaryUrl(imageInput)) {
    return {
      success: true,
      url: imageInput,
      isCloudinary: true,
    };
  }

  if (isBase64Image(imageInput)) {
    try {
      const imageBuffer = base64ToBuffer(imageInput);
      
      if (imageBuffer.length === 0) {
        return {
          success: false,
          error: 'Invalid base64 image data',
        };
      }

      const uploadResult = await uploadToCloudinary(imageBuffer, { folder });

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload profile image from base64',
        };
      }

      return {
        success: true,
        url: uploadResult.url,
        public_id: uploadResult.public_id,
      };
    } catch (error) {
      return {
        success: false,
        error: `Invalid base64 image format: ${error.message}`,
      };
    }
  }

  if (isValidImageUrl(imageInput)) {
    try {
      const imageBuffer = await downloadImageFromUrl(imageInput);
      
      if (!imageBuffer || imageBuffer.length === 0) {
        return {
          success: false,
          error: 'Failed to download image from URL',
        };
      }

      const uploadResult = await uploadToCloudinary(imageBuffer, { folder });

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload profile image from URL',
        };
      }

      return {
        success: true,
        url: uploadResult.url,
        public_id: uploadResult.public_id,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process image URL: ${error.message}`,
      };
    }
  }

  if (Buffer.isBuffer(imageInput)) {
    const uploadResult = await uploadToCloudinary(imageInput, { folder });

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload profile image',
      };
    }

    return {
      success: true,
      url: uploadResult.url,
      public_id: uploadResult.public_id,
    };
  }

  return {
    success: false,
    error: 'Invalid profile image format. Please provide a valid image URL, base64 image data, or upload a file',
  };
};

export const processPictures = async (picturesInput, options = {}) => {
  const { folder = 'auth-system/pictures' } = options;

  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      error: 'File upload service is not configured',
    };
  }

  if (!Array.isArray(picturesInput)) {
    return {
      success: false,
      error: 'Pictures must be an array',
    };
  }

  const processedPictures = [];
  const base64Images = [];
  const externalUrlImages = [];
  const cloudinaryUrls = [];
  const bufferImages = [];

  for (const picture of picturesInput) {
    if (typeof picture === 'string') {
      if (isCloudinaryUrl(picture)) {
        cloudinaryUrls.push(picture);
      } else if (isBase64Image(picture)) {
        base64Images.push(picture);
      } else if (isValidImageUrl(picture)) {
        externalUrlImages.push(picture);
      } else {
        return {
          success: false,
          error: `Invalid picture format: ${picture.substring(0, 50)}... Please provide valid image URLs or base64 image data`,
        };
      }
    } else if (Buffer.isBuffer(picture)) {
      bufferImages.push(picture);
    } else {
      return {
        success: false,
        error: 'Pictures must be an array of strings (URLs or base64) or buffers',
      };
    }
  }

  if (base64Images.length > 0) {
    try {
      const imageBuffers = base64Images.map(base64 => base64ToBuffer(base64));
      const uploadResult = await uploadMultipleToCloudinary(imageBuffers, { folder });

      if (!uploadResult.success || uploadResult.urls.length === 0) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload base64 pictures',
        };
      }

      processedPictures.push(...uploadResult.urls);
    } catch (error) {
      return {
        success: false,
        error: `Invalid base64 image format in pictures: ${error.message}`,
      };
    }
  }

  if (externalUrlImages.length > 0) {
    try {
      const downloadPromises = externalUrlImages.map(url => downloadImageFromUrl(url));
      const imageBuffers = await Promise.all(downloadPromises);
      
      const validBuffers = imageBuffers.filter(buffer => buffer && buffer.length > 0);
      
      if (validBuffers.length === 0) {
        return {
          success: false,
          error: 'Failed to download images from URLs',
        };
      }

      const uploadResult = await uploadMultipleToCloudinary(validBuffers, { folder });

      if (!uploadResult.success || uploadResult.urls.length === 0) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload pictures from URLs',
        };
      }

      processedPictures.push(...uploadResult.urls);
    } catch (error) {
      return {
        success: false,
        error: `Failed to process image URLs: ${error.message}`,
      };
    }
  }

  if (bufferImages.length > 0) {
    const uploadResult = await uploadMultipleToCloudinary(bufferImages, { folder });

    if (!uploadResult.success || uploadResult.urls.length === 0) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload picture buffers',
      };
    }

    processedPictures.push(...uploadResult.urls);
  }

  processedPictures.push(...cloudinaryUrls);

  return {
    success: true,
    urls: processedPictures,
    totalProcessed: processedPictures.length,
  };
};

export const cleanupTempFolder = async (tempDir = './temp') => {
  try {
    const fs = await import('fs');
    const path = await import('path');

    if (!fs.existsSync(tempDir)) {
      console.log('Temp directory does not exist:', tempDir);
      return { success: true, message: 'Temp directory does not exist' };
    }

    const files = fs.readdirSync(tempDir);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`Cleaned up temp file: ${file}`);
        }
      } catch (fileError) {
        console.error(`Error deleting temp file ${file}:`, fileError);
      }
    }

    console.log(`Temp folder cleanup completed. Deleted ${deletedCount} files.`);
    return {
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} temp files`
    };
  } catch (error) {
    console.error('Error during temp folder cleanup:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to cleanup temp folder'
    };
  }
};

export default {
  uploadToCloudinary,
  uploadOnCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  getOptimizedImageUrl,
  createImageVariants,
  extractPublicId,
  isCloudinaryConfigured,
  getCloudinaryStatus,
  createUploadMiddleware,
  isBase64Image,
  base64ToBuffer,
  isCloudinaryUrl,
  isValidImageUrl,
  downloadImageFromUrl,
  processProfileImage,
  processPictures,
  cleanupTempFolder,
};