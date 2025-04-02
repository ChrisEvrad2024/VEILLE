// src/components/cms/components/TextComponent.tsx
import React from 'react';
import { ComponentProps } from '../component-mapping';

const TextComponent: React.FC<ComponentProps> = ({ content, settings }) => {
  // Extraire les valeurs du contenu
  const { 
    title = '', 
    subtitle = '', 
    text = '', 
    alignment = 'left' 
  } = content;

  // Extraire les paramètres
  const { 
    fullWidth = false,
    backgroundColor = '',
    textColor = '',
    padding = true,
    maxWidth = 'lg'
  } = settings;

  // Détermine la classe max-width en fonction du paramètre
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-2xl';
      case 'md': return 'max-w-4xl';
      case 'lg': return 'max-w-6xl';
      case 'xl': return 'max-w-7xl';
      case 'none': return '';
      default: return 'max-w-6xl';
    }
  };

  // Détermine l'alignement du texte
  const getAlignmentClass = () => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      case 'justify': return 'text-justify';
      default: return 'text-left';
    }
  };

  return (
    <div 
      className={`text-component ${backgroundColor ? '' : 'bg-white'}`}
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      <div className={`${!fullWidth ? 'container mx-auto' : ''} ${padding ? 'py-8 px-4' : ''}`}>
        <div className={`${getMaxWidthClass()} mx-auto ${getAlignmentClass()}`}>
          {title && (
            <h2 
              className="text-2xl md:text-3xl font-bold mb-4"
              style={{ color: textColor || undefined }}
            >
              {title}
            </h2>
          )}
          
          {subtitle && (
            <h3 
              className="text-xl md:text-2xl font-medium mb-4"
              style={{ color: textColor || undefined }}
            >
              {subtitle}
            </h3>
          )}
          
          {/* Si le texte contient du HTML, on l'affiche en utilisant dangerouslySetInnerHTML */}
          {text && (
            <div 
              className="prose prose-lg max-w-none"
              style={{ color: textColor || undefined }}
              dangerouslySetInnerHTML={{ __html: text }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TextComponent;