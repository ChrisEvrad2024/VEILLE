import { useState, useEffect } from "react";
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
import { Loader2, Save, X, Tag, Sparkles, FileText, Image as ImageIcon, Hash, PencilLine } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Form validation schema
const categoryFormSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom de la catégorie doit contenir au moins 2 caractères",
  }).max(50, {
    message: "Le nom de la catégorie ne peut pas dépasser 50 caractères",
  }),
  description: z.string().min(10, {
    message: "La description doit contenir au moins 10 caractères",
  }).max(500, {
    message: "La description ne peut pas dépasser 500 caractères",
  }),
  id: z.string().min(2, {
    message: "L'identifiant doit contenir au moins 2 caractères",
  }).max(50, {
    message: "L'identifiant ne peut pas dépasser 50 caractères",
  }).regex(/^[a-z0-9-]+$/, {
    message: "L'identifiant ne peut contenir que des lettres minuscules, des chiffres et des tirets",
  }),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category: Category | null;
  onSubmit: (category: Category) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CategoryForm({ category, onSubmit, onCancel, isSubmitting = false }: CategoryFormProps) {
  const [image, setImage] = useState<string[]>(category?.image ? [category.image] : []);
  const [idTouched, setIdTouched] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
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
    mode: "onChange", // Validation dès que l'utilisateur tape
  });

  // Watch form values for preview
  const watchedValues = form.watch();
  
  // Auto-generate slug from name
  const autoGenerateId = (name: string) => {
    if (!category && !idTouched) { // Only auto-generate if it's a new category and user hasn't manually edited
      const id = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')  // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-')       // Replace multiple hyphens with a single one
        .substring(0, 50);         // Limit to 50 characters
      
      form.setValue("id", id, { shouldValidate: true });
    }
  };

  // Handle ID field being manually edited
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdTouched(true);
    form.setValue("id", e.target.value, { shouldValidate: true });
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
  
  // Calculate character counts
  const nameLength = watchedValues.name?.length || 0;
  const descriptionLength = watchedValues.description?.length || 0;
  const idLength = watchedValues.id?.length || 0;
  
  // Toggle preview mode
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {category ? "Modifier une catégorie" : "Créer une catégorie"}
        </h2>
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={previewMode ? "default" : "outline"} 
                  size="sm" 
                  onClick={togglePreview}
                  disabled={!form.formState.isValid}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {previewMode ? "Éditer" : "Aperçu"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {previewMode ? "Retour à l'édition" : "Voir un aperçu de la catégorie"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {previewMode ? (
        // Preview mode
        <Card className="overflow-hidden border-primary/10">
          <div className="relative h-40 bg-muted">
            {image.length > 0 ? (
              <img 
                src={image[0]} 
                alt={watchedValues.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon size={48} className="text-muted-foreground opacity-20" />
              </div>
            )}
          </div>
          
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{watchedValues.name || "Nom de la catégorie"}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  ID: {watchedValues.id || "id-categorie"}
                </CardDescription>
              </div>
              <Badge variant="outline" className="px-2 py-1">
                Catégorie
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-muted-foreground">
              {watchedValues.description || "Description de la catégorie..."}
            </p>
          </CardContent>
          
          <CardFooter className="bg-muted/30 border-t">
            <div className="flex justify-between items-center w-full">
              <span className="text-sm text-muted-foreground">0 produits</span>
              <Button variant="ghost" size="sm">Voir les produits</Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        // Form mode
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-base font-medium">
                          <Tag className="h-4 w-4 mr-2 text-primary" />
                          Nom de la catégorie
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="Bouquets de mariage" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                autoGenerateId(e.target.value);
                              }}
                              className="pr-14"
                            />
                            <div className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                              <span className={nameLength > 40 ? "text-amber-500" : ""}>
                                {nameLength}
                              </span>/50
                            </div>
                          </div>
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
                        <FormLabel className="flex items-center text-base font-medium">
                          <Hash className="h-4 w-4 mr-2 text-primary" />
                          Identifiant
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="bouquets-mariage" 
                              {...field}
                              onChange={handleIdChange}
                              disabled={!!category}
                              className={cn(
                                "pr-14",
                                category ? "bg-muted cursor-not-allowed" : ""
                              )}
                            />
                            <div className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                              <span className={idLength > 40 ? "text-amber-500" : ""}>
                                {idLength}
                              </span>/50
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Cet identifiant est utilisé dans les URLs et ne peut pas être modifié après la création.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-base font-medium">
                          <FileText className="h-4 w-4 mr-2 text-primary" />
                          Description
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              placeholder="Une description détaillée de la catégorie..."
                              className="min-h-[144px] resize-none pr-14 pt-2"
                              {...field}
                            />
                            <div className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                              <span className={descriptionLength > 400 ? "text-amber-500" : ""}>
                                {descriptionLength}
                              </span>/500
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <FormLabel className="flex items-center text-base font-medium">
                <ImageIcon className="h-4 w-4 mr-2 text-primary" />
                Image de la catégorie
              </FormLabel>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border shadow-sm">
                <ImageUploader 
                  images={image} 
                  onChange={setImage} 
                  maxImages={1}
                  helperText="Ajoutez une image représentative pour la catégorie. Maximum 1 image. Format recommandé: 800x600px."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-5"
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button 
                type="submit" 
                size="lg"
                disabled={!form.formState.isValid || isSubmitting}
                className="px-5"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {category ? "Mettre à jour" : "Créer la catégorie"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}