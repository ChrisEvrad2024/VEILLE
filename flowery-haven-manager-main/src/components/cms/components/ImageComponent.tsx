// src/components/cms/components/ImageComponent.tsx
import React from 'react';
import { ComponentProps } from '../component-mapping';

const ImageComponent: React.FC<ComponentProps> = ({ content, settings }) => {
  // Extraire les valeurs du contenu
  const { 
    src = '', 
    alt = '', 
    caption = '',
    link = ''
  } = content;

  // Extraire les paramètres
  const { 
    fullWidth = false,
    width = 'auto',
    height = 'auto',
    borderRadius = '0',
    shadow = false,
    padding = true
  } = settings;

  // Si aucune image n'est disponible
  if (!src) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-100 text-gray-500">
        Image non disponible
      </div>
    );
  }

  // Préparer le conteneur de l'image
  const ImageContainer = link ? 
    ({ children }: { children: React.ReactNode }) => <a href={link} target="_blank" rel="noopener noreferrer">{children}</a> : 
    ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <div className={`image-component ${padding ? 'py-4' : ''}`}>
      <div className={`${!fullWidth ? 'container mx-auto' : ''}`}>
        <figure className={`${!fullWidth ? 'max-w-4xl mx-auto' : ''}`}>
          <ImageContainer>
            <img 
              src={src} 
              alt={alt}
              className={`
                ${shadow ? 'shadow-lg' : ''}
                ${fullWidth ? 'w-full' : ''}
              `}
              style={{ 
                borderRadius: borderRadius ? `${borderRadius}px` : undefined,
                width: width !== 'auto' ? width : undefined,
                height: height !== 'auto' ? height : undefined,
                maxWidth: '100%'
              }}
            />
          </ImageContainer>
          
          {caption && (
            <figcaption className="text-sm text-gray-600 mt-2 text-center">
              {caption}
            </figcaption>
          )}
        </figure>
      </div>
    </div>
  );
};

export default ImageComponent;