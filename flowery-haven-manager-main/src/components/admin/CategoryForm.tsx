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
import { Category } from "@/types/product";
import ImageUploader from "@/components/shared/ImageUploader";

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
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category: Category | null;
  onSubmit: (category: Category) => void;
  onCancel: () => void;
}

export function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const [image, setImage] = useState<string[]>(category?.image ? [category.image] : []);
  
  // Get default values for the form
  const getDefaultValues = () => {
    if (category) {
      return {
        name: category.name,
        description: category.description,
        id: category.id,
      };
    }
    return {
      name: "",
      description: "",
      id: "",
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

  // Form submission handler
  const handleFormSubmit = (values: CategoryFormValues) => {
    // Create new category object
    const updatedCategory: Category = {
      id: values.id,
      name: values.name,
      description: values.description,
      image: image.length > 0 ? image[0] : undefined,
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

        <div className="space-y-2">
          <FormLabel>Image de la catégorie</FormLabel>
          <ImageUploader 
            images={image} 
            onChange={setImage} 
            maxImages={1}
            helperText="Ajoutez une image représentative pour la catégorie. Maximum 1 image."
          />
        </div>

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