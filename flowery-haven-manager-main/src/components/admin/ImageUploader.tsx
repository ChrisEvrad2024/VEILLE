import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";

interface ImageUploaderProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
  defaultImage: string;
}

const ImageUploader = ({ imageUrl, onImageChange, defaultImage = "/assets/logo.jpeg" }: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onImageChange(e.target.value);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Fonction pour convertir un fichier en base64
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      setError("Le fichier doit être une image");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop grande (max 5MB)");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Convertir le fichier en base64
      const base64Data = await fileToDataURL(file);
      
      // Passer directement le base64 au parent sans essayer de stocker dans IndexedDB
      onImageChange(base64Data);
    } catch (err) {
      console.error("Error processing image:", err);
      setError("Erreur lors du traitement de l'image");
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    onImageChange("");
  };

  // Determine which image to display
  const displayImage = imageUrl || defaultImage;

  return (
    <div className="space-y-2">
      <Label>Image de couverture</Label>
      
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="URL de l'image"
          value={imageUrl}
          onChange={handleUrlChange}
          className="flex-grow"
        />
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleFileSelect}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Envoi..." : "Upload"}
        </Button>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden" 
        />
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      {displayImage && (
        <div className="relative mt-2">
          <img
            src={displayImage}
            alt="Image de couverture"
            className="h-32 w-full object-cover rounded-md border"
            onError={(e) => {
              // If image fails to load, set the default image
              (e.target as HTMLImageElement).src = defaultImage;
            }}
          />
          
          {imageUrl && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;