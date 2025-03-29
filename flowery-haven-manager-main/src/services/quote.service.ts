// src/services/quote.service.ts
import { v4 as uuidv4 } from 'uuid';
import { dbService } from './db.service';
import { authService } from './auth.service';
import { QuoteRequest, QuoteStatus, Quote, QuoteItem } from '@/types/quote';
import { orderService } from './order.service';
import { Order, OrderAddress } from '@/types/order';

class QuoteService {
    // Méthodes de récupération
    async getQuoteRequestById(id: string): Promise<QuoteRequest | null> {
        try {
            const quoteRequest = await dbService.get<QuoteRequest>('quotes', id);
            return quoteRequest || null;
        } catch (error) {
            console.error('Error getting quote request:', error);
            return null;
        }
    }

    async getQuoteById(id: string): Promise<Quote | null> {
        try {
            const quote = await dbService.get<Quote>('quotes', id);
            return quote || null;
        } catch (error) {
            console.error('Error getting quote:', error);
            return null;
        }
    }

    async getQuoteRequestsByUser(userId: string): Promise<QuoteRequest[]> {
        try {
            const quotes = await dbService.getByUserId<QuoteRequest>('quotes', userId);
            return quotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error('Error getting user quote requests:', error);
            return [];
        }
    }

    async getQuoteRequestsByStatus(status: QuoteStatus): Promise<QuoteRequest[]> {
        try {
            const quotes = await dbService.getByStatus<QuoteRequest>('quotes', status);
            return quotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error('Error getting quote requests by status:', error);
            return [];
        }
    }

    async getAllQuoteRequests(): Promise<QuoteRequest[]> {
        try {
            const quotes = await dbService.getAll<QuoteRequest>('quotes');
            return quotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error('Error getting all quote requests:', error);
            return [];
        }
    }

    // Création de demande de devis
    async createQuoteRequest(
        eventType: string,
        eventDate: string,
        budget: number,
        description: string,
        attachments?: string[]
    ): Promise<{ success: boolean; quoteId?: string; message: string }> {
        try {
            // Vérifier l'authentification
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                return { success: false, message: 'Vous devez être connecté pour demander un devis.' };
            }

            // Créer la demande de devis
            const quoteId = uuidv4();
            const now = new Date().toISOString();
            // Date d'expiration à 30 jours
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            const quoteRequest: QuoteRequest = {
                id: quoteId,
                userId: currentUser.id,
                userName: `${currentUser.firstName} ${currentUser.lastName}`,
                userEmail: currentUser.email,
                userPhone: currentUser.phone || '',
                eventType,
                eventDate,
                budget,
                description,
                attachments,
                status: 'pending',
                createdAt: now,
                updatedAt: now,
                expiresAt: expiryDate.toISOString()
            };

            // Enregistrer la demande dans la base de données
            await dbService.addItem('quotes', quoteRequest);

            return {
                success: true,
                quoteId,
                message: 'Votre demande de devis a été soumise avec succès. Nous vous contacterons prochainement.'
            };
        } catch (error) {
            console.error('Error creating quote request:', error);
            return {
                success: false,
                message: 'Une erreur est survenue lors de la soumission de votre demande de devis. Veuillez réessayer.'
            };
        }
    }

    // Mise à jour du statut de demande de devis
    async updateQuoteRequestStatus(
        id: string,
        newStatus: QuoteStatus,
        note?: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const quoteRequest = await this.getQuoteRequestById(id);
            if (!quoteRequest) {
                return { success: false, message: 'Demande de devis introuvable.' };
            }

            // Mettre à jour la demande
            const updatedQuoteRequest: QuoteRequest = {
                ...quoteRequest,
                status: newStatus,
                updatedAt: new Date().toISOString()
            };

            await dbService.updateItem('quotes', updatedQuoteRequest);

            return { success: true, message: 'Statut de la demande de devis mis à jour avec succès.' };
        } catch (error) {
            console.error('Error updating quote request status:', error);
            return { success: false, message: 'Une erreur est survenue lors de la mise à jour du statut.' };
        }
    }

    // Création d'un devis en réponse à une demande
    async createQuote(
        requestId: string,
        items: { name: string; description: string; quantity: number; unitPrice: number }[],
        notes?: string,
        adminNotes?: string,
        validityDays: number = 30
    ): Promise<{ success: boolean; quoteId?: string; message: string }> {
        try {
            const quoteRequest = await this.getQuoteRequestById(requestId);
            if (!quoteRequest) {
                return { success: false, message: 'Demande de devis introuvable.' };
            }

            // Calculer les totaux
            const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            const tax = subtotal * 0.2; // TVA à 20%
            const total = subtotal + tax;

            // Créer le devis
            const quoteId = uuidv4();
            const now = new Date().toISOString();

            // Date de validité
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + validityDays);

            // Créer les éléments du devis
            const quoteItems: QuoteItem[] = items.map(item => ({
                id: uuidv4(),
                quoteId,
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice
            }));

            const quote: Quote = {
                id: quoteId,
                requestId,
                userId: quoteRequest.userId,
                items: quoteItems,
                subtotal,
                tax,
                discount: 0,
                total,
                status: 'awaiting_customer',
                notes,
                adminNotes,
                validUntil: validUntil.toISOString(),
                createdAt: now,
                updatedAt: now
            };

            // Enregistrer le devis dans la base de données
            await dbService.addItem('quotes', quote);

            // Mettre à jour le statut de la demande
            await this.updateQuoteRequestStatus(requestId, 'in_review');

            return {
                success: true,
                quoteId,
                message: 'Devis créé avec succès et envoyé au client.'
            };
        } catch (error) {
            console.error('Error creating quote:', error);
            return {
                success: false,
                message: 'Une erreur est survenue lors de la création du devis. Veuillez réessayer.'
            };
        }
    }

    // Actions client sur les devis
    async acceptQuote(
        quoteId: string,
        shippingAddress: OrderAddress
    ): Promise<{ success: boolean; orderId?: string; message: string }> {
        try {
            const quote = await this.getQuoteById(quoteId);
            if (!quote) {
                return { success: false, message: 'Devis introuvable.' };
            }

            if (quote.status !== 'awaiting_customer') {
                return { success: false, message: 'Ce devis ne peut plus être accepté.' };
            }

            // Vérifier si le devis est expiré
            if (new Date(quote.validUntil) < new Date()) {
                return { success: false, message: 'Ce devis a expiré. Veuillez demander un nouveau devis.' };
            }

            // Mettre à jour le statut du devis
            await this.updateQuoteStatus(quoteId, 'accepted');

            // Créer une commande à partir du devis
            const orderId = uuidv4();
            const now = new Date().toISOString();

            // Convertir les éléments du devis en éléments de commande
            const orderItems = quote.items.map(item => ({
                productId: item.id, // Utiliser l'ID de l'élément du devis comme identifiant de produit (fictif)
                name: item.name,
                price: item.unitPrice,
                quantity: item.quantity,
                image: '/path/to/default-image.jpg', // Image par défaut pour les éléments de devis
                orderId,
                priceAtPurchase: item.unitPrice
            }));

            // Créer l'objet de commande
            const order: Order = {
                id: orderId,
                userId: quote.userId,
                items: orderItems,
                status: 'pending',
                createdAt: now,
                updatedAt: now,
                shippingAddress,
                billingAddress: shippingAddress,
                paymentInfo: {
                    method: 'transfer', // Par défaut, paiement par virement pour les devis
                    status: 'pending',
                },
                subtotal: quote.subtotal,
                shipping: 0, // Frais de livraison inclus dans le devis
                discount: quote.discount,
                tax: quote.tax,
                total: quote.total,
                notes: `Commande créée depuis le devis #${quoteId}`
            };

            // Enregistrer la commande dans la base de données
            await dbService.addItem('orders', order);

            // Ajouter l'historique du statut de la commande
            await orderService['addOrderStatusHistory'](
                orderId,
                'pending',
                'Commande créée à partir d\'un devis accepté'
            );

            return {
                success: true,
                orderId,
                message: 'Devis accepté avec succès. Votre commande a été créée.'
            };
        } catch (error) {
            console.error('Error accepting quote:', error);
            return {
                success: false,
                message: 'Une erreur est survenue lors de l\'acceptation du devis. Veuillez réessayer.'
            };
        }
    }

    async rejectQuote(
        quoteId: string,
        reason: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const quote = await this.getQuoteById(quoteId);
            if (!quote) {
                return { success: false, message: 'Devis introuvable.' };
            }

            if (quote.status !== 'awaiting_customer') {
                return { success: false, message: 'Ce devis ne peut plus être rejeté.' };
            }

            // Mettre à jour le statut du devis avec la raison du rejet
            const updatedQuote: Quote = {
                ...quote,
                status: 'rejected',
                notes: `${quote.notes || ''}\n\nRejeté par le client: ${reason}`.trim(),
                updatedAt: new Date().toISOString()
            };

            await dbService.updateItem('quotes', updatedQuote);

            return { success: true, message: 'Devis rejeté avec succès.' };
        } catch (error) {
            console.error('Error rejecting quote:', error);
            return {
                success: false,
                message: 'Une erreur est survenue lors du rejet du devis. Veuillez réessayer.'
            };
        }
    }

    // Mise à jour d'un devis existant
    async updateQuoteStatus(
        quoteId: string,
        newStatus: QuoteStatus
    ): Promise<{ success: boolean; message: string }> {
        try {
            const quote = await this.getQuoteById(quoteId);
            if (!quote) {
                return { success: false, message: 'Devis introuvable.' };
            }

            // Mettre à jour le devis
            const updatedQuote: Quote = {
                ...quote,
                status: newStatus,
                updatedAt: new Date().toISOString()
            };

            await dbService.updateItem('quotes', updatedQuote);

            return { success: true, message: 'Statut du devis mis à jour avec succès.' };
        } catch (error) {
            console.error('Error updating quote status:', error);
            return { success: false, message: 'Une erreur est survenue lors de la mise à jour du statut.' };
        }
    }

    async updateQuote(
        quoteId: string,
        updates: {
            items?: QuoteItem[];
            notes?: string;
            adminNotes?: string;
            validUntil?: string;
        }
    ): Promise<{ success: boolean; message: string }> {
        try {
            const quote = await this.getQuoteById(quoteId);
            if (!quote) {
                return { success: false, message: 'Devis introuvable.' };
            }

            // Si les éléments sont modifiés, recalculer les totaux
            let subtotal = quote.subtotal;
            let tax = quote.tax;
            let total = quote.total;

            if (updates.items) {
                subtotal = updates.items.reduce((sum, item) => sum + item.total, 0);
                tax = subtotal * 0.2; // TVA à 20%
                total = subtotal + tax;
            }

            // Mettre à jour le devis
            const updatedQuote: Quote = {
                ...quote,
                items: updates.items || quote.items,
                notes: updates.notes !== undefined ? updates.notes : quote.notes,
                adminNotes: updates.adminNotes !== undefined ? updates.adminNotes : quote.adminNotes,
                validUntil: updates.validUntil || quote.validUntil,
                subtotal,
                tax,
                total,
                updatedAt: new Date().toISOString()
            };

            await dbService.updateItem('quotes', updatedQuote);

            return { success: true, message: 'Devis mis à jour avec succès.' };
        } catch (error) {
            console.error('Error updating quote:', error);
            return { success: false, message: 'Une erreur est survenue lors de la mise à jour du devis.' };
        }
    }

    // Méthodes utilitaires
    getQuoteStatusConfig(status: QuoteStatus): {
        label: string;
        color: string;
        icon: string;
        description: string;
    } {
        const statusConfig = {
            pending: {
                label: 'En attente',
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                icon: 'Clock',
                description: 'Votre demande de devis est en attente de traitement.'
            },
            in_review: {
                label: 'En cours d\'analyse',
                color: 'bg-blue-100 text-blue-800 border-blue-200',
                icon: 'Search',
                description: 'Nous analysons actuellement votre demande de devis.'
            },
            awaiting_customer: {
                label: 'En attente de réponse',
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                icon: 'Mail',
                description: 'Votre devis est prêt et attend votre réponse.'
            },
            accepted: {
                label: 'Accepté',
                color: 'bg-green-100 text-green-800 border-green-200',
                icon: 'CheckCircle',
                description: 'Vous avez accepté ce devis.'
            },
            rejected: {
                label: 'Refusé',
                color: 'bg-red-100 text-red-800 border-red-200',
                icon: 'XCircle',
                description: 'Vous avez refusé ce devis.'
            },
            expired: {
                label: 'Expiré',
                color: 'bg-gray-100 text-gray-800 border-gray-200',
                icon: 'Clock',
                description: 'Ce devis a expiré et n\'est plus valide.'
            }
        };

        return statusConfig[status];
    }

    // Méthodes pour les statistiques
    async getQuoteStatistics(): Promise<{
        totalQuoteRequests: number;
        totalQuotes: number;
        conversionRate: number;
        quoteRequestsByStatus: Record<QuoteStatus, number>;
    }> {
        try {
            const quoteRequests = await this.getAllQuoteRequests();
            const quotes = await dbService.getAll<Quote>('quotes');

            const totalQuoteRequests = quoteRequests.length;

            // Filtrer pour ne compter que les devis générés (pas les demandes)
            const totalQuotes = quotes.filter(q => q.items && q.items.length > 0).length;

            // Calculer le taux de conversion (devis acceptés / devis totaux)
            const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
            const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) : 0;

            // Compter les demandes par statut
            const quoteRequestsByStatus = quoteRequests.reduce((acc, q) => {
                acc[q.status] = (acc[q.status] || 0) + 1;
                return acc;
            }, {} as Record<QuoteStatus, number>);

            // S'assurer que tous les statuts sont représentés
            const allStatuses: QuoteStatus[] = [
                'pending', 'in_review', 'awaiting_customer', 'accepted', 'rejected', 'expired'
            ];

            allStatuses.forEach(status => {
                if (!quoteRequestsByStatus[status]) {
                    quoteRequestsByStatus[status] = 0;
                }
            });

            return {
                totalQuoteRequests,
                totalQuotes,
                conversionRate,
                quoteRequestsByStatus
            };
        } catch (error) {
            console.error('Error getting quote statistics:', error);
            return {
                totalQuoteRequests: 0,
                totalQuotes: 0,
                conversionRate: 0,
                quoteRequestsByStatus: {
                    pending: 0,
                    in_review: 0,
                    awaiting_customer: 0,
                    accepted: 0,
                    rejected: 0,
                    expired: 0
                }
            };
        }
    }
}

export const quoteService = new QuoteService();
export type { QuoteRequest, QuoteStatus, Quote, QuoteItem };