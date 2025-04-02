/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-expressions */
// src/pages/Checkout.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cartService } from "@/services/cart.service";
import { orderService, OrderAddress } from "@/services/order.service";
import { authService } from "@/services/auth.service";
import {
  CreditCard,
  CheckCircle2,
  User,
  MapPin,
  Truck,
  DollarSign,
  ChevronRight,
  Shield,
  ArrowLeft,
  Clock,
  Plus,
  CornerDownRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { useToast } from "@/components/ui/use-toast";

// Définir les étapes du paiement
type CheckoutStep = "information" | "shipping" | "payment" | "review";

const formatCardNumber = (value) => {
  if (!value) return value;

  // Supprimer tous les caractères non numériques
  const v = value.replace(/\D/g, "");

  // Ajouter un espace tous les 4 chiffres
  const formatted = v.replace(/(\d{4})(?=\d)/g, "$1 ");

  return formatted;
};

const formatExpiryDate = (value) => {
  if (!value) return value;

  // Supprimer tous les caractères non numériques
  const v = value.replace(/\D/g, "");

  // Ne garder que les 4 premiers chiffres
  const cleaned = v.slice(0, 4);

  // Ajouter un slash après les 2 premiers chiffres
  if (cleaned.length > 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  }

  return cleaned;
};

const useFormattedExpiryInput = (onChange) => {
  const handleChange = (e) => {
    const input = e.target.value;
    const formatted = formatExpiryDate(input);

    // Mettre à jour l'input avec la valeur formatée
    e.target.value = formatted;

    // Appeler le onChange original avec la valeur formatée
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    onChange && onChange(e);
  };

  return handleChange;
};

const formatCVC = (value) => {
  if (!value) return value;

  // Supprimer tous les caractères non numériques
  const v = value.replace(/\D/g, "");

  // Limiter à 4 chiffres maximum (pour Amex qui a des CVC à 4 chiffres)
  return v.slice(0, 4);
};

const useFormattedCVCInput = (onChange) => {
  const handleChange = (e) => {
    const input = e.target.value;
    const formatted = formatCVC(input);

    // Mettre à jour l'input avec la valeur formatée
    e.target.value = formatted;

    // Appeler le onChange original avec la valeur formatée
    onChange && onChange(e);
  };

  return handleChange;
};

const selectedFieldStyle = "border-primary bg-primary/5";

const useFormattedCardInput = (onChange) => {
  const handleChange = (e) => {
    const input = e.target.value;
    const formatted = formatCardNumber(input);

    // Mettre à jour l'input avec la valeur formatée
    e.target.value = formatted;

    // Appeler le onChange original avec la valeur formatée
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    onChange && onChange(e);
  };

  return handleChange;
};

// Schéma de validation pour l'adresse
const addressSchema = z.object({
  firstName: z.string().min(2, "Le prénom est requis"),
  lastName: z.string().min(2, "Le nom est requis"),
  address: z.string().min(5, "L'adresse est requise"),
  address2: z.string().optional(),
  city: z.string().min(2, "La ville est requise"),
  state: z.string().min(2, "La province est requise"),
  postalCode: z.string().min(4, "Le code postal est requis"),
  country: z.string().min(2, "Le pays est requis"),
  phone: z.string().min(8, "Le numéro de téléphone est requis"),
  isDefault: z.boolean().optional(),
});

const paymentSchema = z.object({
  method: z.enum(["card", "paypal", "transfer", "cash"]),
  cardNumber: z.string()
    .optional()
    .refine(val => !val || val.replace(/\s/g, '').length === 16, {
      message: "Le numéro de carte doit contenir 16 chiffres"
    }),
  cardExpiry: z.string()
    .optional()
    .refine(val => !val || /^\d{2}\/\d{2}$/.test(val), {
      message: "Format invalide. Utilisez MM/AA"
    }),
  cardCvc: z.string()
    .optional()
    .refine(val => !val || (val.length >= 3 && val.length <= 4), {
      message: "Le CVC doit contenir 3 ou 4 chiffres"
    }),
  cardName: z.string().optional(),
  saveCard: z.boolean().optional(),
  sameAsBilling: z.boolean(),
});

const Checkout = () => {
  const navigate = useNavigate();
  const { toast: hookToast } = useToast();

  // États pour les différentes sections du paiement
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("information");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totals, setTotals] = useState({
    subtotal: 0,
    shipping: 0,
    discount: 0,
    total: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<OrderAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "paypal" | "transfer" | "cash"
  >("card");

  // Formulaires
  const addressForm = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Cameroun",
      phone: "",
      isDefault: false,
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: "card",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      cardName: "",
      saveCard: false,
      sameAsBilling: true,
    },
  });

  // Charger les données nécessaires
  useEffect(() => {
    const loadCheckoutData = async () => {
      setIsLoading(true);

      try {
        // Vérifier l'authentification
        if (!authService.isAuthenticated()) {
          navigate("/auth/login?redirect=/checkout");
          return;
        }

        // Récupérer les données utilisateur
        const user = authService.getCurrentUser();
        setUserData(user);

        // Pré-remplir le formulaire avec les données utilisateur
        if (user) {
          addressForm.setValue("firstName", user.firstName || "");
          addressForm.setValue("lastName", user.lastName || "");
          addressForm.setValue("phone", user.phone || "");
        }

        // Charger le panier
        const items = await cartService.getCart();
        if (items.length === 0) {
          toast.error("Votre panier est vide");
          navigate("/cart");
          return;
        }
        setCartItems(items);

        // Charger les totaux
        const cartTotals = await cartService.getFinalTotal();
        setTotals(cartTotals);

        // Charger la méthode de livraison
        const method = await cartService.getSelectedShippingMethod();
        if (!method) {
          toast.error("Aucune méthode de livraison sélectionnée");
          navigate("/cart");
          return;
        }
        setShippingMethod(method);

        // Charger les adresses sauvegardées (simulation)
        const mockAddresses: OrderAddress[] = [
          {
            firstName: user?.firstName || "John",
            lastName: user?.lastName || "Doe",
            address: "123 Rue Principale",
            city: "Yaoundé",
            state: "Centre",
            postalCode: "12345",
            country: "Cameroun",
            phone: "+237 691234567",
            isDefault: true,
          },
          {
            firstName: user?.firstName || "John",
            lastName: user?.lastName || "Doe",
            address: "456 Avenue des Fleurs",
            city: "Douala",
            state: "Littoral",
            postalCode: "54321",
            country: "Cameroun",
            phone: "+237 691234567",
            isDefault: false,
          },
        ];
        setSavedAddresses(mockAddresses);
      } catch (error) {
        console.error("Error loading checkout data:", error);
        toast.error("Erreur lors du chargement des données");
        navigate("/cart");
      } finally {
        setIsLoading(false);
      }
    };

    loadCheckoutData();
  }, [navigate]);

  // Gestion des étapes du paiement
  const goToNextStep = () => {
    switch (currentStep) {
      case "information":
        setCurrentStep("shipping");
        break;
      case "shipping":
        setCurrentStep("payment");
        break;
      case "payment":
        setCurrentStep("review");
        break;
      default:
        break;
    }
    // Scroller en haut de la page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPreviousStep = () => {
    switch (currentStep) {
      case "shipping":
        setCurrentStep("information");
        break;
      case "payment":
        setCurrentStep("shipping");
        break;
      case "review":
        setCurrentStep("payment");
        break;
      default:
        break;
    }
    // Scroller en haut de la page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sélectionner une adresse sauvegardée
  const handleSelectAddress = (addressIndex: number) => {
    const address = savedAddresses[addressIndex];

    addressForm.setValue("firstName", address.firstName);
    addressForm.setValue("lastName", address.lastName);
    addressForm.setValue("address", address.address);
    addressForm.setValue("address2", address.address2 || "");
    addressForm.setValue("city", address.city);
    addressForm.setValue("state", address.state);
    addressForm.setValue("postalCode", address.postalCode);
    addressForm.setValue("country", address.country);
    addressForm.setValue("phone", address.phone);

    setSelectedAddress(`saved-${addressIndex}`);
  };

  // Soumission du formulaire d'adresse
  const onAddressSubmit = () => {
    goToNextStep();
  };

  // Soumission du formulaire de paiement
  const onPaymentSubmit = (values: z.infer<typeof paymentSchema>) => {
    setPaymentMethod(values.method);
    goToNextStep();
  };

  // Finaliser la commande
  const placeOrder = async () => {
    setIsProcessing(true);

    try {
      // Créer l'objet adresse
      const shippingAddress: OrderAddress = {
        firstName: addressForm.getValues("firstName"),
        lastName: addressForm.getValues("lastName"),
        address: addressForm.getValues("address"),
        address2: addressForm.getValues("address2"),
        city: addressForm.getValues("city"),
        state: addressForm.getValues("state"),
        postalCode: addressForm.getValues("postalCode"),
        country: addressForm.getValues("country"),
        phone: addressForm.getValues("phone"),
      };

      // Créer la commande
      const result = await orderService.createOrder(
        shippingAddress,
        paymentForm.getValues("sameAsBilling") ? shippingAddress : null,
        paymentMethod
      );

      if (result.success) {
        // Rediriger vers la page de confirmation
        hookToast({
          title: "Commande passée avec succès",
          description: `Votre commande #${result.orderId} a été créée`,
        });

        navigate(`/order-confirmation/${result.orderId}`);
      } else {
        toast.error("Erreur", {
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(
        "Une erreur est survenue lors de la création de votre commande"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Afficher un chargement si les données sont en cours de chargement
  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-16 min-h-screen">
          <div className="container max-w-6xl mx-auto px-4 lg:px-8 flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-16 min-h-screen">
        <div className="container max-w-6xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Steps */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h1 className="text-3xl font-serif mb-2">Paiement</h1>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto font-normal hover:bg-transparent hover:underline"
                    onClick={() => navigate("/cart")}
                  >
                    <ArrowLeft size={14} className="mr-1" />
                    Retour au panier
                  </Button>
                </div>
              </div>

              {/* Étapes visuelles du processus */}
              <div className="mb-8">
                <div className="relative flex justify-between">
                  {["information", "shipping", "payment", "review"].map(
                    (step, index) => (
                      <div
                        key={step}
                        className="flex flex-col items-center z-10"
                      >
                        <div
                          className={`
                        w-10 h-10 rounded-full flex items-center justify-center 
                        ${
                          currentStep === step
                            ? "bg-primary text-primary-foreground"
                            : (currentStep === "shipping" &&
                                step === "information") ||
                              (currentStep === "payment" &&
                                ["information", "shipping"].includes(step)) ||
                              currentStep === "review"
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }
                      `}
                        >
                          {currentStep === step ? (
                            index + 1
                          ) : (currentStep === "shipping" &&
                              step === "information") ||
                            (currentStep === "payment" &&
                              ["information", "shipping"].includes(step)) ||
                            (currentStep === "review" &&
                              ["information", "shipping", "payment"].includes(
                                step
                              )) ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span
                          className={`
                        text-xs mt-2 
                        ${
                          currentStep === step
                            ? "font-medium"
                            : (currentStep === "shipping" &&
                                step === "information") ||
                              (currentStep === "payment" &&
                                ["information", "shipping"].includes(step)) ||
                              currentStep === "review"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      `}
                        >
                          {step === "information" && "Informations"}
                          {step === "shipping" && "Livraison"}
                          {step === "payment" && "Paiement"}
                          {step === "review" && "Vérification"}
                        </span>
                      </div>
                    )
                  )}

                  {/* Ligne de progression */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10"></div>
                  <div
                    className={`absolute top-5 left-0 h-0.5 bg-primary transition-all duration-300 -z-10`}
                    style={{
                      width:
                        currentStep === "information"
                          ? "0%"
                          : currentStep === "shipping"
                          ? "33.3%"
                          : currentStep === "payment"
                          ? "66.6%"
                          : "100%",
                    }}
                  ></div>
                </div>
              </div>

              {/* Étape 1: Informations client */}
              {currentStep === "information" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User size={18} className="mr-2" />
                      Informations client
                    </CardTitle>
                    <CardDescription>
                      Entrez vos coordonnées pour la livraison
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Adresses sauvegardées */}
                    {savedAddresses.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium mb-3">
                          Adresses sauvegardées
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {savedAddresses.map((address, index) => (
                            <div
                              key={index}
                              className={`
                                border rounded-lg p-4 cursor-pointer transition-all hover:border-primary
                                ${
                                  selectedAddress === `saved-${index}`
                                    ? "border-primary bg-primary/5"
                                    : "border-border"
                                }
                              `}
                              onClick={() => handleSelectAddress(index)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">
                                    {address.firstName} {address.lastName}
                                    {address.isDefault && (
                                      <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                        Par défaut
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {address.address}
                                    {address.address2 && (
                                      <>, {address.address2}</>
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {address.postalCode} {address.city},{" "}
                                    {address.state}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {address.country}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {address.phone}
                                  </p>
                                </div>

                                {selectedAddress === `saved-${index}` && (
                                  <CheckCircle2
                                    size={18}
                                    className="text-primary"
                                  />
                                )}
                              </div>
                            </div>
                          ))}

                          <div
                            key="new-address"
                            className={`
                                border rounded-lg p-4 cursor-pointer transition-all
                                ${
                                  selectedAddress === "new-address"
                                    ? selectedFieldStyle
                                    : "border-border hover:border-primary"
                                }
                              `}
                            onClick={() => {
                              addressForm.reset({
                                firstName: userData?.firstName || "",
                                lastName: userData?.lastName || "",
                                phone: userData?.phone || "",
                                country: "Cameroun",
                              });
                              setSelectedAddress("new-address");
                            }}
                          >
                            <div className="text-center">
                              <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                                <Plus
                                  size={18}
                                  className="text-muted-foreground"
                                />
                              </div>
                              <p className="font-medium">Nouvelle adresse</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Formulaire d'adresse */}
                    <Form {...addressForm}>
                      <form
                        onSubmit={addressForm.handleSubmit(onAddressSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={addressForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prénom *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Votre prénom"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addressForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Votre nom" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={addressForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresse *</FormLabel>
                              <FormControl>
                                <Input placeholder="Numéro et rue" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={addressForm.control}
                          name="address2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Complément d'adresse</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Appartement, étage, etc."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={addressForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ville *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Votre ville" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addressForm.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Province/Région *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Province ou région"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={addressForm.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Code postal *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Code postal" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addressForm.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pays *</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez un pays" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Cameroun">
                                      Cameroun
                                    </SelectItem>
                                    <SelectItem value="Gabon">Gabon</SelectItem>
                                    <SelectItem value="Congo">Congo</SelectItem>
                                    <SelectItem value="Tchad">Tchad</SelectItem>
                                    <SelectItem value="République centrafricaine">
                                      République centrafricaine
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={addressForm.control}
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

                        <FormField
                          control={addressForm.control}
                          name="isDefault"
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
                                  Définir comme adresse par défaut
                                </FormLabel>
                                <FormDescription>
                                  Cette adresse sera utilisée par défaut pour
                                  vos prochaines commandes
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => navigate("/cart")}>
                      Retour au panier
                    </Button>
                    <Button onClick={addressForm.handleSubmit(onAddressSubmit)}>
                      Continuer vers la livraison
                      <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* Étape 2: Méthodes de livraison */}
              {currentStep === "shipping" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Truck size={18} className="mr-2" />
                      Méthode de livraison
                    </CardTitle>
                    <CardDescription>
                      Choisissez comment vous souhaitez recevoir votre commande
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-lg border border-primary bg-primary/5 p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium flex items-center">
                              <CheckCircle2
                                size={16}
                                className="text-primary mr-2"
                              />
                              {shippingMethod.name}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {shippingMethod.description}
                            </p>
                          </div>
                          <div className="font-medium">
                            {shippingMethod.price === 0
                              ? "Gratuit"
                              : `${shippingMethod.price.toFixed(2)} XAF`}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-sm font-medium mb-2">
                          Adresse de livraison
                        </h3>
                        <div className="rounded-lg border p-4">
                          <p className="font-medium">
                            {addressForm.getValues("firstName")}{" "}
                            {addressForm.getValues("lastName")}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {addressForm.getValues("address")}
                            {addressForm.getValues("address2") && (
                              <>, {addressForm.getValues("address2")}</>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {addressForm.getValues("postalCode")}{" "}
                            {addressForm.getValues("city")},{" "}
                            {addressForm.getValues("state")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {addressForm.getValues("country")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {addressForm.getValues("phone")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        <h3 className="text-sm font-medium">
                          Informations complémentaires
                        </h3>

                        <Accordion type="single" collapsible>
                          <AccordionItem value="delivery-notes">
                            <AccordionTrigger className="text-sm">
                              Instructions de livraison (facultatif)
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  Vous pouvez ajouter des instructions
                                  spécifiques pour la livraison de votre
                                  commande.
                                </p>
                                <textarea
                                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  placeholder="Instructions pour le livreur (code d'entrée, étage, etc.)"
                                ></textarea>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={goToPreviousStep}>
                      Retour
                    </Button>
                    <Button onClick={goToNextStep}>
                      Continuer vers le paiement
                      <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* Étape 3: Méthodes de paiement */}
              {currentStep === "payment" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard size={18} className="mr-2" />
                      Méthode de paiement
                    </CardTitle>
                    <CardDescription>
                      Choisissez comment vous souhaitez payer votre commande
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...paymentForm}>
                      <form
                        onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}
                        className="space-y-6"
                      >
                        <FormField
                          control={paymentForm.control}
                          name="method"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Méthode de paiement</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="space-y-3"
                                >
                                  <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem
                                      value="card"
                                      id="payment-card"
                                    />
                                    <Label
                                      htmlFor="payment-card"
                                      className="flex-1 cursor-pointer"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          <CreditCard
                                            size={18}
                                            className="mr-2"
                                          />
                                          <span>Carte bancaire</span>
                                        </div>
                                        <div className="flex space-x-1">
                                          <svg
                                            className="h-6"
                                            viewBox="0 0 48 48"
                                            fill="none"
                                          >
                                            <rect
                                              width="48"
                                              height="32"
                                              rx="4"
                                              fill="#1A1F71"
                                            />
                                            <path
                                              d="M18.5 21L16 27H13L15.5 21H18.5Z"
                                              fill="#FFFFFF"
                                            />
                                            <path
                                              d="M26 21L23.5 27H20.5L23 21H26Z"
                                              fill="#FFFFFF"
                                            />
                                            <path
                                              d="M32 21L30 24.5L28.5 21H25.5L28.5 27H31.5L35 21H32Z"
                                              fill="#FFFFFF"
                                            />
                                          </svg>
                                          <svg
                                            className="h-6"
                                            viewBox="0 0 48 48"
                                            fill="none"
                                          >
                                            <rect
                                              width="48"
                                              height="32"
                                              rx="4"
                                              fill="#EB001B"
                                              fillOpacity="0.15"
                                            />
                                            <circle
                                              cx="16"
                                              cy="16"
                                              r="10"
                                              fill="#EB001B"
                                            />
                                            <circle
                                              cx="32"
                                              cy="16"
                                              r="10"
                                              fill="#F79E1B"
                                            />
                                            <path
                                              fillRule="evenodd"
                                              clipRule="evenodd"
                                              d="M24 22C26.2091 19.7909 26.2091 16.2091 24 14C21.7909 16.2091 21.7909 19.7909 24 22Z"
                                              fill="#FF5F00"
                                            />
                                          </svg>
                                        </div>
                                      </div>
                                    </Label>
                                  </div>

                                  <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem
                                      value="paypal"
                                      id="payment-paypal"
                                    />
                                    <Label
                                      htmlFor="payment-paypal"
                                      className="flex-1 cursor-pointer"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          <img
                                            src="/path/to/paypal.png"
                                            alt="PayPal"
                                            className="h-5 mr-2"
                                          />
                                          <span>PayPal</span>
                                        </div>
                                      </div>
                                    </Label>
                                  </div>

                                  <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem
                                      value="transfer"
                                      id="payment-transfer"
                                    />
                                    <Label
                                      htmlFor="payment-transfer"
                                      className="flex-1 cursor-pointer"
                                    >
                                      <div className="flex items-center">
                                        <DollarSign
                                          size={18}
                                          className="mr-2"
                                        />
                                        <span>Virement bancaire</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground ml-7 mt-1">
                                        Les instructions vous seront envoyées
                                        par email
                                      </p>
                                    </Label>
                                  </div>

                                  <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem
                                      value="cash"
                                      id="payment-cash"
                                    />
                                    <Label
                                      htmlFor="payment-cash"
                                      className="flex-1 cursor-pointer"
                                    >
                                      <div className="flex items-center">
                                        <Clock size={18} className="mr-2" />
                                        <span>Paiement à la livraison</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground ml-7 mt-1">
                                        En espèces uniquement, préparez
                                        l'appoint
                                      </p>
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Champs pour carte bancaire */}
                        {paymentForm.watch("method") === "card" && (
                          <div className="space-y-6">
                            <FormField
                              control={paymentForm.control}
                              name="cardName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nom sur la carte</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={paymentForm.control}
                              name="cardNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Numéro de carte</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        placeholder="1234 5678 9012 3456"
                                        maxLength={19} // 16 chiffres + 3 espaces
                                        onChange={useFormattedCardInput(
                                          field.onChange
                                        )}
                                        onBlur={field.onBlur}
                                        value={field.value || ""}
                                        name={field.name}
                                        className={`pr-10 ${
                                          field.value
                                            ? "border-primary focus:border-primary"
                                            : ""
                                        }`}
                                      />
                                      {field.value &&
                                        field.value.replace(/\s/g, "")
                                          .length === 16 && (
                                          <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                                        )}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-2 gap-6">
                              <FormField
                                control={paymentForm.control}
                                name="cardExpiry"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Date d'expiration</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Input
                                          placeholder="MM/AA"
                                          maxLength={5}
                                          onChange={useFormattedExpiryInput(
                                            field.onChange
                                          )}
                                          onBlur={field.onBlur}
                                          value={field.value || ""}
                                          name={field.name}
                                          className={
                                            field.value
                                              ? "border-primary focus:border-primary"
                                              : ""
                                          }
                                        />
                                        {field.value &&
                                          field.value.length === 5 && (
                                            <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                                          )}
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={paymentForm.control}
                                name="cardCvc"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>CVC</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Input
                                          placeholder="123"
                                          maxLength={4}
                                          onChange={useFormattedCVCInput(
                                            field.onChange
                                          )}
                                          onBlur={field.onBlur}
                                          value={field.value || ""}
                                          name={field.name}
                                          className={
                                            field.value &&
                                            field.value.length >= 3
                                              ? "border-primary focus:border-primary"
                                              : ""
                                          }
                                        />
                                        {field.value &&
                                          field.value.length >= 3 && (
                                            <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                                          )}
                                      </div>
                                    </FormControl>
                                    <FormDescription className="text-xs flex items-center mt-1">
                                      <Shield size={12} className="mr-1" />
                                      Code de sécurité au dos de la carte
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={paymentForm.control}
                              name="saveCard"
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
                                      Sauvegarder ma carte pour mes prochains
                                      achats
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}

                        <FormField
                          control={paymentForm.control}
                          name="sameAsBilling"
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
                                  L'adresse de facturation est identique à
                                  l'adresse de livraison
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
                          <Shield size={14} className="mr-2" />
                          Paiement sécurisé et chiffré
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={goToPreviousStep}>
                      Retour
                    </Button>
                    <Button onClick={paymentForm.handleSubmit(onPaymentSubmit)}>
                      Vérifier la commande
                      <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* Étape 4: Récapitulatif et confirmation */}
              {currentStep === "review" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle2 size={18} className="mr-2" />
                      Vérification de la commande
                    </CardTitle>
                    <CardDescription>
                      Vérifiez les détails de votre commande avant de la
                      confirmer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Récapitulatif des articles */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">
                        Articles ({cartItems.length})
                      </h3>
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {item.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Quantité: {item.quantity}
                              </p>

                              {/* Options du produit (si présentes) */}
                              {item.options &&
                                Object.keys(item.options).length > 0 && (
                                  <div className="mt-1 space-y-1">
                                    {Object.entries(item.options).map(
                                      ([key, value]) => (
                                        <div
                                          key={key}
                                          className="flex items-center text-xs text-muted-foreground"
                                        >
                                          <CornerDownRight
                                            size={12}
                                            className="mr-1"
                                          />
                                          <span className="capitalize">
                                            {key}:
                                          </span>
                                          <span className="ml-1 font-medium">
                                            {value}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {item.quantity * item.price.toFixed(2)} XAF
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between font-medium text-lg items-center">
                          <span>Total</span>
                          <span className="text-xl text-primary font-bold">
                            {totals.total.toFixed(2)} XAF
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Récapitulatif de livraison */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Livraison</h3>
                      <div className="rounded-lg border p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {shippingMethod.name}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {shippingMethod.description}
                            </p>
                          </div>
                          <div className="font-medium">
                            {shippingMethod.price === 0
                              ? "Gratuit"
                              : `${shippingMethod.price.toFixed(2)} XAF`}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-xs text-muted-foreground uppercase mb-2">
                          Adresse de livraison
                        </h4>
                        <div className="text-sm">
                          <p className="font-medium">
                            {addressForm.getValues("firstName")}{" "}
                            {addressForm.getValues("lastName")}
                          </p>
                          <p className="text-muted-foreground">
                            {addressForm.getValues("address")}
                            {addressForm.getValues("address2") && (
                              <>, {addressForm.getValues("address2")}</>
                            )}
                          </p>
                          <p className="text-muted-foreground">
                            {addressForm.getValues("postalCode")}{" "}
                            {addressForm.getValues("city")},{" "}
                            {addressForm.getValues("state")}
                          </p>
                          <p className="text-muted-foreground">
                            {addressForm.getValues("country")}
                          </p>
                          <p className="text-muted-foreground">
                            {addressForm.getValues("phone")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Récapitulatif du paiement */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Paiement</h3>
                      <div className="rounded-lg border p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium flex items-center">
                              {paymentMethod === "card" && (
                                <CreditCard size={16} className="mr-2" />
                              )}
                              {paymentMethod === "paypal" && (
                                <img
                                  src="/path/to/paypal.png"
                                  alt="PayPal"
                                  className="h-4 mr-2"
                                />
                              )}
                              {paymentMethod === "transfer" && (
                                <DollarSign size={16} className="mr-2" />
                              )}
                              {paymentMethod === "cash" && (
                                <Clock size={16} className="mr-2" />
                              )}

                              {paymentMethod === "card" && "Carte bancaire"}
                              {paymentMethod === "paypal" && "PayPal"}
                              {paymentMethod === "transfer" &&
                                "Virement bancaire"}
                              {paymentMethod === "cash" &&
                                "Paiement à la livraison"}
                            </div>

                            {paymentMethod === "card" && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Carte se terminant par{" "}
                                {paymentForm
                                  .getValues("cardNumber")
                                  ?.slice(-4) || "****"}
                              </p>
                            )}

                            {paymentMethod === "transfer" && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Les instructions vous seront envoyées par email
                              </p>
                            )}

                            {paymentMethod === "cash" && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Préparez l'appoint lors de la livraison
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {!paymentForm.getValues("sameAsBilling") && (
                        <div className="mt-4">
                          <h4 className="text-xs text-muted-foreground uppercase mb-2">
                            Adresse de facturation
                          </h4>
                          <div className="text-sm">
                            <p className="font-medium">
                              {addressForm.getValues("firstName")}{" "}
                              {addressForm.getValues("lastName")}
                            </p>
                            <p className="text-muted-foreground">
                              {addressForm.getValues("address")}
                              {addressForm.getValues("address2") && (
                                <>, {addressForm.getValues("address2")}</>
                              )}
                            </p>
                            <p className="text-muted-foreground">
                              {addressForm.getValues("postalCode")}{" "}
                              {addressForm.getValues("city")},{" "}
                              {addressForm.getValues("state")}
                            </p>
                            <p className="text-muted-foreground">
                              {addressForm.getValues("country")}
                            </p>
                            <p className="text-muted-foreground">
                              {addressForm.getValues("phone")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Conditions générales */}
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox id="terms" />
                        <div className="space-y-1 leading-none">
                          <Label htmlFor="terms">
                            J'accepte les conditions générales de vente
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            En passant commande, vous acceptez nos{" "}
                            <a href="#" className="text-primary underline">
                              Conditions Générales de Vente
                            </a>{" "}
                            et notre{" "}
                            <a href="#" className="text-primary underline">
                              Politique de Confidentialité
                            </a>
                            .
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox id="newsletter" />
                        <div className="space-y-1 leading-none">
                          <Label htmlFor="newsletter">
                            Je souhaite recevoir des offres et actualités par
                            email
                          </Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={goToPreviousStep}>
                      Retour
                    </Button>
                    <Button
                      onClick={placeOrder}
                      disabled={isProcessing}
                      className="gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          Traitement en cours...
                        </>
                      ) : (
                        <>
                          Confirmer et payer
                          <ChevronRight size={16} />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-32">
                <Card>
                  <CardHeader>
                    <CardTitle>Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Sous-total
                        </span>
                        <span>{totals.subtotal.toFixed(2)} XAF</span>
                      </div>

                      {totals.discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Réduction
                          </span>
                          <span className="text-green-600">
                            -{totals.discount.toFixed(2)} XAF
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Livraison</span>
                        <span>
                          {totals.shipping === 0 ? (
                            <span className="text-green-600">Gratuite</span>
                          ) : (
                            `${totals.shipping.toFixed(2)} XAF`
                          )}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span>{totals.total.toFixed(2)} XAF</span>
                    </div>

                    {/* Informations TVA */}
                    <p className="text-xs text-muted-foreground">
                      * Prix TTC. TVA comprise à 20%.
                    </p>
                  </CardContent>

                  {/* Articles résumés */}
                  <CardContent className="pt-0">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="items">
                        <AccordionTrigger className="text-sm">
                          Voir les articles ({cartItems.length})
                        </AccordionTrigger>
                        <AccordionContent>
                          {cartItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between py-2"
                            >
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-md overflow-hidden bg-muted">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="text-sm">
                                  <p className="line-clamp-1">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Qté: {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <div className="text-sm font-medium">
                                {(item.price * item.quantity).toFixed(2)} XAF
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-4">
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      <Shield className="mr-1 h-3 w-3" />
                      <span>Paiement sécurisé et chiffré</span>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Checkout;
