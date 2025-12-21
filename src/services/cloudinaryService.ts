// Cloudinary Upload Service for NoteHall
// Uses unsigned uploads with preset

// Read from environment variables with fallbacks
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dxapljgci";
const CLOUDINARY_UPLOAD_PRESET = "notehall_uploads";

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  created_at: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class CloudinaryService {
  isConfigured(): boolean {
    return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
  }

  getUploadUrl(): string {
    return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
  }

  async upload(
    file: File,
    options?: {
      folder?: string;
      onProgress?: (progress: UploadProgress) => void;
    }
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured()) {
      throw new Error("Cloudinary is not configured. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your environment.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    
    if (options?.folder) {
      formData.append("folder", options.folder);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", this.getUploadUrl());

      if (options?.onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            options.onProgress!({
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            });
          }
        });
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (e) {
            reject(new Error("Failed to parse upload response"));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error?.message || "Upload failed"));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during upload"));
      };

      xhr.send(formData);
    });
  }

  // Alias for convenience
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<CloudinaryUploadResult> {
    return this.upload(file, {
      folder: "notehall",
      onProgress: onProgress ? (p) => onProgress(p.percentage) : undefined,
    });
  }

  async uploadMultiple(
    files: File[],
    options?: {
      folder?: string;
      onFileProgress?: (fileIndex: number, progress: UploadProgress) => void;
      onFileComplete?: (fileIndex: number, result: CloudinaryUploadResult) => void;
    }
  ): Promise<CloudinaryUploadResult[]> {
    const results: CloudinaryUploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await this.upload(files[i], {
        folder: options?.folder,
        onProgress: (progress) => options?.onFileProgress?.(i, progress),
      });
      
      results.push(result);
      options?.onFileComplete?.(i, result);
    }

    return results;
  }

  // Helper to get file type category
  getFileCategory(file: File): "image" | "pdf" | "video" | "other" {
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "application/pdf") return "pdf";
    if (file.type.startsWith("video/")) return "video";
    return "other";
  }

  // Validate file before upload
  validateFile(
    file: File, 
    options?: { 
      maxSizeMB?: number; 
      allowedTypes?: string[] 
    }
  ): { valid: boolean; error?: string } {
    const maxSize = (options?.maxSizeMB || 10) * 1024 * 1024;
    
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File size exceeds ${options?.maxSizeMB || 10}MB limit` 
      };
    }

    if (options?.allowedTypes) {
      const isAllowed = options.allowedTypes.some(type => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.replace("/*", "/"));
        }
        return file.type === type;
      });

      if (!isAllowed) {
        return { 
          valid: false, 
          error: "File type not allowed" 
        };
      }
    }

    return { valid: true };
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
