"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/cloudinary";

interface ImageUploaderProps {
  currentUrl: string | null;
  onUpload: (url: string | null) => void;
}

export default function ImageUploader({ currentUrl, onUpload }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    // Upload to Cloudinary
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);

    if (url) {
      setPreview(url);
      onUpload(url);
    } else {
      setPreview(currentUrl);
      onUpload(currentUrl);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-muted-foreground">Imagen</label>
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="h-32 w-32 rounded-xl border border-border object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow-md hover:bg-red-700"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-violet hover:text-violet"
        >
          <Upload className="h-6 w-6" />
          <span className="text-[10px]">Subir imagen</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
