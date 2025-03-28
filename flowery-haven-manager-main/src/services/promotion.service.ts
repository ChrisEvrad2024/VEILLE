// src/services/promotion.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';

// Types pour les promotions
export interface PromoCode {
    id: string;
    code: string;
    type: 'percentage' | 'fixed' | 'free_shipping';
    value: number; // Pourcentage ou montant fixe
    minPurchase?: number; // Achat minimum requis
    startDate: Date;
    endDate: Date;
    usageLimit?: number; // Nombre maximal d'utilisations
    usageCount: number; // Nombre d'utilisations actuelles
    isActive: boolean;
    singleUse: boolean; // Utilisable une seule fois par utilisateur
    usedByUsers: string[]; // IDs des utilisateurs ayant utilisé le code
    productCategories?: string[]; // Catégories éligibles (vide = toutes)
    createdBy: string; // ID de l'admin créateur
    createdAt: Date;
    description?: string;
}

export interface Promotion {
    id: string;
    name: string;
    description: string;
    type: 'product' | 'category' | 'cart';
    discount: {
        type: 'percentage' | 'fixed';
        value: number;
    };
    target: {
        productIds?: string[];
        categoryIds?: string[];
    };
    condition?: {
        minPurchase?: number;
        minQuantity?: number;
        productsRequired?: string[];
    };
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    priority: number; // Priorité (plus le chiffre est élevé, plus la priorité est haute)
    createdBy: string;
    createdAt: Date;
    bannerImage?: string;
}

// Créer un code promo (admin uniquement)
const createPromoCode = async (
    code: string,
    type: PromoCode['type'],
    value: number,
    startDate: Date,
    endDate: Date,
    options: {
        minPurchase?: number;
        usageLimit?: number;
        singleUse?: boolean;
        productCategories?: string[];
        description?: string;
        isActive?: boolean;
    } = {}
): Promise<PromoCode> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        // Vérifier si le code existe déjà
        const existingCodes = await dbService.getByIndex<PromoCode>("promoCodes", "code", code.toUpperCase());

        if (existingCodes && existingCodes.length > 0) {
            throw new Error("Ce code promotionnel existe déjà");
        }

        // Créer le code promo
        const newPromoCode: PromoCode = {
            id: `promo_${Date.now()}`,
            code: code.toUpperCase(),
            type,
            value,
            startDate,
            endDate,
            usageCount: 0,
            isActive: options.isActive !== undefined ? options.isActive : true,
            singleUse: options.singleUse || false,
            usedByUsers: [],
            createdBy: currentUser.id,
            createdAt: new Date(),
            minPurchase: options.minPurchase,
            usageLimit: options.usageLimit,
            productCategories: options.productCategories,
            description: options.description
        };

        // Enregistrer le code promo
        await dbService.addItem("promoCodes", newPromoCode);

        return newPromoCode;
    } catch (error) {
        console.error("Error in createPromoCode:", error);
        throw error;
    }
};

// Générer un code promo aléatoire
const generateRandomCode = (length: number = 8): string => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclusion des caractères ambigus comme O/0, I/1
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Générer plusieurs codes promo (admin uniquement)
const generatePromoCodes = async (
    count: number,
    type: PromoCode['type'],
    value: number,
    startDate: Date,
    endDate: Date,
    prefix: string = '',
    options: {
        minPurchase?: number;
        usageLimit?: number;
        singleUse?: boolean;
        productCategories?: string[];
        description?: string;
        isActive?: boolean;
    } = {}
): Promise<PromoCode[]> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const generatedCodes: PromoCode[] = [];

        for (let i = 0; i < count; i++) {
            const randomCode = `${prefix}${generateRandomCode(8 - prefix.length)}`;
            try {
                const code = await createPromoCode(
                    randomCode,
                    type,
                    value,
                    startDate,
                    endDate,
                    options
                );
                generatedCodes.push(code);
            } catch (error) {
                console.error(`Erreur lors de la génération du code #${i}:`, error);
                // Continuer avec le suivant
            }
        }

        return generatedCodes;
    } catch (error) {
        console.error("Error in generatePromoCodes:", error);
        throw error;
    }
};

// Vérifier la validité d'un code promo
const validatePromoCode = async (
    code: string,
    cartTotal: number,
    categories: string[] = [],
    userId?: string
): Promise<PromoCode | null> => {
    try {
        // Récupérer le code promo
        const codes = await dbService.getByIndex<PromoCode>("promoCodes", "code", code.toUpperCase());

        if (!codes || codes.length === 0) {
            return null;
        }

        const promoCode = codes[0];

        // Vérifier si le code est actif
        if (!promoCode.isActive) {
            return null;
        }

        // Vérifier les dates de validité
        const now = new Date();
        if (now < new Date(promoCode.startDate) || now > new Date(promoCode.endDate)) {
            return null;
        }

        // Vérifier la limite d'utilisation
        if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
            return null;
        }

        // Vérifier le montant minimum d'achat
        if (promoCode.minPurchase && cartTotal < promoCode.minPurchase) {
            return null;
        }

        // Vérifier les catégories éligibles
        if (promoCode.productCategories && promoCode.productCategories.length > 0) {
            if (!categories.some(cat => promoCode.productCategories?.includes(cat))) {
                return null;
            }
        }

        // Vérifier si l'utilisateur a déjà utilisé ce code (pour les codes à usage unique)
        if (userId && promoCode.singleUse && promoCode.usedByUsers.includes(userId)) {
            return null;
        }

        return promoCode;
    } catch (error) {
        console.error(`Error in validatePromoCode for code ${code}:`, error);
        return null;
    }
};

// Appliquer un code promo à un montant
const applyPromoCode = async (
    code: string,
    cartTotal: number,
    shippingCost: number = 0,
    categories: string[] = []
): Promise<{
    isValid: boolean;
    newTotal: number;
    discount: number;
    newShippingCost: number;
    message?: string;
}> => {
    try {
        const currentUser = authService.getCurrentUser();
        const userId = currentUser?.id;

        const promoCode = await validatePromoCode(code, cartTotal, categories, userId);

        if (!promoCode) {
            return {
                isValid: false,
                newTotal: cartTotal,
                discount: 0,
                newShippingCost: shippingCost,
                message: "Code promotionnel invalide ou expiré"
            };
        }

        let discount = 0;
        let newShippingCost = shippingCost;

        // Appliquer la réduction selon le type
        switch (promoCode.type) {
            case 'percentage':
                discount = cartTotal * (promoCode.value / 100);
                break;
            case 'fixed':
                discount = Math.min(cartTotal, promoCode.value);
                break;
            case 'free_shipping':
                newShippingCost = 0;
                break;
        }

        return {
            isValid: true,
            newTotal: cartTotal - discount,
            discount,
            newShippingCost,
            message: `Code promo appliqué avec succès`
        };
    } catch (error) {
        console.error(`Error in applyPromoCode for code ${code}:`, error);
        return {
            isValid: false,
            newTotal: cartTotal,
            discount: 0,
            newShippingCost: shippingCost,
            message: "Erreur lors de l'application du code promo"
        };
    }
};

// Marquer un code promo comme utilisé
const markPromoCodeAsUsed = async (code: string): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        const codes = await dbService.getByIndex<PromoCode>("promoCodes", "code", code.toUpperCase());

        if (!codes || codes.length === 0) {
            return false;
        }

        const promoCode = codes[0];

        // Mettre à jour le compteur d'utilisation et la liste des utilisateurs
        const updatedPromoCode = {
            ...promoCode,
            usageCount: promoCode.usageCount + 1,
            usedByUsers: [...promoCode.usedByUsers, currentUser.id]
        };

        await dbService.updateItem("promoCodes", updatedPromoCode);

        return true;
    } catch (error) {
        console.error(`Error in markPromoCodeAsUsed for code ${code}:`, error);
        return false;
    }
};

// Obtenir tous les codes promo (admin uniquement)
const getAllPromoCodes = async (): Promise<PromoCode[]> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        return await dbService.getAllItems<PromoCode>("promoCodes");
    } catch (error) {
        console.error("Error in getAllPromoCodes:", error);
        return [];
    }
};

// Désactiver un code promo (admin uniquement)
const deactivatePromoCode = async (id: string): Promise<boolean> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const promoCode = await dbService.getItemById<PromoCode>("promoCodes", id);

        if (!promoCode) {
            return false;
        }

        // Désactiver le code
        const updatedPromoCode = {
            ...promoCode,
            isActive: false
        };

        await dbService.updateItem("promoCodes", updatedPromoCode);

        return true;
    } catch (error) {
        console.error(`Error in deactivatePromoCode for ID ${id}:`, error);
        return false;
    }
};

// ===== GESTION DES PROMOTIONS =====

// Créer une promotion (admin uniquement)
const createPromotion = async (
    name: string,
    description: string,
    type: Promotion['type'],
    discountType: Promotion['discount']['type'],
    discountValue: number,
    startDate: Date,
    endDate: Date,
    options: {
        target?: Promotion['target'];
        condition?: Promotion['condition'];
        priority?: number;
        isActive?: boolean;
        bannerImage?: string;
    } = {}
): Promise<Promotion> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        // Créer la promotion
        const newPromotion: Promotion = {
            id: `promo_campaign_${Date.now()}`,
            name,
            description,
            type,
            discount: {
                type: discountType,
                value: discountValue
            },
            target: options.target || { productIds: [], categoryIds: [] },
            condition: options.condition,
            startDate,
            endDate,
            isActive: options.isActive !== undefined ? options.isActive : true,
            priority: options.priority || 1,
            createdBy: currentUser.id,
            createdAt: new Date(),
            bannerImage: options.bannerImage
        };

        // Enregistrer la promotion
        await dbService.addItem("promotions", newPromotion);

        return newPromotion;
    } catch (error) {
        console.error("Error in createPromotion:", error);
        throw error;
    }
};

// Obtenir toutes les promotions actives
const getActivePromotions = async (): Promise<Promotion[]> => {
    try {
        const allPromotions = await dbService.getByIndex<Promotion>("promotions", "isActive", true);
        const now = new Date();

        // Filtrer les promotions par date de validité
        return allPromotions
            .filter(promo => now >= new Date(promo.startDate) && now <= new Date(promo.endDate))
            .sort((a, b) => b.priority - a.priority); // Trier par priorité décroissante
    } catch (error) {
        console.error("Error in getActivePromotions:", error);
        return [];
    }
};

// Obtenir toutes les promotions (admin uniquement)
const getAllPromotions = async (): Promise<Promotion[]> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        return await dbService.getAllItems<Promotion>("promotions");
    } catch (error) {
        console.error("Error in getAllPromotions:", error);
        return [];
    }
};

// Mettre à jour une promotion (admin uniquement)
const updatePromotion = async (promotion: Promotion): Promise<Promotion> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        await dbService.updateItem("promotions", promotion);

        return promotion;
    } catch (error) {
        console.error(`Error in updatePromotion for ID ${promotion.id}:`, error);
        throw error;
    }
};

export const promotionService = {
    // Codes promo
    createPromoCode,
    generateRandomCode,
    generatePromoCodes,
    validatePromoCode,
    applyPromoCode,
    markPromoCodeAsUsed,
    getAllPromoCodes,
    deactivatePromoCode,
    // Promotions
    createPromotion,
    getActivePromotions,
    getAllPromotions,
    updatePromotion
};