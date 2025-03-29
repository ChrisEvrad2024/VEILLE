// src/pages/QuoteRequest.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { quoteService } from "@/services/quote.service";
import { authService } from "@/services/auth.service";
import { 
  Upload, // Changed from FileUpload to Upload
  Calendar, 
  DollarSign, 
  Info, 
  CheckCircle2, 
  Send, 
  Flower, 
  Clock, 
  CalendarDays, 
  Users, 
  Sparkles,
  Cake,
  Building,
  Home,
  Heart,
  Star,
  Trophy,
  Package,
  AlertCircle,
  ChevronRight,
  Phone,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Types d'événement
const eventTypes = [
  { id: 'wedding', label: 'Mariage', icon: <Heart className="w-4 h-4" /> },
  { id: 'birthday', label: 'Anniversaire', icon: <Cake className="w-4 h-4" /> },
  { id: 'corporate', label: 'Événement d\'entreprise', icon: <Building className="w-4 h-4" /> },
  { id: 'funeral', label: 'Funérailles', icon: <Flower className="w-4 h-4" /> },
  { id: 'graduation', label: 'Remise de diplôme', icon: <Trophy className="w-4 h-4" /> },
  { id: 'housewarming', label: 'Pendaison de crémaillère', icon: <Home className="w-4 h-4" /> },
  { id: 'other', label: 'Autre', icon: <Sparkles className="w-4 h-4" /> },
];

// Tranches budgétaires
const budgetRanges = [
  { id: 'economy', label: 'Économique (< 50,000 XAF)', value: 50000 },
  { id: 'standard', label: 'Standard (50,000 - 100,000 XAF)', value: 75000 },
  { id: 'premium', label: 'Premium (100,000 - 200,000 XAF)', value: 150000 },
  { id: 'luxury', label: 'Luxe (> 200,000 XAF)', value: 250000 },
  { id: 'custom', label: 'Budget personnalisé', value: 0 },
];

// Type de délai
const timeFrames = [
  { id: 'urgent', label: 'Urgent (< 48h)', value: 'urgent' },
  { id: 'standard', label: 'Standard (1-2 semaines)', value: 'standard' },
  { id: 'planned', label: 'Planifié (> 2 semaines)', value: 'planned' },
];

// Schéma de validation du formulaire de devis
const quoteFormSchema = z.object({
  eventType: z.string().min(1, "Veuillez sélectionner un type d'événement"),
  eventDate: z.string().min(1, "Veuillez sélectionner une date"),
  timeFrame: z.string().min(1, "Veuillez sélectionner un délai"),
  budget: z.string().min(1, "Veuillez sélectionner un budget"),
  customBudget: z.string().optional(),
  description: z.string().min(10, "Veuillez décrire vos besoins en détail (10 caractères minimum)"),
  preferredColors: z.string().optional(),
  preferredFlowers: z.string().optional(),
  specialRequirements: z.string().optional(),
  name: z.string().min(1, "Veuillez entrer votre nom"),
  email: z.string().email("Veuillez entrer une adresse email valide"),
  phone: z.string().min(9, "Veuillez entrer un numéro de téléphone valide"),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter les conditions générales",
  }),
});

const QuoteRequest = () => {
  const navigate = useNavigate();
  
  // États du formulaire et de la soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [showCustomBudget, setShowCustomBudget] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submittedQuoteId, setSubmittedQuoteId] = useState<string | null>(null);
  
  // Initialisation du formulaire
  const form = useForm<z.infer<typeof quoteFormSchema>>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      eventType: "",
      eventDate: "",
      timeFrame: "standard",
      budget: "",
      customBudget: "",
      description: "",
      preferredColors: "",
      preferredFlowers: "",
      specialRequirements: "",
      name: "",
      email: "",
      phone: "",
      termsAccepted: false,
    },
  });
  
  // Gérer le changement de budget
  const handleBudgetChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomBudget(true);
    } else {
      setShowCustomBudget(false);
      form.setValue('customBudget', '');
    }
    
    setSelectedBudget(value);
    form.setValue('budget', value);
  };
  
  // Gérer l'upload de fichiers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Vérifier si on ne dépasse pas 5 fichiers
      if (attachments.length + newFiles.length > 5) {
        toast.error("Vous ne pouvez pas télécharger plus de 5 fichiers");
        return;
      }
      
      // Vérifier la taille des fichiers (max 5MB par fichier)
      const oversizedFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error("Certains fichiers dépassent la taille maximale de 5 MB", {
          description: `${oversizedFiles.map(f => f.name).join(', ')}`,
        });
        return;
      }
      
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };
  
  // Supprimer un fichier téléchargé
  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // Soumission du formulaire
  const onSubmit = async (values: z.infer<typeof quoteFormSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Vérifier si l'utilisateur est connecté
      if (!authService.isAuthenticated()) {
        toast.error("Vous devez être connecté pour soumettre un devis", {
          description: "Vous allez être redirigé vers la page de connexion",
          duration: 3000,
        });
        
        // Rediriger vers la page de connexion
        setTimeout(() => {
          navigate('/auth/login?redirect=/quote-request');
        }, 2000);
        
        return;
      }
      
      // Déterminer le budget réel
      let budget = 0;
      
      if (values.budget === 'custom' && values.customBudget) {
        budget = parseFloat(values.customBudget.replace(/[^\d.]/g, ''));
      } else {
        const selectedBudgetOption = budgetRanges.find(b => b.id === values.budget);
        budget = selectedBudgetOption ? selectedBudgetOption.value : 0;
      }
      
      // Simuler l'upload des fichiers en URL
      const fileUrls = attachments.map(file => URL.createObjectURL(file));
      
      // Créer la demande de devis
      const result = await quoteService.createQuoteRequest(
        values.eventType,
        values.eventDate,
        budget,
        `${values.description}\n\nCouleurs préférées: ${values.preferredColors || 'Non spécifié'}\nFleurs préférées: ${values.preferredFlowers || 'Non spécifié'}\nExigences spéciales: ${values.specialRequirements || 'Non spécifié'}`,
        fileUrls
      );
      
      if (result.success) {
        setSubmittedQuoteId(result.quoteId || null);
        setShowSuccess(true);
        form.reset();
        setAttachments([]);
      } else {
        toast.error("Erreur lors de la soumission du devis", {
          description: result.message,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error submitting quote request:', error);
      toast.error("Une erreur est survenue lors de la soumission du devis");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fonction pour obtenir le délai minimal pour la date
  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };
  
  // Obtenir l'icône pour le type d'événement
  const getEventTypeIcon = (eventTypeId: string) => {
    const eventType = eventTypes.find(type => type.id === eventTypeId);
    return eventType ? eventType.icon : <Star className="w-4 h-4" />;
  };
  
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-16 min-h-screen">
        <div className="container max-w-4xl mx-auto px-4 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-serif mb-4">Demande de Devis Personnalisé</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Pour toutes vos occasions spéciales, nous créons des arrangements floraux sur mesure adaptés à vos besoins et votre budget.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Flower className="mr-2 h-5 w-5 text-primary" />
                    Formulaire de Demande
                  </CardTitle>
                  <CardDescription>
                    Parlez-nous de votre projet et de vos besoins floraux
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Type d'événement */}
                      <FormField
                        control={form.control}
                        name="eventType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type d'événement *</FormLabel>
                            <div className="mb-2">
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                              >
                                {eventTypes.map((type) => (
                                  <div key={type.id}>
                                    <RadioGroupItem
                                      value={type.id}
                                      id={`event-${type.id}`}
                                      className="peer sr-only"
                                    />
                                    <Label
                                      htmlFor={`event-${type.id}`}
                                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer [&:has([data-state=checked])]:border-primary"
                                    >
                                      <div className="p-2 rounded-full bg-primary/10 mb-2">
                                        {type.icon}
                                      </div>
                                      {type.label}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Date de l'événement et délai */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="eventDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date de l'événement *</FormLabel>
                              <FormControl>
                                <div className="flex">
                                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground mt-2.5" />
                                  <Input
                                    type="date"
                                    min={getMinDate()}
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="timeFrame"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Délai de réalisation *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez le délai" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {timeFrames.map((timeFrame) => (
                                    <SelectItem key={timeFrame.id} value={timeFrame.value}>
                                      {timeFrame.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Budget */}
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget estimé *</FormLabel>
                            <div className="mb-2">
                              <RadioGroup
                                onValueChange={handleBudgetChange}
                                value={selectedBudget}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                              >
                                {budgetRanges.map((range) => (
                                  <div key={range.id}>
                                    <RadioGroupItem
                                      value={range.id}
                                      id={`budget-${range.id}`}
                                      className="peer sr-only"
                                    />
                                    <Label
                                      htmlFor={`budget-${range.id}`}
                                      className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer [&:has([data-state=checked])]:border-primary"
                                    >
                                      <div className="flex items-center">
                                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {range.label}
                                      </div>
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                            {showCustomBudget && (
                              <FormField
                                control={form.control}
                                name="customBudget"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <div className="flex">
                                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground mt-2.5" />
                                        <Input
                                          placeholder="Entrez votre budget personnalisé"
                                          {...field}
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Description du projet */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description de votre projet *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Décrivez votre événement, vos besoins et vos attentes..."
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Parlez-nous de votre vision, du style souhaité, du nombre d'arrangements, etc.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Détails supplémentaires */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Préférences supplémentaires</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="preferredColors"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Couleurs préférées</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ex: Rouge, blanc, or..."
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="preferredFlowers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fleurs préférées</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ex: Roses, lys, orchidées..."
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="specialRequirements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exigences ou instructions spéciales</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: Allergies, thème spécifique, contraintes de livraison..."
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Upload de photos */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">Photos d'inspiration (facultatif)</h3>
                          <span className="text-xs text-muted-foreground">
                            {attachments.length}/5 fichiers
                          </span>
                        </div>
                        
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" /> {/* Changed from FileUpload to Upload */}
                          <p className="text-sm mb-2">Déposez vos images ici ou</p>
                          <div className="flex items-center justify-center">
                            <Label
                              htmlFor="file-upload"
                              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
                            >
                              Parcourir
                            </Label>
                            <Input
                              id="file-upload"
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                              disabled={attachments.length >= 5}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            PNG, JPG, ou GIF. 5 MB max par fichier.
                          </p>
                        </div>
                        
                        {/* Liste des fichiers */}
                        {attachments.length > 0 && (
                          <div className="space-y-2">
                            {attachments.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-muted/30 p-2 rounded-md"
                              >
                                <div className="flex items-center">
                                  <div className="w-10 h-10 mr-2 rounded-md overflow-hidden bg-muted">
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={`Aperçu ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="text-sm truncate max-w-xs">
                                    <p className="font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <AlertCircle size={16} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      {/* Coordonnées */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Vos coordonnées</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom complet *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Votre nom"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="votre.email@exemple.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="+237 691234567"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Acceptation des conditions */}
                      <FormField
                        control={form.control}
                        name="termsAccepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                J'accepte les conditions générales de service *
                              </FormLabel>
                              <FormDescription>
                                En soumettant ce formulaire, vous acceptez notre <a href="#" className="text-primary hover:underline">politique de confidentialité</a> et nos <a href="#" className="text-primary hover:underline">conditions d'utilisation</a>.
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="submit"
                        className="w-full mt-6"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                            Traitement en cours...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Send className="mr-2 h-4 w-4" />
                            Soumettre ma demande
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            {/* Panneau latéral */}
            <div className="space-y-6">
              {/* Carte d'information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Info className="mr-2 h-5 w-5 text-primary" />
                    Comment ça marche
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-medium text-primary">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Demande</h4>
                      <p className="text-sm text-muted-foreground">
                        Remplissez le formulaire avec tous les détails de votre projet
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-medium text-primary">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Consultation</h4>
                      <p className="text-sm text-muted-foreground">
                        Notre équipe analyse votre projet et vous contacte pour préciser vos besoins
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-medium text-primary">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Proposition</h4>
                      <p className="text-sm text-muted-foreground">
                        Vous recevez un devis détaillé avec les suggestions adaptées à votre événement
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-medium text-primary">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Réalisation</h4>
                      <p className="text-sm text-muted-foreground">
                        Après validation, nous préparons et livrons votre commande selon vos spécifications
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Carte de délais */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-primary" />
                    Délais de traitement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Réponse initiale</span>
                    <span className="text-sm font-medium">24-48h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Proposition de devis</span>
                    <span className="text-sm font-medium">3-5 jours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Validité du devis</span>
                    <span className="text-sm font-medium">15 jours</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* FAQs */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Questions fréquentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="faq-1">
                      <AccordionTrigger className="text-sm">
                        Y a-t-il des frais pour demander un devis ?
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        Non, le service de demande de devis est entièrement gratuit et sans engagement. Vous ne payez que si vous décidez d'accepter notre proposition.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="faq-2">
                      <AccordionTrigger className="text-sm">
                        Combien de temps à l'avance dois-je demander un devis ?
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        Pour les événements de grande envergure, nous recommandons de faire une demande au moins 3-4 semaines à l'avance. Pour les petites commandes, 1-2 semaines suffisent généralement. Des options urgentes sont disponibles avec des frais supplémentaires.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="faq-3">
                      <AccordionTrigger className="text-sm">
                        Proposez-vous un service d'installation ?
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        Oui, nous offrons un service complet d'installation et de mise en place pour les mariages et événements d'entreprise. Ce service sera inclus dans votre devis si vous le demandez.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="faq-4">
                      <AccordionTrigger className="text-sm">
                        Puis-je modifier mon devis après réception ?
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        Absolument ! Vous pouvez demander des modifications à votre devis. Nous travaillerons avec vous pour ajuster la proposition en fonction de vos préférences et de votre budget.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
              
              {/* Besoin d'aide ? */}
              <Card>
                <CardContent className="pt-6 text-center">
                  <h3 className="font-medium mb-2">Besoin d'aide ?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Notre équipe est disponible pour vous aider
                  </p>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      asChild
                    >
                      <a href="tel:+237691234567">
                        <Phone size={14} />
                        +237 691 234 567
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      asChild
                    >
                      <a href="mailto:devis@floralie.com">
                        <Mail size={14} />
                        devis@floralie.com
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      {/* Dialogue de succès */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
              Demande envoyée avec succès
            </DialogTitle>
            <DialogDescription>
              Votre demande de devis a été enregistrée et sera traitée prochainement.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 p-4 rounded-lg mt-2">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm font-medium">
                Référence de demande: #{submittedQuoteId?.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center mt-2">
              <Clock className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm">
                Vous recevrez une réponse dans 24-48 heures.
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <Button
              onClick={() => navigate('/account/quotes')}
              className="w-full gap-2"
            >
              Suivre mes demandes
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccess(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full"
            >
              Faire une autre demande
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </>
  );
};

export default QuoteRequest;