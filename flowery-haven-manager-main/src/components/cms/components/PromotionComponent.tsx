// src/components/cms/components/PromotionComponent.tsx
import React from 'react';
import { ComponentProps } from '../component-mapping';
import { Link } from 'react-router-dom';

/**
 * Composant pour afficher des promotions marketing
 */
const PromotionComponent: React.FC<ComponentProps> = ({ content, settings }) => {
  // Extraire les valeurs du contenu avec des valeurs par défaut
  const {
    title = "Promotion Spéciale",
    subtitle = "Offre limitée dans le temps",
    description = "",
    image = "",
    backgroundColor = "#ff5252",
    textColor = "#ffffff",
    ctaText = "En profiter",
    ctaLink = "/promotions",
    discount = "",
    expiryDate = ""
  } = content;

  // Extraire les paramètres avec des valeurs par défaut
  const {
    fullWidth = true,
    layout = "horizontal", // horizontal, vertical
    rounded = true,
    showBadge = true,
    badgeText = "PROMO",
    animateBadge = true,
    shadow = true,
    overlayImage = false
  } = settings;

  // Détermination si la date d'expiration est dans le passé
  const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;

  // Formatage de la date d'expiration en français
  const formatExpiryDate = () => {
    if (!expiryDate) return "";
    
    try {
      const date = new Date(expiryDate);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return expiryDate;
    }
  };

  // Styles pour le badge de promotion
  const badgeStyles = `
    absolute top-0 right-0 bg-red-600 text-white px-3 py-1 font-bold text-xs uppercase
    ${rounded ? 'rounded-tr-md' : ''}
    ${animateBadge ? 'animate-pulse' : ''}
  `;

  // Styles pour le conteneur principal
  const containerStyles = `
    relative overflow-hidden
    ${shadow ? 'shadow-lg' : ''}
    ${rounded ? 'rounded-lg' : ''}
    ${isExpired ? 'opacity-70' : ''}
  `;

  // Styles pour le conteneur de contenu
  const contentStyles = `
    ${layout === 'horizontal' ? 'flex items-center' : 'flex flex-col'}
    ${overlayImage ? 'relative' : ''}
  `;

  return (
    <div className={`promotion-component w-full ${fullWidth ? '' : 'max-w-6xl mx-auto'} my-8`}>
      <div 
        className={containerStyles} 
        style={{ backgroundColor }}
      >
        {isExpired && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-40">
            <div className="bg-white text-red-600 font-bold px-4 py-2 rounded-md transform rotate-12">
              PROMOTION TERMINÉE
            </div>
          </div>
        )}
        
        {showBadge && !isExpired && (
          <div className={badgeStyles}>
            {badgeText}
          </div>
        )}
        
        <div className={contentStyles}>
          {/* Image de la promotion (conditionnelle) */}
          {image && !overlayImage && (
            <div className={`
              ${layout === 'horizontal' ? 'w-1/3' : 'w-full aspect-[5/2]'}
              overflow-hidden
            `}>
              <img 
                src={image} 
                alt={title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Arrière-plan de l'image si en superposition */}
          {image && overlayImage && (
            <div className="absolute inset-0 bg-cover bg-center" style={{
              backgroundImage: `url(${image})`,
              opacity: 0.3
            }} />
          )}
          
          {/* Contenu de la promotion */}
          <div className={`
            ${layout === 'horizontal' ? 'w-2/3 p-8' : 'w-full p-8'} 
            relative z-1
          `}>
            {discount && (
              <div className="text-3xl md:text-5xl font-extrabold mb-4" style={{ color: textColor }}>
                {discount}
              </div>
            )}
            
            <h3 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: textColor }}>
              {title}
            </h3>
            
            <div className="text-lg font-medium mb-3" style={{ color: textColor }}>
              {subtitle}
            </div>
            
            {description && (
              <p className="mb-4" style={{ color: textColor }}>
                {description}
              </p>
            )}
            
            {expiryDate && !isExpired && (
              <div className="mb-4 font-medium" style={{ color: textColor }}>
                Valable jusqu'au {formatExpiryDate()}
              </div>
            )}
            
            {!isExpired && (
              <Link
                to={ctaLink}
                className="inline-block bg-white text-black font-medium px-6 py-2 rounded hover:bg-opacity-90 transition-colors"
              >
                {ctaText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionComponent;