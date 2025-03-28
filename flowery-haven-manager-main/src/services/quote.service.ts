// src/services/quote.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';

// Types pour les devis
export interface QuoteFile {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
}

export interface QuoteRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    description: string;
    requestDate: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    files?: QuoteFile[];
    urgency: 'low' | 'medium' | 'high';
    expectedDeliveryDate?: Date;
    specialRequirements?: string;
}

export interface QuoteProposal {
    id: string;
    quoteRequestId: string;
    creationDate: Date;
    validUntil: Date;
    totalAmount: number;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    adminNotes?: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    customerComment?: string;
    acceptanceDate?: Date;
    rejectionDate?: Date;
    rejectionReason?: string;
}

// Créer une demande de devis
const createQuoteRequest = async (
    description: string,
    files: QuoteFile[] = [],
    urgency: QuoteRequest['urgency'] = 'medium',
    expectedDeliveryDate?: Date,
    specialRequirements?: string
): Promise<QuoteRequest> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        // Créer la demande de devis
        const newQuoteRequest: QuoteRequest = {
            id: `quote_req_${Date.now()}`,
            userId: currentUser.id,
            userName: `${currentUser.firstName} ${currentUser.lastName}`,
            userEmail: currentUser.email,
            description,
            requestDate: new Date(),
            status: 'pending',
            files,
            urgency,
            expectedDeliveryDate,
            specialRequirements
        };

        // Enregistrer la demande
        await dbService.addItem("quoteRequests", newQuoteRequest);

        return newQuoteRequest;
    } catch (error) {
        console.error("Error in createQuoteRequest:", error);
        throw error;
    }
};

// Obtenir les demandes de devis de l'utilisateur
const getUserQuoteRequests = async (): Promise<QuoteRequest[]> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            return [];
        }

        // Récupérer les demandes de devis de l'utilisateur
        return await dbService.getByIndex<QuoteRequest>("quoteRequests", "userId", currentUser.id);
    } catch (error) {
        console.error("Error in getUserQuoteRequests:", error);
        return [];
    }
};

// Obtenir une demande de devis par son ID
const getQuoteRequestById = async (requestId: string): Promise<QuoteRequest | null> => {
    try {
        const request = await dbService.getItemById<QuoteRequest>("quoteRequests", requestId);

        if (!request) {
            return null;
        }

        // Vérifier que l'utilisateur est autorisé
        const currentUser = authService.getCurrentUser();

        if (!currentUser || (request.userId !== currentUser.id && !authService.isAdmin())) {
            return null;
        }

        return request;
    } catch (error) {
        console.error(`Error in getQuoteRequestById for request ${requestId}:`, error);
        return null;
    }
};

// Annuler une demande de devis
const cancelQuoteRequest = async (requestId: string): Promise<boolean> => {
    try {
        const request = await getQuoteRequestById(requestId);

        if (!request) {
            return false;
        }

        // Vérifier que le statut permet l'annulation
        if (request.status !== 'pending' && request.status !== 'in_progress') {
            throw new Error("Cette demande ne peut plus être annulée");
        }

        // Mettre à jour le statut
        const updatedRequest = {
            ...request,
            status: 'cancelled' as const
        };

        await dbService.updateItem("quoteRequests", updatedRequest);

        return true;
    } catch (error) {
        console.error(`Error in cancelQuoteRequest for request ${requestId}:`, error);
        return false;
    }
};

// Mettre à jour le statut d'une demande (admin uniquement)
const updateQuoteRequestStatus = async (
    requestId: string,
    status: QuoteRequest['status']
): Promise<boolean> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const request = await dbService.getItemById<QuoteRequest>("quoteRequests", requestId);

        if (!request) {
            return false;
        }

        // Mettre à jour le statut
        const updatedRequest = {
            ...request,
            status
        };

        await dbService.updateItem("quoteRequests", updatedRequest);

        return true;
    } catch (error) {
        console.error(`Error in updateQuoteRequestStatus for request ${requestId}:`, error);
        return false;
    }
};

// Récupérer toutes les demandes de devis (admin uniquement)
const getAllQuoteRequests = async (): Promise<QuoteRequest[]> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        return await dbService.getAllItems<QuoteRequest>("quoteRequests");
    } catch (error) {
        console.error("Error in getAllQuoteRequests:", error);
        return [];
    }
};

// Créer une proposition de devis (admin uniquement)
const createQuoteProposal = async (
    quoteRequestId: string,
    items: QuoteProposal['items'],
    validityPeriodDays: number = 30,
    adminNotes?: string
): Promise<QuoteProposal> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const request = await dbService.getItemById<QuoteRequest>("quoteRequests", quoteRequestId);

        if (!request) {
            throw new Error("Demande de devis non trouvée");
        }

        // Calculer le montant total
        const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

        // Définir la date de validité
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validityPeriodDays);

        // Créer la proposition
        const newProposal: QuoteProposal = {
            id: `quote_prop_${Date.now()}`,
            quoteRequestId,
            creationDate: new Date(),
            validUntil,
            totalAmount,
            items,
            adminNotes,
            status: 'draft'
        };

        // Enregistrer la proposition
        await dbService.addItem("quoteProposals", newProposal);

        // Mettre à jour le statut de la demande
        await updateQuoteRequestStatus(quoteRequestId, 'in_progress');

        return newProposal;
    } catch (error) {
        console.error(`Error in createQuoteProposal for request ${quoteRequestId}:`, error);
        throw error;
    }
};

// Envoyer une proposition de devis au client (admin uniquement)
const sendQuoteProposal = async (proposalId: string): Promise<boolean> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const proposal = await dbService.getItemById<QuoteProposal>("quoteProposals", proposalId);

        if (!proposal) {
            throw new Error("Proposition de devis non trouvée");
        }

        if (proposal.status !== 'draft') {
            throw new Error("Seules les propositions en brouillon peuvent être envoyées");
        }

        // Mettre à jour le statut
        const updatedProposal = {
            ...proposal,
            status: 'sent' as const
        };

        await dbService.updateItem("quoteProposals", updatedProposal);

        // Dans une vraie app, on enverrait un email au client ici

        return true;
    } catch (error) {
        console.error(`Error in sendQuoteProposal for proposal ${proposalId}:`, error);
        return false;
    }
};

// Obtenir les propositions pour une demande de devis
const getQuoteProposalsForRequest = async (requestId: string): Promise<QuoteProposal[]> => {
    try {
        const request = await getQuoteRequestById(requestId);

        if (!request) {
            throw new Error("Demande de devis non trouvée ou accès refusé");
        }

        return await dbService.getByIndex<QuoteProposal>("quoteProposals", "quoteRequestId", requestId);
    } catch (error) {
        console.error(`Error in getQuoteProposalsForRequest for request ${requestId}:`, error);
        return [];
    }
};

// Accepter une proposition de devis
const acceptQuoteProposal = async (proposalId: string, comment?: string): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        const proposal = await dbService.getItemById<QuoteProposal>("quoteProposals", proposalId);

        if (!proposal) {
            throw new Error("Proposition de devis non trouvée");
        }

        // Vérifier que la proposition est bien destinée à cet utilisateur
        const request = await dbService.getItemById<QuoteRequest>("quoteRequests", proposal.quoteRequestId);

        if (!request || request.userId !== currentUser.id) {
            throw new Error("Accès refusé");
        }

        if (proposal.status !== 'sent') {
            throw new Error("Cette proposition ne peut pas être acceptée");
        }

        if (new Date(proposal.validUntil) < new Date()) {
            throw new Error("Cette proposition a expiré");
        }

        // Mettre à jour la proposition
        const updatedProposal = {
            ...proposal,
            status: 'accepted' as const,
            customerComment: comment,
            acceptanceDate: new Date()
        };

        await dbService.updateItem("quoteProposals", updatedProposal);

        // Mettre à jour le statut de la demande
        await updateQuoteRequestStatus(proposal.quoteRequestId, 'completed');

        // Dans une vraie app, on notifierait l'administrateur ici

        return true;
    } catch (error) {
        console.error(`Error in acceptQuoteProposal for proposal ${proposalId}:`, error);
        return false;
    }
};

// Refuser une proposition de devis
const rejectQuoteProposal = async (proposalId: string, reason?: string): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        const proposal = await dbService.getItemById<QuoteProposal>("quoteProposals", proposalId);

        if (!proposal) {
            throw new Error("Proposition de devis non trouvée");
        }

        // Vérifier que la proposition est bien destinée à cet utilisateur
        const request = await dbService.getItemById<QuoteRequest>("quoteRequests", proposal.quoteRequestId);

        if (!request || request.userId !== currentUser.id) {
            throw new Error("Accès refusé");
        }

        if (proposal.status !== 'sent') {
            throw new Error("Cette proposition ne peut pas être refusée");
        }

        // Mettre à jour la proposition
        const updatedProposal = {
            ...proposal,
            status: 'rejected' as const,
            rejectionReason: reason,
            rejectionDate: new Date()
        };

        await dbService.updateItem("quoteProposals", updatedProposal);

        // Dans une vraie app, on notifierait l'administrateur ici

        return true;
    } catch (error) {
        console.error(`Error in rejectQuoteProposal for proposal ${proposalId}:`, error);
        return false;
    }
};

export const quoteService = {
    createQuoteRequest,
    getUserQuoteRequests,
    getQuoteRequestById,
    cancelQuoteRequest,
    updateQuoteRequestStatus,
    getAllQuoteRequests,
    createQuoteProposal,
    sendQuoteProposal,
    getQuoteProposalsForRequest,
    acceptQuoteProposal,
    rejectQuoteProposal
};