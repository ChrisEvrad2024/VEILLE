import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Category } from "@/types/category";

// Form validation schema
const categoryFormSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom de la catégorie doit contenir au moins 2 caractères",
  }),
  description: z.string().min(10, {
    message: "La description doit contenir au moins 10 caractères",
  }),
  id: z.string().min(2, {
    message: "L'identifiant doit contenir au moins 2 caractères",
  }).regex(/^[a-z0-9-]+$/, {
    message: "L'identifiant ne peut contenir que des lettres minuscules, des chiffres et des tirets",
  }),
  image: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category: Category | null;
  onSubmit: (category: Category) => void;
  onCancel: () => void;
}

export function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const [imageUrl, setImageUrl] = useState<string>(category?.image || "");
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Get default values for the form
  const getDefaultValues = () => {
    if (category) {
      return {
        name: category.name,
        description: category.description,
        id: category.id,
        image: category.image || "",
      };
    }
    return {
      name: "",
      description: "",
      id: "",
      image: "",
    };
  };

  // Setup form with default values
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: getDefaultValues(),
  });

  // Auto-generate slug from name
  const autoGenerateId = (name: string) => {
    if (!category) { // Only auto-generate if it's a new category
      const id = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')  // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-');      // Replace multiple hyphens with a single one
      
      form.setValue("id", id);
    }
  };

  // Handle image URL change
  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    setImageError(null);
    form.setValue("image", url);
  };

  // Check if image URL is valid
  const validateImageUrl = (url: string) => {
    if (!url) return true; // Empty URL is valid (optional field)
    
    // Simple URL validation
    const pattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))(\?.*)?$/i;
    if (!pattern.test(url)) {
      setImageError("L'URL doit pointer vers une image (jpg, png, gif, webp)");
      return false;
    }
    
    return true;
  };

  // Form submission handler
  const handleFormSubmit = (values: CategoryFormValues) => {
    // Validate image URL if provided
    if (values.image && !validateImageUrl(values.image)) {
      return;
    }

    // Create updated category object
    const updatedCategory: Category = {
      id: values.id,
      name: values.name,
      description: values.description,
      image: values.image || undefined, // Only include if not empty
    };

    onSubmit(updatedCategory);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la catégorie</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Bouquets de mariage" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    autoGenerateId(e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identifiant</FormLabel>
              <FormControl>
                <Input 
                  placeholder="bouquets-mariage" 
                  {...field} 
                  disabled={!!category} // Disable editing if updating an existing category
                />
              </FormControl>
              <FormDescription>
                Cet identifiant est utilisé dans les URLs et ne peut pas être modifié après la création.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Une description détaillée de la catégorie..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image de la catégorie (URL)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  className={imageError ? 'border-destructive' : ''}
                />
              </FormControl>
              <FormDescription>
                Entrez l'URL d'une image représentative pour cette catégorie.
              </FormDescription>
              {imageError && (
                <p className="text-sm font-medium text-destructive">{imageError}</p>
              )}
              
              {/* Image preview */}
              {imageUrl && !imageError && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-1">Aperçu :</p>
                  <div className="h-40 w-full border rounded-md overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt="Aperçu"
                      className="h-full w-full object-cover object-center"
                      onError={() => setImageError("Impossible de charger l'image. Vérifiez l'URL.")}
                    />
                  </div>
                </div>
              )}
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {category ? "Mettre à jour" : "Créer la catégorie"}
          </Button>
        </div>
      </form>
    </Form>
  );
}