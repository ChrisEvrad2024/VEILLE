// src/components/cms/components/SliderComponent.tsx
import React, { useState, useEffect } from 'react';
import { ComponentProps } from '../component-mapping';

const SliderComponent: React.FC<ComponentProps> = ({ content, settings }) => {
  // Extraire les valeurs du contenu avec des valeurs par défaut
  const slides = content.slides || [];

  // Extraire les paramètres avec des valeurs par défaut
  const {
    autoplay = true,
    interval = 5000,
    showDots = true,
  } = settings;

  const [currentSlide, setCurrentSlide] = useState(0);

  // Fonction pour passer au slide suivant
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Fonction pour passer au slide précédent
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Configuration de l'autoplay
  useEffect(() => {
    if (autoplay && slides.length > 1) {
      const timer = setInterval(nextSlide, interval);
      return () => clearInterval(timer);
    }
  }, [autoplay, interval, slides.length]);

  // Si aucun slide n'est disponible
  if (!slides.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 text-gray-500">
        Aucune diapositive disponible
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Container du slider */}
      <div className="relative h-80 md:h-96">
        {/* Diapositives */}
        {slides.map((slide: any, index: number) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Image d'arrière-plan */}
            {slide.image && (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              </div>
            )}
            
            {/* Contenu de la diapositive */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center text-white">
              {slide.title && (
                <h3 className="text-2xl md:text-4xl font-bold mb-2">{slide.title}</h3>
              )}
              
              {slide.description && (
                <p className="text-sm md:text-base max-w-xl">{slide.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Contrôles du slider */}
      <button
        className="absolute top-1/2 left-2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full"
        onClick={prevSlide}
      >
        &lt;
      </button>
      
      <button
        className="absolute top-1/2 right-2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full"
        onClick={nextSlide}
      >
        &gt;
      </button>
      
      {/* Indicateurs (dots) */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {slides.map((_: any, index: number) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SliderComponent;