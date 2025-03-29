import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Plus, 
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  helperText?: string;
}

type ImageSource = 'file' | 'url';

const ImageUploader = ({ 
  images = [], 
  onChange, 
  maxImages = 5,
  helperText = "Ajoutez des images de produit. Types acceptés: JPG, PNG. Taille maximale: 5 MB."
}: ImageUploaderProps) => {
  const [currentImages, setCurrentImages] = useState<string[]>(images);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [imageSource, setImageSource] = useState<ImageSource>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync images prop with state
  useEffect(() => {
    setCurrentImages(images);
  }, [images]);

  // Handle preview dialog
  const openPreview = (imageSrc: string) => {
    setPreviewImage(imageSrc);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if adding more images would exceed the max limit
    if (currentImages.length + files.length > maxImages) {
      toast.error(`Vous pouvez ajouter au maximum ${maxImages} images`);
      return;
    }

    Array.from(files).forEach(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`Le fichier ${file.name} n'est pas une image`);
        return;
      }

      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Le fichier ${file.name} dépasse la taille maximum de 5 MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newImages = [...currentImages, e.target.result.toString()];
          setCurrentImages(newImages);
          onChange(newImages);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsAddingImage(false);
  };

  // Handle URL image addition
  const handleAddImageUrl = () => {
    if (!imageUrl) {
      toast.error("Veuillez entrer une URL d'image valide");
      return;
    }

    // Check if adding more images would exceed the max limit
    if (currentImages.length + 1 > maxImages) {
      toast.error(`Vous pouvez ajouter au maximum ${maxImages} images`);
      return;
    }

    // Basic URL validation
    if (!imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
      toast.error("L'URL doit pointer vers une image (jpg, png, gif, webp)");
      return;
    }

    // Add the URL to images
    const newImages = [...currentImages, imageUrl];
    setCurrentImages(newImages);
    onChange(newImages);

    // Reset state
    setImageUrl('');
    setIsAddingImage(false);
  };

  // Remove image at index
  const removeImage = (index: number) => {
    const newImages = currentImages.filter((_, i) => i !== index);
    setCurrentImages(newImages);
    onChange(newImages);
  };

  // Move image up in the order
  const moveImageUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...currentImages];
    [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
    setCurrentImages(newImages);
    onChange(newImages);
  };

  // Move image down in the order
  const moveImageDown = (index: number) => {
    if (index === currentImages.length - 1) return;
    const newImages = [...currentImages];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setCurrentImages(newImages);
    onChange(newImages);
  };

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    if (draggedIndex === null) return;
    
    // Reorder images based on drag and drop
    const newImages = [...currentImages];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    setCurrentImages(newImages);
    onChange(newImages);
    setDraggedIndex(null);
  };

  // Handle external file drop
  const handleExternalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    if (!e.dataTransfer.files.length) return;
    
    // Check if adding more images would exceed the max limit
    if (currentImages.length + e.dataTransfer.files.length > maxImages) {
      toast.error(`Vous pouvez ajouter au maximum ${maxImages} images`);
      return;
    }
    
    Array.from(e.dataTransfer.files).forEach(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`Le fichier ${file.name} n'est pas une image`);
        return;
      }

      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Le fichier ${file.name} dépasse la taille maximum de 5 MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newImages = [...currentImages, e.target.result.toString()];
          setCurrentImages(newImages);
          onChange(newImages);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-4">
      <Label className="text-base">Images</Label>
      
      {/* Drop zone */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDraggingOver ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleExternalDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload size={20} className="text-primary" />
          </div>
          <div className="text-sm font-medium">
            Glissez des images ici ou{' '}
            <Button 
              variant="link" 
              className="h-auto p-0" 
              onClick={() => setIsAddingImage(true)}
            >
              parcourez vos fichiers
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
        </div>
      </div>

      {/* Images grid */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {currentImages.map((image, index) => (
            <div 
              key={index} 
              className="group relative aspect-square border rounded-md overflow-hidden cursor-move"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              <img 
                src={image} 
                alt={`Product image ${index + 1}`} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => openPreview(image)}
                >
                  <Eye size={14} />
                </Button>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => moveImageUp(index)}
                  disabled={index === 0}
                >
                  <ArrowUp size={14} />
                </Button>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => moveImageDown(index)}
                  disabled={index === currentImages.length - 1}
                >
                  <ArrowDown size={14} />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => removeImage(index)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              {index === 0 && (
                <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                  Principale
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add image dialog */}
      <Dialog open={isAddingImage} onOpenChange={setIsAddingImage}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une image</DialogTitle>
            <DialogDescription>
              Ajoutez une image depuis votre appareil ou via une URL.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-4 my-4">
            <Button
              variant={imageSource === 'file' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setImageSource('file')}
            >
              <ImageIcon size={16} className="mr-2" />
              Depuis un fichier
            </Button>
            <Button
              variant={imageSource === 'url' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setImageSource('url')}
            >
              <LinkIcon size={16} className="mr-2" />
              Depuis une URL
            </Button>
          </div>
          
          {imageSource === 'file' ? (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Plus size={20} className="text-primary" />
                  </div>
                  <div className="text-sm font-medium">
                    Cliquez pour sélectionner un fichier
                  </div>
                  <p className="text-xs text-muted-foreground">{helperText}</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="image-url">URL de l'image</Label>
                  <Input
                    id="image-url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddImageUrl}>Ajouter</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Entrez l'URL complète d'une image accessible sur internet.
              </p>
            </div>
          )}

          <DialogFooter className="sm:justify-start">
            <Button
              variant="ghost"
              onClick={() => setIsAddingImage(false)}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Aperçu de l'image</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {previewImage && (
              <img 
                src={previewImage} 
                alt="Aperçu" 
                className="max-h-[70vh] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPreviewImage(null)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageUploader;