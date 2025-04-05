// src/components/cms/editor/ComponentSettings.tsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, CopyIcon, Paintbrush, Cog, Type, Plus, Minus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ComponentItem } from './DragDropEditor';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ComponentSettingsProps {
  component: ComponentItem;
  onChange: (updatedComponent: ComponentItem) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
}

const ComponentSettings: React.FC<ComponentSettingsProps> = ({ 
  component, 
  onChange, 
  onDelete,
  onDuplicate 
}) => {
  const [activeTab, setActiveTab] = useState('content');
  
  // Mettre à jour le contenu du composant
  const handleContentChange = (key: string, value: any) => {
    const updatedComponent: ComponentItem = {
      ...component,
      content: {
        ...component.content,
        [key]: value
      }
    };
    
    onChange(updatedComponent);
  };
  
  // Mettre à jour un champ imbriqué dans le contenu
  const handleNestedContentChange = (parentKey: string, index: number, key: string, value: any) => {
    // Assurer que le tableau existe
    if (!component.content[parentKey] || !Array.isArray(component.content[parentKey])) {
      return;
    }
    
    // Créer une copie du tableau
    const updatedArray = [...component.content[parentKey]];
    
    // Mettre à jour l'élément
    updatedArray[index] = {
      ...updatedArray[index],
      [key]: value
    };
    
    // Mettre à jour le composant
    const updatedComponent: ComponentItem = {
      ...component,
      content: {
        ...component.content,
        [parentKey]: updatedArray
      }
    };
    
    onChange(updatedComponent);
  };
  
  // Ajouter un élément à un tableau dans le contenu
  const handleAddArrayItem = (key: string, defaultItem: any) => {
    // Assurer que le tableau existe
    if (!component.content[key] || !Array.isArray(component.content[key])) {
      return;
    }
    
    // Créer une copie du tableau et ajouter le nouvel élément
    const updatedArray = [...component.content[key], defaultItem];
    
    // Mettre à jour le composant
    const updatedComponent: ComponentItem = {
      ...component,
      content: {
        ...component.content,
        [key]: updatedArray
      }
    };
    
    onChange(updatedComponent);
  };
  
  // Supprimer un élément d'un tableau dans le contenu
  const handleRemoveArrayItem = (key: string, index: number) => {
    // Assurer que le tableau existe
    if (!component.content[key] || !Array.isArray(component.content[key])) {
      return;
    }
    
    // Créer une copie du tableau et supprimer l'élément
    const updatedArray = [...component.content[key]];
    updatedArray.splice(index, 1);
    
    // Mettre à jour le composant
    const updatedComponent: ComponentItem = {
      ...component,
      content: {
        ...component.content,
        [key]: updatedArray
      }
    };
    
    onChange(updatedComponent);
  };
  
  // Mettre à jour les paramètres du composant
  const handleSettingsChange = (key: string, value: any) => {
    const updatedComponent: ComponentItem = {
      ...component,
      settings: {
        ...component.settings,
        [key]: value
      }
    };
    
    onChange(updatedComponent);
  };
  
  // Fonction de rendu conditionnelle des champs de formulaire en fonction du type de composant
  const renderContentFields = () => {
    switch (component.type) {
      case 'banner':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banner-title">Titre</Label>
              <Input
                id="banner-title"
                value={component.content.title || ""}
                onChange={(e) => handleContentChange("title", e.target.value)}
                placeholder="Titre de la bannière"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-subtitle">Sous-titre</Label>
              <Textarea
                id="banner-subtitle"
                value={component.content.subtitle || ""}
                onChange={(e) => handleContentChange("subtitle", e.target.value)}
                placeholder="Sous-titre de la bannière"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-image">Image (URL)</Label>
              <Input
                id="banner-image"
                value={component.content.image || ""}
                onChange={(e) => handleContentChange("image", e.target.value)}
                placeholder="URL de l'image"
              />
              {component.content.image && (
                <div className="mt-2 relative border rounded-md overflow-hidden aspect-video">
                  <img
                    src={component.content.image}
                    alt="Aperçu"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-button-text">Texte du bouton</Label>
              <Input
                id="banner-button-text"
                value={component.content.buttonText || ""}
                onChange={(e) => handleContentChange("buttonText", e.target.value)}
                placeholder="Texte du bouton"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-button-link">Lien du bouton</Label>
              <Input
                id="banner-button-link"
                value={component.content.buttonLink || ""}
                onChange={(e) => handleContentChange("buttonLink", e.target.value)}
                placeholder="URL du lien"
              />
            </div>
          </div>
        );
        
      case 'slider':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Slides</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddArrayItem("slides", {
                  title: "Nouveau slide",
                  description: "Description du slide",
                  image: "/assets/logo.jpeg",
                  buttonText: "En savoir plus",
                  buttonLink: "/",
                })}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4 mr-1" /> Ajouter un slide
              </Button>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {component.content.slides?.map((slide: any, index: number) => (
                <AccordionItem key={index} value={`slide-${index}`}>
                  <AccordionTrigger className="py-2">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span>Slide {index + 1}</span>
                      <Badge variant="outline" className="ml-2">{slide.title}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor={`slide-${index}-title`}>Titre</Label>
                        <Input
                          id={`slide-${index}-title`}
                          value={slide.title || ""}
                          onChange={(e) => handleNestedContentChange("slides", index, "title", e.target.value)}
                          placeholder="Titre du slide"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`slide-${index}-description`}>Description</Label>
                        <Textarea
                          id={`slide-${index}-description`}
                          value={slide.description || ""}
                          onChange={(e) => handleNestedContentChange("slides", index, "description", e.target.value)}
                          placeholder="Description du slide"
                          rows={2}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`slide-${index}-image`}>Image (URL)</Label>
                        <Input
                          id={`slide-${index}-image`}
                          value={slide.image || ""}
                          onChange={(e) => handleNestedContentChange("slides", index, "image", e.target.value)}
                          placeholder="URL de l'image"
                        />
                        {slide.image && (
                          <div className="mt-2 relative border rounded-md overflow-hidden aspect-video">
                            <img
                              src={slide.image}
                              alt="Aperçu"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`slide-${index}-button-text`}>Texte du bouton</Label>
                        <Input
                          id={`slide-${index}-button-text`}
                          value={slide.buttonText || ""}
                          onChange={(e) => handleNestedContentChange("slides", index, "buttonText", e.target.value)}
                          placeholder="Texte du bouton (optionnel)"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`slide-${index}-button-link`}>Lien du bouton</Label>
                        <Input
                          id={`slide-${index}-button-link`}
                          value={slide.buttonLink || ""}
                          onChange={(e) => handleNestedContentChange("slides", index, "buttonLink", e.target.value)}
                          placeholder="URL du lien (optionnel)"
                        />
                      </div>
                      
                      {component.content.slides.length > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveArrayItem("slides", index)}
                          className="mt-2 h-8"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Supprimer le slide
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        );
        
      case 'promotion':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promotion-title">Titre</Label>
              <Input
                id="promotion-title"
                value={component.content.title || ""}
                onChange={(e) => handleContentChange("title", e.target.value)}
                placeholder="Titre de la promotion"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-subtitle">Sous-titre</Label>
              <Input
                id="promotion-subtitle"
                value={component.content.subtitle || ""}
                onChange={(e) => handleContentChange("subtitle", e.target.value)}
                placeholder="Sous-titre de la promotion"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-description">Description</Label>
              <Textarea
                id="promotion-description"
                value={component.content.description || ""}
                onChange={(e) => handleContentChange("description", e.target.value)}
                placeholder="Description de la promotion"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-image">Image (URL)</Label>
              <Input
                id="promotion-image"
                value={component.content.image || ""}
                onChange={(e) => handleContentChange("image", e.target.value)}
                placeholder="URL de l'image"
              />
              {component.content.image && (
                <div className="mt-2 relative border rounded-md overflow-hidden aspect-video">
                  <img
                    src={component.content.image}
                    alt="Aperçu"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="promotion-bgcolor">Couleur de fond</Label>
                <div className="flex gap-2 items-center">
                  <div
                    className="w-8 h-8 rounded-md border"
                    style={{
                      backgroundColor:
                        component.content.backgroundColor ||
                        "#ff5252",
                    }}
                  ></div>
                  <Input
                    id="promotion-bgcolor"
                    type="color"
                    value={component.content.backgroundColor || "#ff5252"}
                    onChange={(e) => handleContentChange("backgroundColor", e.target.value)}
                    className="w-12 h-8 p-0"
                  />
                  <Input
                    value={component.content.backgroundColor || "#ff5252"}
                    onChange={(e) => handleContentChange("backgroundColor", e.target.value)}
                    className="w-24 flex-grow"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="promotion-textcolor">Couleur du texte</Label>
                <div className="flex gap-2 items-center">
                  <div
                    className="w-8 h-8 rounded-md border"
                    style={{
                      backgroundColor:
                        component.content.textColor || "#ffffff",
                    }}
                  ></div>
                  <Input
                    id="promotion-textcolor"
                    type="color"
                    value={component.content.textColor || "#ffffff"}
                    onChange={(e) => handleContentChange("textColor", e.target.value)}
                    className="w-12 h-8 p-0"
                  />
                  <Input
                    value={component.content.textColor || "#ffffff"}
                    onChange={(e) => handleContentChange("textColor", e.target.value)}
                    className="w-24 flex-grow"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-discount">Remise affichée</Label>
              <Input
                id="promotion-discount"
                value={component.content.discount || ""}
                onChange={(e) => handleContentChange("discount", e.target.value)}
                placeholder="Ex: -20%"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-cta-text">Texte du bouton</Label>
              <Input
                id="promotion-cta-text"
                value={component.content.ctaText || ""}
                onChange={(e) => handleContentChange("ctaText", e.target.value)}
                placeholder="Texte du bouton"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-cta-link">Lien du bouton</Label>
              <Input
                id="promotion-cta-link"
                value={component.content.ctaLink || ""}
                onChange={(e) => handleContentChange("ctaLink", e.target.value)}
                placeholder="URL du lien"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-expiry">Date d'expiration</Label>
              <Input
                id="promotion-expiry"
                type="date"
                value={component.content.expiryDate || ""}
                onChange={(e) => handleContentChange("expiryDate", e.target.value)}
              />
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-title">Titre</Label>
              <Input
                id="text-title"
                value={component.content.title || ""}
                onChange={(e) => handleContentChange("title", e.target.value)}
                placeholder="Titre de la section"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="text-subtitle">Sous-titre</Label>
              <Input
                id="text-subtitle"
                value={component.content.subtitle || ""}
                onChange={(e) => handleContentChange("subtitle", e.target.value)}
                placeholder="Sous-titre (optionnel)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="text-content">Contenu</Label>
              <Textarea
                id="text-content"
                value={component.content.text || ""}
                onChange={(e) => handleContentChange("text", e.target.value)}
                placeholder="Contenu HTML"
                rows={8}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="text-alignment">Alignement</Label>
              <Select
                value={component.content.alignment || "left"}
                onValueChange={(value) => handleContentChange("alignment", value)}
              >
                <SelectTrigger id="text-alignment">
                  <SelectValue placeholder="Choisir l'alignement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Gauche</SelectItem>
                  <SelectItem value="center">Centre</SelectItem>
                  <SelectItem value="right">Droite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
        
      case 'newsletter':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newsletter-title">Titre</Label>
              <Input
                id="newsletter-title"
                value={component.content.title || ""}
                onChange={(e) => handleContentChange("title", e.target.value)}
                placeholder="Titre du formulaire"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newsletter-description">Description</Label>
              <Textarea
                id="newsletter-description"
                value={component.content.description || ""}
                onChange={(e) => handleContentChange("description", e.target.value)}
                placeholder="Description du formulaire"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newsletter-button-text">Texte du bouton</Label>
              <Input
                id="newsletter-button-text"
                value={component.content.buttonText || ""}
                onChange={(e) => handleContentChange("buttonText", e.target.value)}
                placeholder="Texte du bouton"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newsletter-placeholder">Placeholder</Label>
              <Input
                id="newsletter-placeholder"
                value={component.content.placeholderText || ""}
                onChange={(e) => handleContentChange("placeholderText", e.target.value)}
                placeholder="Texte du placeholder"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newsletter-terms">Texte de conditions</Label>
              <Textarea
                id="newsletter-terms"
                value={component.content.termsText || ""}
                onChange={(e) => handleContentChange("termsText", e.target.value)}
                placeholder="Texte des conditions (optionnel)"
                rows={2}
              />
            </div>
          </div>
        );
        
      case 'html':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="html-content">Contenu HTML</Label>
              <Textarea
                id="html-content"
                value={component.content.html || ""}
                onChange={(e) => handleContentChange("html", e.target.value)}
                placeholder="Votre code HTML personnalisé"
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-4 text-center text-muted-foreground border rounded-md">
            Édition non disponible pour ce type de composant
          </div>
        );
    }
  };
  
  // Fonction de rendu pour les paramètres en fonction du type de composant
  const renderSettingsFields = () => {
    switch (component.type) {
      case 'banner':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="banner-fullwidth">Pleine largeur</Label>
              <Switch
                id="banner-fullwidth"
                checked={component.settings.fullWidth !== false}
                onCheckedChange={(checked) => handleSettingsChange("fullWidth", checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-height">Hauteur</Label>
              <Select
                value={component.settings.height || "medium"}
                onValueChange={(value) => handleSettingsChange("height", value)}
              >
                <SelectTrigger id="banner-height">
                  <SelectValue placeholder="Hauteur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Petite</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-textcolor">Couleur du texte</Label>
              <div className="flex gap-2 items-center">
                <div
                  className="w-8 h-8 rounded-md border"
                  style={{
                    backgroundColor:
                      component.settings.textColor || "#ffffff",
                  }}
                ></div>
                <Input
                  id="banner-textcolor"
                  type="color"
                  value={component.settings.textColor || "#ffffff"}
                  onChange={(e) => handleSettingsChange("textColor", e.target.value)}
                  className="w-12 h-8 p-0"
                />
                <Input
                  value={component.settings.textColor || "#ffffff"}
                  onChange={(e) => handleSettingsChange("textColor", e.target.value)}
                  className="flex-grow"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="banner-overlay">Superposition sombre</Label>
              <Switch
                id="banner-overlay"
                checked={component.settings.overlay !== false}
                onCheckedChange={(checked) => handleSettingsChange("overlay", checked)}
              />
            </div>
            
            {component.settings.overlay !== false && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="banner-overlay-opacity">Opacité de la superposition</Label>
                  <span className="text-muted-foreground">{Math.round((component.settings.overlayOpacity || 0.4) * 100)}%</span>
                </div>
                <Slider
                  id="banner-overlay-opacity"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[component.settings.overlayOpacity || 0.4]}
                  onValueChange={(values) => handleSettingsChange("overlayOpacity", values[0])}
                />
              </div>
            )}
          </div>
        );
        
      case 'slider':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="slider-autoplay">Lecture automatique</Label>
              <Switch
                id="slider-autoplay"
                checked={component.settings.autoplay !== false}
                onCheckedChange={(checked) => handleSettingsChange("autoplay", checked)}
              />
            </div>
            
            {component.settings.autoplay !== false && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="slider-interval">Intervalle (ms)</Label>
                  <span className="text-muted-foreground">{component.settings.interval || 5000}ms</span>
                </div>
                <Slider
                  id="slider-interval"
                  min={1000}
                  max={10000}
                  step={500}
                  value={[component.settings.interval || 5000]}
                  onValueChange={(values) => handleSettingsChange("interval", values[0])}
                />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Label htmlFor="slider-dots">Afficher les points</Label>
              <Switch
                id="slider-dots"
                checked={component.settings.showDots !== false}
                onCheckedChange={(checked) => handleSettingsChange("showDots", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="slider-arrows">Afficher les flèches</Label>
              <Switch
                id="slider-arrows"
                checked={component.settings.showArrows !== false}
                onCheckedChange={(checked) => handleSettingsChange("showArrows", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="slider-fullwidth">Pleine largeur</Label>
              <Switch
                id="slider-fullwidth"
                checked={component.settings.fullWidth !== false}
                onCheckedChange={(checked) => handleSettingsChange("fullWidth", checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slider-height">Hauteur</Label>
              <Select
                value={component.settings.height || "medium"}
                onValueChange={(value) => handleSettingsChange("height", value)}
              >
                <SelectTrigger id="slider-height">
                  <SelectValue placeholder="Hauteur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Petite</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slider-animation">Animation</Label>
              <Select
                value={component.settings.animation || "fade"}
                onValueChange={(value) => handleSettingsChange("animation", value)}
              >
                <SelectTrigger id="slider-animation">
                  <SelectValue placeholder="Animation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">Fondu</SelectItem>
                  <SelectItem value="slide">Glissement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
        
      case 'promotion':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="promotion-fullwidth">Pleine largeur</Label>
              <Switch
                id="promotion-fullwidth"
                checked={component.settings.fullWidth !== false}
                onCheckedChange={(checked) => handleSettingsChange("fullWidth", checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-layout">Disposition</Label>
              <Select
                value={component.settings.layout || "horizontal"}
                onValueChange={(value) => handleSettingsChange("layout", value)}
              >
                <SelectTrigger id="promotion-layout">
                  <SelectValue placeholder="Disposition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontale</SelectItem>
                  <SelectItem value="vertical">Verticale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-padding">Rembourrage</Label>
              <Select
                value={component.settings.padding || "medium"}
                onValueChange={(value) => handleSettingsChange("padding", value)}
              >
                <SelectTrigger id="promotion-padding">
                  <SelectValue placeholder="Rembourrage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Petit</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="large">Grand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="promotion-rounded">Coins arrondis</Label>
              <Switch
                id="promotion-rounded"
                checked={component.settings.rounded !== false}
                onCheckedChange={(checked) => handleSettingsChange("rounded", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="promotion-shadow">Ombre</Label>
              <Switch
                id="promotion-shadow"
                checked={component.settings.shadow !== false}
                onCheckedChange={(checked) => handleSettingsChange("shadow", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="promotion-badge">Afficher le badge</Label>
              <Switch
                id="promotion-badge"
                checked={component.settings.showBadge !== false}
                onCheckedChange={(checked) => handleSettingsChange("showBadge", checked)}
              />
            </div>
            
            {component.settings.showBadge !== false && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="promotion-badge-text">Texte du badge</Label>
                  <Input
                    id="promotion-badge-text"
                    value={component.settings.badgeText || "PROMO"}
                    onChange={(e) => handleSettingsChange("badgeText", e.target.value)}
                    placeholder="Texte du badge"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="promotion-badge-animate">Animer le badge</Label>
                  <Switch
                    id="promotion-badge-animate"
                    checked={component.settings.animateBadge !== false}
                    onCheckedChange={(checked) => handleSettingsChange("animateBadge", checked)}
                  />
                </div>
              </>
            )}
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="text-fullwidth">Pleine largeur</Label>
              <Switch
                id="text-fullwidth"
                checked={component.settings.fullWidth !== false}
                onCheckedChange={(checked) => handleSettingsChange("fullWidth", checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="text-maxwidth">Largeur maximale</Label>
              <Select
                value={component.settings.maxWidth || "lg"}
                onValueChange={(value) => handleSettingsChange("maxWidth", value)}
              >
                <SelectTrigger id="text-maxwidth">
                  <SelectValue placeholder="Largeur maximale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Petite</SelectItem>
                  <SelectItem value="md">Moyenne</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                  <SelectItem value="xl">Très grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="text-bgcolor">Couleur de fond</Label>
              <div className="flex gap-2 items-center">
                <div
                  className="w-8 h-8 rounded-md border"
                  style={{
                    backgroundColor:
                      component.settings.backgroundColor || "transparent",
                  }}
                ></div>
                <Input
                  id="text-bgcolor"
                  type="color"
                  value={component.settings.backgroundColor || "#ffffff"}
                  onChange={(e) => handleSettingsChange("backgroundColor", e.target.value)}
                  className="w-12 h-8 p-0"
                />
                <Input
                  value={component.settings.backgroundColor || "#ffffff"}
                  onChange={(e) => handleSettingsChange("backgroundColor", e.target.value)}
                  className="flex-grow"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="text-textcolor">Couleur du texte</Label>
              <div className="flex gap-2 items-center">
                <div
                  className="w-8 h-8 rounded-md border"
                  style={{
                    backgroundColor:
                      component.settings.textColor || "#000000",
                  }}
                ></div>
                <Input
                  id="text-textcolor"
                  type="color"
                  value={component.settings.textColor || "#000000"}
                  onChange={(e) => handleSettingsChange("textColor", e.target.value)}
                  className="w-12 h-8 p-0"
                />
                <Input
                  value={component.settings.textColor || "#000000"}
                  onChange={(e) => handleSettingsChange("textColor", e.target.value)}
                  className="flex-grow"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="text-padding">Rembourrage</Label>
              <Switch
                id="text-padding"
                checked={component.settings.padding !== false}
                onCheckedChange={(checked) => handleSettingsChange("padding", checked)}
              />
            </div>
          </div>
        );
        
      case 'newsletter':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newsletter-layout">Disposition</Label>
              <Select
                value={component.settings.layout || "stacked"}
                onValueChange={(value) => handleSettingsChange("layout", value)}
              >
                <SelectTrigger id="newsletter-layout">
                  <SelectValue placeholder="Disposition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stacked">Empilé</SelectItem>
                  <SelectItem value="inline">En ligne</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newsletter-bgcolor">Couleur de fond</Label>
              <div className="flex gap-2 items-center">
                <div
                  className="w-8 h-8 rounded-md border"
                  style={{
                    backgroundColor:
                      component.settings.backgroundColor || "#f3f4f6",
                  }}
                ></div>
                <Input
                  id="newsletter-bgcolor"
                  type="color"
                  value={component.settings.backgroundColor || "#f3f4f6"}
                  onChange={(e) => handleSettingsChange("backgroundColor", e.target.value)}
                  className="w-12 h-8 p-0"
                />
                <Input
                  value={component.settings.backgroundColor || "#f3f4f6"}
                  onChange={(e) => handleSettingsChange("backgroundColor", e.target.value)}
                  className="flex-grow"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newsletter-textcolor">Couleur du texte</Label>
              <div className="flex gap-2 items-center">
                <div
                  className="w-8 h-8 rounded-md border"
                  style={{
                    backgroundColor:
                      component.settings.textColor || "#000000",
                  }}
                ></div>
                <Input
                  id="newsletter-textcolor"
                  type="color"
                  value={component.settings.textColor || "#000000"}
                  onChange={(e) => handleSettingsChange("textColor", e.target.value)}
                  className="w-12 h-8 p-0"
                />
                <Input
                  value={component.settings.textColor || "#000000"}
                  onChange={(e) => handleSettingsChange("textColor", e.target.value)}
                  className="flex-grow"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newsletter-buttoncolor">Couleur du bouton</Label>
              <div className="flex gap-2 items-center">
                <div
                  className="w-8 h-8 rounded-md border"
                  style={{
                    backgroundColor:
                      component.settings.buttonColor || "#10b981",
                  }}
                ></div>
                <Input
                  id="newsletter-buttoncolor"
                  type="color"
                  value={component.settings.buttonColor || "#10b981"}
                  onChange={(e) => handleSettingsChange("buttonColor", e.target.value)}
                  className="w-12 h-8 p-0"
                />
                <Input
                  value={component.settings.buttonColor || "#10b981"}
                  onChange={(e) => handleSettingsChange("buttonColor", e.target.value)}
                  className="flex-grow"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="newsletter-rounded">Coins arrondis</Label>
              <Switch
                id="newsletter-rounded"
                checked={component.settings.rounded !== false}
                onCheckedChange={(checked) => handleSettingsChange("rounded", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="newsletter-shadow">Ombre</Label>
              <Switch
                id="newsletter-shadow"
                checked={component.settings.shadow !== false}
                onCheckedChange={(checked) => handleSettingsChange("shadow", checked)}
              />
            </div>
          </div>
        );
        
      case 'html':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="html-fullwidth">Pleine largeur</Label>
              <Switch
                id="html-fullwidth"
                checked={component.settings.fullWidth !== false}
                onCheckedChange={(checked) => handleSettingsChange("fullWidth", checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="html-maxwidth">Largeur maximale</Label>
              <Select
                value={component.settings.maxWidth || "lg"}
                onValueChange={(value) => handleSettingsChange("maxWidth", value)}
              >
                <SelectTrigger id="html-maxwidth">
                  <SelectValue placeholder="Largeur maximale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Petite</SelectItem>
                  <SelectItem value="md">Moyenne</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                  <SelectItem value="xl">Très grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="html-containerclass">Classes CSS personnalisées</Label>
              <Input
                id="html-containerclass"
                value={component.settings.containerClass || ""}
                onChange={(e) => handleSettingsChange("containerClass", e.target.value)}
                placeholder="Classes CSS pour le conteneur"
              />
              <p className="text-xs text-muted-foreground">
                Classes CSS à ajouter au conteneur du composant HTML
              </p>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-4 text-center text-muted-foreground border rounded-md">
            Paramètres non disponibles pour ce type de composant
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto pr-1">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="flex gap-1 text-xs py-0 h-5 px-2 bg-primary/5">
          {component.type}
        </Badge>
        
        <div className="flex items-center gap-1.5">
          {onDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDuplicate}
              className="h-7 w-7"
              title="Dupliquer"
            >
              <CopyIcon className="h-3.5 w-3.5" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-7 w-7 hover:text-destructive"
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="content" className="flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5" />
            Contenu
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5">
            <Cog className="h-3.5 w-3.5" />
            Paramètres
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="pt-4 overflow-y-auto max-h-[70vh]">
          {renderContentFields()}
        </TabsContent>
        
        <TabsContent value="settings" className="pt-4 overflow-y-auto max-h-[70vh]">
          {renderSettingsFields()}
        </TabsContent>
      </Tabs>
      
      <Separator className="my-4" />
      
      <Button
        variant="destructive"
        className="w-full"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Supprimer ce composant
      </Button>
    </div>
  );
};

export default ComponentSettings;