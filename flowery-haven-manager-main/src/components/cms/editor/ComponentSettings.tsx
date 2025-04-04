// src/components/cms/editor/ComponentSettings.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle, Trash } from 'lucide-react';
import { ComponentItem } from './DragDropEditor';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ComponentSettingsProps {
  component: ComponentItem;
  onChange: (updatedComponent: ComponentItem) => void;
  onDelete: () => void;
}

const ComponentSettings: React.FC<ComponentSettingsProps> = ({ 
  component, 
  onChange, 
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState('content');

  // Mise à jour du contenu
  const handleContentChange = (key: string, value: any) => {
    const updatedComponent = {
      ...component,
      content: {
        ...component.content,
        [key]: value
      }
    };
    onChange(updatedComponent);
  };

  // Mise à jour des paramètres
  const handleSettingsChange = (key: string, value: any) => {
    const updatedComponent = {
      ...component,
      settings: {
        ...component.settings,
        [key]: value
      }
    };
    onChange(updatedComponent);
  };

  // Gestion des slides pour les sliders
  const handleSlideChange = (slideIndex: number, key: string, value: any) => {
    if (!component.content.slides) return;

    const updatedSlides = [...component.content.slides];
    updatedSlides[slideIndex] = {
      ...updatedSlides[slideIndex],
      [key]: value
    };

    handleContentChange('slides', updatedSlides);
  };

  // Ajout d'une slide
  const handleAddSlide = () => {
    if (!component.content.slides) return;

    const newSlide = {
      title: "Nouveau slide",
      description: "Description du slide",
      image: "/assets/logo.jpeg"
    };

    handleContentChange('slides', [...component.content.slides, newSlide]);
  };

  // Suppression d'une slide
  const handleRemoveSlide = (slideIndex: number) => {
    if (!component.content.slides || component.content.slides.length <= 1) return;

    const updatedSlides = component.content.slides.filter((_, index) => index !== slideIndex);
    handleContentChange('slides', updatedSlides);
  };

  // Rendu des champs d'édition spécifiques au type de composant
  const renderContentFields = () => {
    switch (component.type) {
      case 'banner':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banner-title">Titre</Label>
              <Input
                id="banner-title"
                value={component.content.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="Titre de la bannière"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-subtitle">Sous-titre</Label>
              <Textarea
                id="banner-subtitle"
                value={component.content.subtitle || ''}
                onChange={(e) => handleContentChange('subtitle', e.target.value)}
                placeholder="Sous-titre de la bannière"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-image">Image (URL)</Label>
              <Input
                id="banner-image"
                value={component.content.image || ''}
                onChange={(e) => handleContentChange('image', e.target.value)}
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
                value={component.content.buttonText || ''}
                onChange={(e) => handleContentChange('buttonText', e.target.value)}
                placeholder="Texte du bouton"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-button-link">Lien du bouton</Label>
              <Input
                id="banner-button-link"
                value={component.content.buttonLink || ''}
                onChange={(e) => handleContentChange('buttonLink', e.target.value)}
                placeholder="URL du lien"
              />
            </div>
          </div>
        );
        
      case 'slider':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-sm">Slides</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddSlide}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              {component.content.slides?.map((slide: any, index: number) => (
                <Card key={index} className="mb-4">
                  <CardHeader className="py-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">Slide {index + 1}</CardTitle>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveSlide(index)}
                        disabled={component.content.slides?.length <= 1}
                        className="h-7 w-7 hover:text-destructive"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`slide-${index}-title`}>Titre</Label>
                      <Input
                        id={`slide-${index}-title`}
                        value={slide.title || ''}
                        onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                        placeholder="Titre du slide"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`slide-${index}-description`}>Description</Label>
                      <Textarea
                        id={`slide-${index}-description`}
                        value={slide.description || ''}
                        onChange={(e) => handleSlideChange(index, 'description', e.target.value)}
                        placeholder="Description du slide"
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`slide-${index}-image`}>Image (URL)</Label>
                      <Input
                        id={`slide-${index}-image`}
                        value={slide.image || ''}
                        onChange={(e) => handleSlideChange(index, 'image', e.target.value)}
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
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </div>
        );
        
      case 'promotion':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promotion-title">Titre</Label>
              <Input
                id="promotion-title"
                value={component.content.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="Titre de la promotion"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-subtitle">Sous-titre</Label>
              <Input
                id="promotion-subtitle"
                value={component.content.subtitle || ''}
                onChange={(e) => handleContentChange('subtitle', e.target.value)}
                placeholder="Sous-titre de la promotion"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-description">Description</Label>
              <Textarea
                id="promotion-description"
                value={component.content.description || ''}
                onChange={(e) => handleContentChange('description', e.target.value)}
                placeholder="Description de la promotion"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-image">Image (URL)</Label>
              <Input
                id="promotion-image"
                value={component.content.image || ''}
                onChange={(e) => handleContentChange('image', e.target.value)}
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
                    style={{ backgroundColor: component.content.backgroundColor || '#ff5252' }}
                  ></div>
                  <Input
                    id="promotion-bgcolor"
                    type="color"
                    value={component.content.backgroundColor || '#ff5252'}
                    onChange={(e) => handleContentChange('backgroundColor', e.target.value)}
                    className="w-10 h-8 p-0"
                  />
                  <Input
                    value={component.content.backgroundColor || '#ff5252'}
                    onChange={(e) => handleContentChange('backgroundColor', e.target.value)}
                    className="w-28"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="promotion-textcolor">Couleur du texte</Label>
                <div className="flex gap-2 items-center">
                  <div 
                    className="w-8 h-8 rounded-md border" 
                    style={{ backgroundColor: component.content.textColor || '#ffffff' }}
                  ></div>
                  <Input
                    id="promotion-textcolor"
                    type="color"
                    value={component.content.textColor || '#ffffff'}
                    onChange={(e) => handleContentChange('textColor', e.target.value)}
                    className="w-10 h-8 p-0"
                  />
                  <Input
                    value={component.content.textColor || '#ffffff'}
                    onChange={(e) => handleContentChange('textColor', e.target.value)}
                    className="w-28"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-discount">Remise affichée</Label>
              <Input
                id="promotion-discount"
                value={component.content.discount || ''}
                onChange={(e) => handleContentChange('discount', e.target.value)}
                placeholder="Ex: -20%"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-cta-text">Texte du bouton</Label>
              <Input
                id="promotion-cta-text"
                value={component.content.ctaText || ''}
                onChange={(e) => handleContentChange('ctaText', e.target.value)}
                placeholder="Texte du bouton"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-cta-link">Lien du bouton</Label>
              <Input
                id="promotion-cta-link"
                value={component.content.ctaLink || ''}
                onChange={(e) => handleContentChange('ctaLink', e.target.value)}
                placeholder="URL du lien"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-expiry">Date d'expiration</Label>
              <Input
                id="promotion-expiry"
                type="date"
                value={component.content.expiryDate || ''}
                onChange={(e) => handleContentChange('expiryDate', e.target.value)}
              />
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-4 text-center text-muted-foreground border rounded-md">
            Configuration non disponible pour ce type de composant
          </div>
        );
    }
  };

  // Rendu des champs de paramètres spécifiques au type de composant
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
                onCheckedChange={(checked) => handleSettingsChange('fullWidth', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-height">Hauteur</Label>
              <Select
                value={component.settings.height || 'medium'}
                onValueChange={(value) => handleSettingsChange('height', value)}
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
                  style={{ backgroundColor: component.settings.textColor || '#ffffff' }}
                ></div>
                <Input
                  id="banner-textcolor"
                  type="color"
                  value={component.settings.textColor || '#ffffff'}
                  onChange={(e) => handleSettingsChange('textColor', e.target.value)}
                  className="w-10 h-8 p-0"
                />
                <Input
                  value={component.settings.textColor || '#ffffff'}
                  onChange={(e) => handleSettingsChange('textColor', e.target.value)}
                  className="w-28"
                />
              </div>
            </div>
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
                onCheckedChange={(checked) => handleSettingsChange('autoplay', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="slider-interval">Intervalle (ms)</Label>
                <span className="text-sm text-muted-foreground">{component.settings.interval || 5000}ms</span>
              </div>
              <Slider
                id="slider-interval"
                value={[component.settings.interval || 5000]}
                min={1000}
                max={10000}
                step={500}
                onValueChange={(value) => handleSettingsChange('interval', value[0])}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="slider-dots">Afficher les indicateurs</Label>
              <Switch
                id="slider-dots"
                checked={component.settings.showDots !== false}
                onCheckedChange={(checked) => handleSettingsChange('showDots', checked)}
              />
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
                onCheckedChange={(checked) => handleSettingsChange('fullWidth', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-layout">Disposition</Label>
              <Select
                value={component.settings.layout || 'horizontal'}
                onValueChange={(value) => handleSettingsChange('layout', value)}
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
            
            <div className="flex items-center justify-between">
              <Label htmlFor="promotion-rounded">Coins arrondis</Label>
              <Switch
                id="promotion-rounded"
                checked={component.settings.rounded !== false}
                onCheckedChange={(checked) => handleSettingsChange('rounded', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="promotion-shadow">Ombre</Label>
              <Switch
                id="promotion-shadow"
                checked={component.settings.shadow !== false}
                onCheckedChange={(checked) => handleSettingsChange('shadow', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="promotion-badge">Afficher le badge</Label>
              <Switch
                id="promotion-badge"
                checked={component.settings.showBadge !== false}
                onCheckedChange={(checked) => handleSettingsChange('showBadge', checked)}
              />
            </div>
            
            {component.settings.showBadge && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="promotion-badge-text">Texte du badge</Label>
                  <Input
                    id="promotion-badge-text"
                    value={component.settings.badgeText || 'PROMO'}
                    onChange={(e) => handleSettingsChange('badgeText', e.target.value)}
                    placeholder="Texte du badge"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="promotion-badge-animate">Animer le badge</Label>
                  <Switch
                    id="promotion-badge-animate"
                    checked={component.settings.animateBadge !== false}
                    onCheckedChange={(checked) => handleSettingsChange('animateBadge', checked)}
                  />
                </div>
              </>
            )}
          </div>
        );
      
      default:
        return (
          <div className="p-4 text-center text-muted-foreground border rounded-md">
            Configuration non disponible pour ce type de composant
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="content">Contenu</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="flex-1 overflow-auto">
          <ScrollArea className="h-[500px] px-1">
            {renderContentFields()}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="settings" className="flex-1 overflow-auto">
          <ScrollArea className="h-[500px] px-1">
            {renderSettingsFields()}
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      <div className="mt-4 pt-4 border-t flex justify-end">
        <Button 
          variant="destructive" 
          onClick={onDelete}
          className="flex items-center gap-1.5"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>
    </div>
  );
};

export default ComponentSettings;