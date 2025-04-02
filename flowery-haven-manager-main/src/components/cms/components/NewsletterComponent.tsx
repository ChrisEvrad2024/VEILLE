// src/components/cms/components/NewsletterComponent.tsx
import React, { useState } from 'react';
import { ComponentProps } from '../component-mapping';

const NewsletterComponent: React.FC<ComponentProps> = ({ content, settings }) => {
  // Extraire les valeurs du contenu avec des valeurs par défaut
  const {
    title = "Abonnez-vous à notre newsletter",
    description = "Recevez nos dernières actualités et offres spéciales directement dans votre boîte de réception.",
    buttonText = "S'abonner",
  } = content;

  // Extraire les paramètres avec des valeurs par défaut
  const {
    layout = "stacked",
    backgroundColor = "#f3f4f6",
  } = settings;

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation simple de l'email
    if (!email || !email.includes('@')) {
      setMessage({ text: 'Veuillez entrer une adresse email valide', type: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dans une implémentation réelle, vous feriez une requête à votre API
      // const response = await fetch('/api/newsletter/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });
      // const data = await response.json();
      
      setMessage({ text: 'Merci pour votre inscription !', type: 'success' });
      setEmail('');
    } catch (error) {
      setMessage({ text: 'Une erreur est survenue. Veuillez réessayer.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStacked = layout === 'stacked';

  return (
    <div 
      className="newsletter-component py-8 px-4"
      style={{ backgroundColor }}
    >
      <div className="max-w-4xl mx-auto">
        <div className={`${isStacked ? 'text-center' : 'md:flex md:items-center md:justify-between'}`}>
          {/* En-tête de la newsletter */}
          <div className={isStacked ? 'mb-6' : 'md:max-w-md mb-6 md:mb-0'}>
            {title && <h3 className="text-xl md:text-2xl font-bold mb-2">{title}</h3>}
            {description && <p className="text-gray-600">{description}</p>}
          </div>
          
          {/* Formulaire */}
          <div className={isStacked ? 'max-w-md mx-auto' : 'md:max-w-md'}>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'En cours...' : buttonText}
              </button>
            </form>
            
            {/* Message de confirmation ou d'erreur */}
            {message && (
              <div 
                className={`mt-3 text-sm ${
                  message.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterComponent;