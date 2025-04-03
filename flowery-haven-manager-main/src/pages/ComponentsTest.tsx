// src/pages/ComponentsTest.tsx
import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ComponentRenderer from "@/components/cms/ComponentRenderer";

// Page de test pour visualiser tous les composants disponibles
const ComponentsTest: React.FC = () => {
  const [activeTab, setActiveTab] = useState("banner");

  // Exemples de composants CMS
  const components = {
    banner: {
      type: "banner",
      content: {
        title: "Bienvenue chez Flowery Haven",
        subtitle: "Des fleurs qui racontent votre histoire",
        image: "https://images.unsplash.com/photo-1523694576729-787d637408d9?q=80&w=1974&auto=format&fit=crop",
        buttonText: "Découvrir nos collections",
        buttonLink: "/collections"
      },
      settings: {
        fullWidth: true,
        height: "large",
        textColor: "#ffffff"
      }
    },
    promotion: {
      type: "promotion",
      content: {
        title: "Promotion de printemps",
        subtitle: "Offre spéciale pour célébrer l'arrivée des beaux jours",
        description: "Profitez de 20% de réduction sur toutes nos compositions florales printanières.",
        image: "https://images.unsplash.com/photo-1558603668-6570496b8f18?q=80&w=1932&auto=format&fit=crop",
        backgroundColor: "#ff6b6b",
        textColor: "#ffffff",
        ctaText: "En profiter",
        ctaLink: "/promotions/printemps",
        discount: "-20%",
        expiryDate: "2025-06-30"
      },
      settings: {
        fullWidth: true,
        layout: "horizontal",
        rounded: true,
        showBadge: true,
        badgeText: "PROMO",
        animateBadge: true
      }
    },
    slider: {
      type: "slider",
      content: {
        slides: [
          {
            title: "Bouquets de mariages",
            description: "Des compositions élégantes pour votre jour spécial",
            image: "https://images.unsplash.com/photo-1567696911980-2c895be7a6dc?q=80&w=1974&auto=format&fit=crop"
          },
          {
            title: "Plantes d'intérieur",
            description: "Apportez de la vie à votre espace",
            image: "https://images.unsplash.com/photo-1463320898484-cdee8141c787?q=80&w=2070&auto=format&fit=crop"
          },
          {
            title: "Compositions événementielles",
            description: "Sublimez vos événements professionnels",
            image: "https://images.unsplash.com/photo-1561924582-e0f44dd6a8b9?q=80&w=1776&auto=format&fit=crop"
          }
        ]
      },
      settings: {
        autoplay: true,
        interval: 5000,
        showDots: true
      }
    },
    text: {
      type: "text",
      content: {
        title: "Notre histoire",
        subtitle: "Passion & Savoir-faire",
        text: "<p>Fondée en 2016, Flowery Haven est née d'une passion pour l'art floral et le désir de créer des compositions uniques qui racontent une histoire. Notre équipe de fleuristes talentueux combine créativité et expertise pour transformer chaque événement en une expérience mémorable.</p><p>Nous sélectionnons avec soin des fleurs de qualité exceptionnelle, en privilégiant les producteurs locaux et les pratiques durables. Chaque création est réalisée avec amour et attention aux détails, pour vous offrir ce qu'il y a de meilleur.</p>",
        alignment: "left"
      },
      settings: {
        fullWidth: false,
        backgroundColor: "#f8f9fa",
        textColor: "#212529",
        padding: true,
        maxWidth: "lg"
      }
    },
    newsletter: {
      type: "newsletter",
      content: {
        title: "Restez informé",
        description: "Inscrivez-vous à notre newsletter pour recevoir nos dernières offres et actualités",
        buttonText: "S'abonner"
      },
      settings: {
        layout: "stacked",
        backgroundColor: "#e9ecef"
      }
    },
    image: {
      type: "image",
      content: {
        src: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=2070&auto=format&fit=crop",
        alt: "Bouquet de fleurs",
        caption: "Notre collection de printemps 2025"
      },
      settings: {
        fullWidth: false,
        width: "auto",
        borderRadius: "8",
        shadow: true
      }
    },
    video: {
      type: "video",
      content: {
        url: "https://www.youtube.com/watch?v=hLvWy2b857I",
        title: "Conseils d'entretien pour vos fleurs",
        caption: "Découvrez nos astuces pour prolonger la vie de vos fleurs coupées"
      },
      settings: {
        fullWidth: false,
        aspectRatio: "16:9"
      }
    },
    html: {
      type: "html",
      content: {
        html: `<div style="text-align: center; padding: 40px 20px; background-color: #f0f8ff; border-radius: 10px;">
          <h2 style="color: #4a6baf; margin-bottom: 20px;">Testez nos services personnalisés</h2>
          <p style="color: #555;">Nous proposons des arrangements floraux sur mesure pour tous vos événements.</p>
          <a href="/contact" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #4a6baf; color: white; text-decoration: none; border-radius: 5px;">Contactez-nous</a>
        </div>`
      },
      settings: {
        fullWidth: false,
        padding: true
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Test des composants CMS</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Visualiseur de composants</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 md:grid-cols-8 mb-8">
                <TabsTrigger value="banner">Bannière</TabsTrigger>
                <TabsTrigger value="promotion">Promotion</TabsTrigger>
                <TabsTrigger value="slider">Slider</TabsTrigger>
                <TabsTrigger value="text">Texte</TabsTrigger>
                <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
                <TabsTrigger value="image">Image</TabsTrigger>
                <TabsTrigger value="video">Vidéo</TabsTrigger>
                <TabsTrigger value="html">HTML</TabsTrigger>
              </TabsList>

              {Object.entries(components).map(([key, component]) => (
                <TabsContent key={key} value={key} className="border-t pt-6">
                  <div className="mb-4 p-2 bg-gray-100 rounded">
                    <h3 className="font-bold mb-2">Composant: {key}</h3>
                    <pre className="text-xs overflow-auto p-2 bg-gray-800 text-white rounded">
                      {JSON.stringify(component, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="border border-dashed border-gray-300 p-4 rounded-lg mb-4">
                    <ComponentRenderer
                      type={component.type}
                      content={component.content}
                      settings={component.settings}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default ComponentsTest;