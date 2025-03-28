// src/services/newsletter.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';

// Types pour la newsletter
export interface NewsletterSubscriber {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    subscriptionDate: Date;
    isActive: boolean;
    preferences: {
        newProducts: boolean;
        promotions: boolean;
        events: boolean;
        blog: boolean;
    };
    unsubscribeToken: string;
    userId?: string; // Si l'utilisateur est connecté
}

export interface NewsletterCampaign {
    id: string;
    title: string;
    content: string;
    subject: string;
    previewText: string;
    createdBy: string;
    createdAt: Date;
    scheduledFor?: Date;
    sentAt?: Date;
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
    targetGroups: Array<{
        type: 'all' | 'preference' | 'custom';
        value?: string; // Si type = preference, le nom de la préférence
        subscriberIds?: string[]; // Si type = custom, la liste des abonnés ciblés
    }>;
    statistics?: {
        sent: number;
        opened: number;
        clicked: number;
        unsubscribed: number;
        bounced: number;
    };
}

// S'abonner à la newsletter
const subscribe = async (
    email: string,
    firstName?: string,
    lastName?: string,
    preferences?: Partial<NewsletterSubscriber['preferences']>
): Promise<NewsletterSubscriber> => {
    try {
        // Vérifier si l'email est déjà abonné
        const existingSubscribers = await dbService.getByIndex<NewsletterSubscriber>("newsletterSubscribers", "email", email);
        
        // Récupérer l'utilisateur connecté
        const currentUser = authService.getCurrentUser();
        
        // Générer un token de désabonnement
        const unsubscribeToken = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        
        if (existingSubscribers && existingSubscribers.length > 0) {
            // L'abonné existe déjà, on réactive son abonnement si nécessaire
            const subscriber = existingSubscribers[0];
            
            if (!subscriber.isActive) {
                const updatedSubscriber = {
                    ...subscriber,
                    isActive: true,
                    preferences: {
                        ...subscriber.preferences,
                        ...(preferences || {})
                    },
                    unsubscribeToken,
                    userId: currentUser?.id || subscriber.userId
                };
                
                await dbService.updateItem("newsletterSubscribers", updatedSubscriber);
                return updatedSubscriber;
            }
            
            // Si déjà actif, on met à jour les préférences
            if (preferences) {
                const updatedSubscriber = {
                    ...subscriber,
                    preferences: {
                        ...subscriber.preferences,
                        ...preferences
                    },
                    userId: currentUser?.id || subscriber.userId
                };
                
                await dbService.updateItem("newsletterSubscribers", updatedSubscriber);
                return updatedSubscriber;
            }
            
            return subscriber;
        }
        
        // Créer un nouvel abonné
        const defaultPreferences = {
            newProducts: true,
            promotions: true,
            events: true,
            blog: true
        };
        
        const newSubscriber: NewsletterSubscriber = {
            id: `subscriber_${Date.now()}`,
            email,
            firstName,
            lastName,
            subscriptionDate: new Date(),
            isActive: true,
            preferences: {
                ...defaultPreferences,
                ...(preferences || {})
            },
            unsubscribeToken,
            userId: currentUser?.id
        };
        
        await dbService.addItem("newsletterSubscribers", newSubscriber);
        
        return newSubscriber;
    } catch (error) {
        console.error(`Error in subscribe for email ${email}:`, error);
        throw error;
    }
};

// Se désabonner de la newsletter
const unsubscribe = async (tokenOrEmail: string): Promise<boolean> => {
    try {
        // Rechercher par token d'abord
        const allSubscribers = await dbService.getAllItems<NewsletterSubscriber>("newsletterSubscribers");
        let subscriber = allSubscribers.find(s => s.unsubscribeToken === tokenOrEmail);
        
        if (!subscriber) {
            // Rechercher par email
            const subscribersByEmail = await dbService.getByIndex<NewsletterSubscriber>("newsletterSubscribers", "email", tokenOrEmail);
            if (!subscribersByEmail || subscribersByEmail.length === 0) {
                return false;
            }
            subscriber = subscribersByEmail[0];
        }
        
        if (!subscriber.isActive) {
            return true; // Déjà désabonné
        }
        
        // Mettre à jour le statut
        const updatedSubscriber = {
            ...subscriber,
            isActive: false
        };
        
        await dbService.updateItem("newsletterSubscribers", updatedSubscriber);
        
        return true;
    } catch (error) {
        console.error(`Error in unsubscribe for token/email ${tokenOrEmail}:`, error);
        return false;
    }
};

// Mettre à jour les préférences d'abonnement
const updatePreferences = async (
    tokenOrEmail: string,
    preferences: Partial<NewsletterSubscriber['preferences']>
): Promise<NewsletterSubscriber | null> => {
    try {
        // Rechercher par token d'abord
        const allSubscribers = await dbService.getAllItems<NewsletterSubscriber>("newsletterSubscribers");
        let subscriber = allSubscribers.find(s => s.unsubscribeToken === tokenOrEmail);
        
        if (!subscriber) {
            // Rechercher par email
            const subscribersByEmail = await dbService.getByIndex<NewsletterSubscriber>("newsletterSubscribers", "email", tokenOrEmail);
            if (!subscribersByEmail || subscribersByEmail.length === 0) {
                return null;
            }
            subscriber = subscribersByEmail[0];
        }
        
        // Mettre à jour les préférences
        const updatedSubscriber = {
            ...subscriber,
            preferences: {
                ...subscriber.preferences,
                ...preferences
            }
        };
        
        await dbService.updateItem("newsletterSubscribers", updatedSubscriber);
        
        return updatedSubscriber;
    } catch (error) {
        console.error(`Error in updatePreferences for token/email ${tokenOrEmail}:`, error);
        return null;
    }
};

// Vérifier si un email est abonné
const isSubscribed = async (email: string): Promise<boolean> => {
    try {
        const subscribers = await dbService.getByIndex<NewsletterSubscriber>("newsletterSubscribers", "email", email);
        
        return !!(subscribers && subscribers.length > 0 && subscribers[0].isActive);
    } catch (error) {
        console.error(`Error in isSubscribed for email ${email}:`, error);
        return false;
    }
};

// Récupérer les préférences d'un abonné
const getSubscriberPreferences = async (email: string): Promise<NewsletterSubscriber['preferences'] | null> => {
    try {
        const subscribers = await dbService.getByIndex<NewsletterSubscriber>("newsletterSubscribers", "email", email);
        
        if (!subscribers || subscribers.length === 0 || !subscribers[0].isActive) {
            return null;
        }
        
        return subscribers[0].preferences;
    } catch (error) {
        console.error(`Error in getSubscriberPreferences for email ${email}:`, error);
        return null;
    }
};

// ===== ADMIN FUNCTIONS =====

// Obtenir tous les abonnés (admin uniquement)
const getAllSubscribers = async (): Promise<NewsletterSubscriber[]> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        return await dbService.getAllItems<NewsletterSubscriber>("newsletterSubscribers");
    } catch (error) {
        console.error("Error in getAllSubscribers:", error);
        return [];
    }
};

// Obtenir les abonnés actifs (admin uniquement)
const getActiveSubscribers = async (): Promise<NewsletterSubscriber[]> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        return await dbService.getByIndex<NewsletterSubscriber>("newsletterSubscribers", "isActive", true);
    } catch (error) {
        console.error("Error in getActiveSubscribers:", error);
        return [];
    }
};

// Créer une campagne newsletter (admin uniquement)
const createCampaign = async (
    title: string,
    content: string,
    subject: string,
    previewText: string,
    targetGroups: NewsletterCampaign['targetGroups']
): Promise<NewsletterCampaign> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }
        
        // Créer la campagne
        const newCampaign: NewsletterCampaign = {
            id: `campaign_${Date.now()}`,
            title,
            content,
            subject,
            previewText,
            createdBy: currentUser.id,
            createdAt: new Date(),
            status: 'draft',
            targetGroups,
            statistics: {
                sent: 0,
                opened: 0,
                clicked: 0,
                unsubscribed: 0,
                bounced: 0
            }
        };
        
        await dbService.addItem("newsletterCampaigns", newCampaign);
        
        return newCampaign;
    } catch (error) {
        console.error("Error in createCampaign:", error);
        throw error;
    }
};

// Programmer l'envoi d'une campagne (admin uniquement)
const scheduleCampaign = async (
    campaignId: string,
    scheduledDate: Date
): Promise<NewsletterCampaign> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const campaign = await dbService.getItemById<NewsletterCampaign>("newsletterCampaigns", campaignId);
        
        if (!campaign) {
            throw new Error("Campagne non trouvée");
        }
        
        if (campaign.status !== 'draft') {
            throw new Error("Seules les campagnes en brouillon peuvent être programmées");
        }
        
        // Mettre à jour la campagne
        const updatedCampaign = {
            ...campaign,
            scheduledFor: scheduledDate,
            status: 'scheduled' as const
        };
        
        await dbService.updateItem("newsletterCampaigns", updatedCampaign);
        
        return updatedCampaign;
    } catch (error) {
        console.error(`Error in scheduleCampaign for ID ${campaignId}:`, error);
        throw error;
    }
};

// Simuler l'envoi d'une campagne (admin uniquement)
const sendCampaign = async (campaignId: string): Promise<boolean> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const campaign = await dbService.getItemById<NewsletterCampaign>("newsletterCampaigns", campaignId);
        
        if (!campaign) {
            throw new Error("Campagne non trouvée");
        }
        
        if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
            throw new Error("Cette campagne ne peut pas être envoyée");
        }
        
        // Simuler l'envoi (dans une vraie app, ce serait asynchrone et utiliserait un service d'emailing)
        const now = new Date();
        
        // Obtenir les abonnés cibles
        let targetSubscribers: NewsletterSubscriber[] = [];
        for (const group of campaign.targetGroups) {
            switch (group.type) {
                case 'all':
                    const allActive = await getActiveSubscribers();
                    targetSubscribers = [...targetSubscribers, ...allActive];
                    break;
                case 'preference':
                    if (group.value) {
                        const preferenceSubscribers = await getActiveSubscribers();
                        const filteredByPreference = preferenceSubscribers.filter(
                            sub => sub.preferences[group.value as keyof typeof sub.preferences]
                        );
                        targetSubscribers = [...targetSubscribers, ...filteredByPreference];
                    }
                    break;
                case 'custom':
                    if (group.subscriberIds) {
                        for (const id of group.subscriberIds) {
                            const subscriber = await dbService.getItemById<NewsletterSubscriber>("newsletterSubscribers", id);
                            if (subscriber && subscriber.isActive) {
                                targetSubscribers.push(subscriber);
                            }
                        }
                    }
                    break;
            }
        }
        
        // Déduplication des abonnés
        targetSubscribers = Array.from(new Set(targetSubscribers.map(s => s.id)))
            .map(id => targetSubscribers.find(s => s.id === id)!);
        
        // Mettre à jour la campagne
        const updatedCampaign = {
            ...campaign,
            status: 'sent' as const,
            sentAt: now,
            statistics: {
                ...campaign.statistics,
                sent: targetSubscribers.length
            }
        };
        
        await dbService.updateItem("newsletterCampaigns", updatedCampaign);
        
        console.log(`Campagne envoyée à ${targetSubscribers.length} abonnés`);
        
        return true;
    } catch (error) {
        console.error(`Error in sendCampaign for ID ${campaignId}:`, error);
        return false;
    }
};

// Annuler une campagne programmée (admin uniquement)
const cancelCampaign = async (campaignId: string): Promise<boolean> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const campaign = await dbService.getItemById<NewsletterCampaign>("newsletterCampaigns", campaignId);
        
        if (!campaign) {
            throw new Error("Campagne non trouvée");
        }
        
        if (campaign.status !== 'scheduled') {
            throw new Error("Seules les campagnes programmées peuvent être annulées");
        }
        
        // Mettre à jour la campagne
        const updatedCampaign = {
            ...campaign,
            status: 'cancelled' as const
        };
        
        await dbService.updateItem("newsletterCampaigns", updatedCampaign);
        
        return true;
    } catch (error) {
        console.error(`Error in cancelCampaign for ID ${campaignId}:`, error);
        return false;
    }
};

// Obtenir toutes les campagnes (admin uniquement)
const getAllCampaigns = async (): Promise<NewsletterCampaign[]> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        return await dbService.getAllItems<NewsletterCampaign>("newsletterCampaigns");
    } catch (error) {
        console.error("Error in getAllCampaigns:", error);
        return [];
    }
};

export const newsletterService = {
    // Fonctions publiques
    subscribe,
    unsubscribe,
    updatePreferences,
    isSubscribed,
    getSubscriberPreferences,
    // Fonctions admin
    getAllSubscribers,
    getActiveSubscribers,
    createCampaign,
    scheduleCampaign,
    sendCampaign,
    cancelCampaign,
    getAllCampaigns
};