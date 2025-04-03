// src/components/cms/component-mapping.tsx
import React from "react";

// Importation des composants
import BannerComponent from "./components/BannerComponent";
import SliderComponent from "./components/SliderComponent";
import NewsletterComponent from "./components/NewsletterComponent";
import TextComponent from "./components/TextComponent";
import ImageComponent from "./components/ImageComponent";
import VideoComponent from "./components/VideoComponent";
// import FeaturedProductsComponent from "./components/FeaturedProductsComponent";
// import TestimonialsComponent from "./components/TestimonialsComponent";
import HtmlComponent from "./components/HtmlComponent";
import PromotionComponent from "./components/PromotionComponent";

// Définition du type pour les propriétés des composants
export interface ComponentProps {
  content: any;
  settings: any;
}

// Mapping des types de composants aux composants React
const componentMapping: Record<string, React.ComponentType<ComponentProps>> = {
  banner: BannerComponent,
  slider: SliderComponent,
  newsletter: NewsletterComponent,
  text: TextComponent,
  image: ImageComponent,
  video: VideoComponent,
//   featured_products: FeaturedProductsComponent,
//   testimonials: TestimonialsComponent,
  html: HtmlComponent,
  promotion: PromotionComponent,
  // Ajoutez d'autres mappings selon vos besoins
};

export default componentMapping;