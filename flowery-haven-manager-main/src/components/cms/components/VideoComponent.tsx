// src/components/cms/components/VideoComponent.tsx
import React from 'react';
import { ComponentProps } from '../component-mapping';

const VideoComponent: React.FC<ComponentProps> = ({ content, settings }) => {
  // Extraire les valeurs du contenu
  const { 
    url = '', 
    title = '',
    poster = '', // Image d'aperçu
    caption = '',
  } = content;

  // Extraire les paramètres
  const { 
    fullWidth = false,
    autoplay = false,
    controls = true,
    muted = true,
    loop = false,
    aspectRatio = '16:9',
    padding = true
  } = settings;

  // Récupérer l'ID de la vidéo YouTube si applicable
  const getYouTubeID = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Récupérer l'ID de la vidéo Vimeo si applicable
  const getVimeoID = (url: string): string | null => {
    const regExp = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
    const match = url.match(regExp);
    
    return match ? match[5] : null;
  };

  // Déterminer le type de vidéo
  const isYouTube = getYouTubeID(url) !== null;
  const isVimeo = getVimeoID(url) !== null;
  const isDirectVideo = !isYouTube && !isVimeo && url.match(/\.(mp4|webm|ogg)$/i) !== null;

  // Obtenir la classe d'aspect ratio
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '1:1': return 'aspect-w-1 aspect-h-1';
      case '4:3': return 'aspect-w-4 aspect-h-3';
      case '16:9': return 'aspect-w-16 aspect-h-9';
      case '21:9': return 'aspect-w-21 aspect-h-9';
      default: return 'aspect-w-16 aspect-h-9';
    }
  };

  // Rendu en fonction du type de vidéo
  const renderVideo = () => {
    if (isYouTube) {
      const youtubeId = getYouTubeID(url);
      return (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay ? 1 : 0}&controls=${controls ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}`}
          title={title || 'YouTube video player'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        ></iframe>
      );
    } else if (isVimeo) {
      const vimeoId = getVimeoID(url);
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&muted=${muted ? 1 : 0}`}
          title={title || 'Vimeo video player'}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        ></iframe>
      );
    } else if (isDirectVideo) {
      return (
        <video
          src={url}
          poster={poster}
          controls={controls}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          className="absolute inset-0 w-full h-full"
        ></video>
      );
    } else {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
          URL de vidéo non valide ou non prise en charge
        </div>
      );
    }
  };

  // Si aucune URL n'est disponible
  if (!url) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-100 text-gray-500">
        Vidéo non disponible
      </div>
    );
  }

  return (
    <div className={`video-component ${padding ? 'py-4' : ''}`}>
      <div className={`${!fullWidth ? 'container mx-auto' : ''}`}>
        <figure className={`${!fullWidth ? 'max-w-4xl mx-auto' : ''}`}>
          <div className={`relative ${getAspectRatioClass()}`}>
            {renderVideo()}
          </div>
          
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

export default VideoComponent;