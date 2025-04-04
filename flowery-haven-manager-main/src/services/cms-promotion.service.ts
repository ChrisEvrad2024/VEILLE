// src/services/cms-promotion.service.ts
import { cmsFrontendService } from './cms-frontend.service';
import { promotionService } from './promotion.service';
import { PromoCode, Promotion } from './promotion.service';

/**
 * Service d'intégration entre le CMS et les promotions
 * Permet d'afficher et de gérer les promotions directement depuis l'éditeur CMS
 */
export const cmsPromotionService = {
    /**
     * Récupère les codes promo actifs pour l'affichage dans l'éditeur CMS
     * @returns Liste des codes promo actifs formatés pour l'éditeur
     */
    getActivePromoCodes: async (): Promise<{
        code: string;
        value: string;
        type: string;
        expiryDate: string;
        isActive: boolean;
    }[]> => {
        try {
            // Récupérer tous les codes promo actifs
            const promoCodes = await promotionService.getAllPromoCodes();

            // Filtrer les codes actifs
            const activeCodes = promoCodes.filter(code => code.isActive);

            // Formatter pour l'affichage dans l'éditeur
            return activeCodes.map(code => ({
                code: code.code,
                value: formatPromoValue(code),
                type: code.type,
                expiryDate: new Date(code.endDate).toISOString().split('T')[0],
                isActive: code.isActive
            }));
        } catch (error) {
            console.error('Erreur lors de la récupération des codes promo actifs:', error);
            return [];
        }
    },

    /**
     * Récupère un code promo spécifique pour l'affichage
     * @param code Code promo à récupérer
     * @returns Données formatées du code promo
     */
    getPromoCodeByCode: async (code: string): Promise<{
        code: string;
        value: string;
        type: string;
        expiryDate: string;
        isActive: boolean;
        minPurchase?: number;
        description?: string;
    } | null> => {
        try {
            // Récupérer tous les codes promo
            const promoCodes = await promotionService.getAllPromoCodes();

            // Trouver le code spécifique
            const promoCode = promoCodes.find(promo => promo.code === code.toUpperCase());

            if (!promoCode) {
                return null;
            }

            // Formatter pour l'affichage
            return {
                code: promoCode.code,
                value: formatPromoValue(promoCode),
                type: promoCode.type,
                expiryDate: new Date(promoCode.endDate).toISOString().split('T')[0],
                isActive: promoCode.isActive,
                minPurchase: promoCode.minPurchase,
                description: promoCode.description
            };
        } catch (error) {
            console.error(`Erreur lors de la récupération du code promo ${code}:`, error);
            return null;
        }
    },

    /**
     * Récupère les promotions actives pour l'affichage dans l'éditeur CMS
     * @returns Promotions actives formatées pour l'éditeur
     */
    getActivePromotions: async (): Promise<{
        id: string;
        name: string;
        description: string;
        discount: string;
        expiryDate: string;
        bannerImage?: string;
    }[]> => {
        try {
            // Récupérer toutes les promotions actives
            const promotions = await promotionService.getActivePromotions();

            // Formatter pour l'affichage dans l'éditeur
            return promotions.map(promo => ({
                id: promo.id,
                name: promo.name,
                description: promo.description,
                discount: formatPromotionDiscount(promo),
                expiryDate: new Date(promo.endDate).toISOString().split('T')[0],
                bannerImage: promo.bannerImage
            }));
        } catch (error) {
            console.error('Erreur lors de la récupération des promotions actives:', error);
            return [];
        }
    },

    /**
     * Enrichit un composant de promotion avec des données réelles
     * @param componentId ID du composant de promotion
     * @param promoCode Code promo à intégrer (optionnel)
     * @returns Composant enrichi avec les données du code promo ou de la promotion
     */
    enrichPromotionComponent: async (componentId: string, promoCode?: string): Promise<any> => {
        try {
            // Récupérer le composant
            const component = await cmsFrontendService.getComponentData(componentId);

            if (!component || component.type !== 'promotion') {
                return null;
            }

            // Version enrichie du composant
            let enrichedContent = { ...component.content };

            // Si un code promo spécifique est demandé
            if (promoCode) {
                const promoData = await cmsPromotionService.getPromoCodeByCode(promoCode);

                if (promoData) {
                    enrichedContent = {
                        ...enrichedContent,
                        promoCode: promoData.code,
                        discount: formatDiscount(promoData),
                        expiryDate: promoData.expiryDate,
                        title: enrichedContent.title || `Offre spéciale: ${promoData.code}`,
                        subtitle: enrichedContent.subtitle || (promoData.description || `${promoData.value} de réduction`),
                        description: enrichedContent.description || `Utilisez le code ${promoData.code} pour profiter de cette offre${promoData.minPurchase ? ` à partir de ${promoData.minPurchase}€ d'achat` : ''}.`
                    };
                }
            }
            // Sinon, essayer de récupérer une promotion active
            else if (component.content.useActivePromotion) {
                const activePromotions = await cmsPromotionService.getActivePromotions();

                if (activePromotions.length > 0) {
                    // Prendre la première promotion active (celle avec la plus haute priorité)
                    const promotion = activePromotions[0];

                    enrichedContent = {
                        ...enrichedContent,
                        title: enrichedContent.title || promotion.name,
                        subtitle: enrichedContent.subtitle || promotion.discount,
                        description: enrichedContent.description || promotion.description,
                        expiryDate: promotion.expiryDate,
                        bannerImage: enrichedContent.image || promotion.bannerImage
                    };
                }
            }

            return {
                ...component,
                content: enrichedContent
            };
        } catch (error) {
            console.error(`Erreur lors de l'enrichissement du composant ${componentId}:`, error);
            return null;
        }
    }
};

/**
 * Formate la valeur d'un code promo pour l'affichage
 * @param promoCode Code promo à formater
 * @returns Valeur formatée (ex: "10%", "5€", etc.)
 */
function formatPromoValue(promoCode: PromoCode): string {
    switch (promoCode.type) {
        case 'percentage':
            return `${promoCode.value}%`;
        case 'fixed':
            return `${promoCode.value}€`;
        case 'free_shipping':
            return 'Livraison gratuite';
        default:
            return `${promoCode.value}`;
    }
}

/**
 * Formate la remise d'un code promo pour l'affichage
 * @param promoData Données du code promo
 * @returns Remise formatée (ex: "-10%", "-5€", etc.)
 */
function formatDiscount(promoData: { type: string; value: string }): string {
    if (promoData.type === 'free_shipping') {
        return 'LIVRAISON GRATUITE';
    }

    const value = promoData.value;

    if (promoData.type === 'percentage' && !value.startsWith('-')) {
        return `-${value}`;
    }

    return value;
}

/**
 * Formate la remise d'une promotion pour l'affichage
 * @param promotion Promotion à formater
 * @returns Remise formatée (ex: "-10%", "-5€", etc.)
 */
function formatPromotionDiscount(promotion: Promotion): string {
    const { type, value } = promotion.discount;

    switch (type) {
        case 'percentage':
            return `-${value}%`;
        case 'fixed':
            return `-${value}€`;
        default:
            return `${value}`;
    }
}