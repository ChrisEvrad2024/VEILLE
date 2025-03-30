import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Product } from "@/types/product";
import { Trash2, Plus, X } from "lucide-react";
import ImageUploader from "@/components/shared/ImageUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

// Form validation schema
const productFormSchema = z.object({
  name: z.string().min(3, {
    message: "Le nom du produit doit contenir au moins 3 caractères",
  }),
  description: z.string().min(10, {
    message: "La description doit contenir au moins 10 caractères",
  }),
  price: z.coerce.number().positive({
    message: "Le prix doit être un nombre positif",
  }),
  stock: z.coerce.number().int().nonnegative({
    message: "Le stock doit être un nombre entier positif ou zéro",
  }),
  category: z.string({
    required_error: "Veuillez sélectionner une catégorie",
  }),
  sku: z.string().optional(),
  weight: z.coerce.number().positive().optional(),
  popular: z.boolean().default(false),
  featured: z.boolean().default(false),
  shortDescription: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  dimensions: z.object({
    length: z.coerce.number().positive().optional(),
    width: z.coerce.number().positive().optional(),
    height: z.coerce.number().positive().optional(),
  }).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product: Product | null;
  categories: { id: string; name: string }[];
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

export function ProductForm({ product, categories, onSubmit, onCancel }: ProductFormProps) {
  const [images, setImages] = useState<string[]>(product?.images || []);

  // Setup form with default values
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      shortDescription: product?.shortDescription || "",
      price: product?.price || 0,
      stock: product?.stock || 0,
      category: product?.category || "",
      sku: product?.sku || "",
      weight: product?.weight || 0,
      popular: product?.popular || false,
      featured: product?.featured || false,
      metaTitle: product?.metaTitle || "",
      metaDescription: product?.metaDescription || "",
      dimensions: product?.dimensions || {
        length: undefined,
        width: undefined,
        height: undefined,
      },
    },
  });

  // Form submission handler
  const handleFormSubmit = (values: ProductFormValues) => {
    // Check if images are provided
    if (images.length === 0) {
      form.setError("root", { 
        type: "custom", 
        message: "Veuillez ajouter au moins une image au produit" 
      });
      return;
    }

    // Create new product object
    const updatedProduct: Product = {
      id: product?.id || `prod-${Date.now()}`,
      name: values.name,
      description: values.description,
      shortDescription: values.shortDescription,
      price: values.price,
      stock: values.stock,
      images: images,
      category: values.category,
      popular: values.popular,
      featured: values.featured,
      sku: values.sku,
      weight: values.weight,
      metaTitle: values.metaTitle,
      metaDescription: values.metaDescription,
      dimensions: values.dimensions && Object.values(values.dimensions).some(Boolean) 
        ? values.dimensions 
        : undefined,
    };

    onSubmit(updatedProduct);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="basic">Informations de base</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="advanced">Options avancées</TabsTrigger>
          </TabsList>
          
          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du produit</FormLabel>
                      <FormControl>
                        <Input placeholder="Bouquet de roses rouges" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description courte</FormLabel>
                      <FormControl>
                        <Input placeholder="Une brève description du produit" {...field} />
                      </FormControl>
                      <FormDescription>
                        Résumé court utilisé dans les listes de produits
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix (XAF)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min="0"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description détaillée du produit..."
                          className="min-h-[230px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="popular"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Produit populaire</FormLabel>
                          <FormDescription>
                            Marquer ce produit comme populaire
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Produit en vedette</FormLabel>
                          <FormDescription>
                            Mettre ce produit en avant sur la page d'accueil
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Images Tab */}
          <TabsContent value="images">
            <Card>
              <CardContent className="pt-6">
                <ImageUploader 
                  images={images} 
                  onChange={setImages}
                  maxImages={10}
                  helperText="Ajoutez jusqu'à 10 images. La première image sera utilisée comme image principale."
                />
                {form.formState.errors.root && (
                  <p className="text-sm font-medium text-destructive mt-4">
                    {form.formState.errors.root.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Advanced Options Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU (Référence)</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU-12345" {...field} />
                      </FormControl>
                      <FormDescription>
                        Code d'identification unique pour le produit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poids (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Label className="text-base">Dimensions</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="dimensions.length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longueur (cm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              {...field} 
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dimensions.width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Largeur (cm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              {...field} 
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dimensions.height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hauteur (cm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              {...field} 
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre SEO</FormLabel>
                      <FormControl>
                        <Input placeholder="Titre optimisé pour les moteurs de recherche" {...field} />
                      </FormControl>
                      <FormDescription>
                        Titre qui apparaîtra dans les résultats de recherche Google
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description SEO</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description optimisée pour les moteurs de recherche..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Description qui apparaîtra dans les résultats de recherche Google
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {product ? "Mettre à jour" : "Créer le produit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}