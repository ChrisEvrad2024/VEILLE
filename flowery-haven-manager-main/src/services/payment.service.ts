// src/services/payment.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';

// Types pour les paiements
export interface PaymentMethod {
    id: string;
    name: string;
    type: 'credit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
    isActive: boolean;
    config: {
        apiKey?: string;
        secretKey?: string;
        merchantId?: string;
        sandbox: boolean;
        handlingFee?: number;
        minAmount?: number;
        maxAmount?: number;
    };
    instructions?: string;
    icon?: string;
    position: number;
    requiresShipping: boolean;
    availableCountries: string[]; // ISO country codes ou ['*'] pour tous
    createdAt: Date;
    updatedAt: Date;
}

export interface PaymentTransaction {
    id: string;
    orderId: string;
    userId: string;
    amount: number;
    paymentMethodId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    transactionDate: Date;
    transactionId?: string;
    gatewayResponse?: any;
    refundedAmount?: number;
    notes?: string;
}

// Récupérer les méthodes de paiement actives
const getActivePaymentMethods = async (
    amount?: number,
    countryCode?: string
): Promise<PaymentMethod[]> => {
    try {
        // Récupérer toutes les méthodes de paiement
        const allMethods = await dbService.getByIndex<PaymentMethod>("paymentMethods", "isActive", true);
        
        // Filtrer selon les critères
        return allMethods
            .filter(method => {
                // Filtrer par montant si spécifié
                if (amount !== undefined) {
                    if (method.config.minAmount && amount < method.config.minAmount) return false;
                    if (method.config.maxAmount && amount > method.config.maxAmount) return false;
                }
                
                // Filtrer par pays si spécifié
                if (countryCode && !method.availableCountries.includes('*') && !method.availableCountries.includes(countryCode)) {
                    return false;
                }
                
                return true;
            })
            .sort((a, b) => a.position - b.position); // Trier par position
    } catch (error) {
        console.error("Error in getActivePaymentMethods:", error);
        return [];
    }
};

// Récupérer le détail d'une méthode de paiement
const getPaymentMethodById = async (id: string): Promise<PaymentMethod | null> => {
    try {
        const method = await dbService.getItemById<PaymentMethod>("paymentMethods", id);
        
        // Masquer les clés sensibles pour les utilisateurs non-admin
        if (method && !authService.isAdmin()) {
            const { config, ...safeMethod } = method;
            return {
                ...safeMethod,
                config: {
                    sandbox: config.sandbox,
                    handlingFee: config.handlingFee,
                    minAmount: config.minAmount,
                    maxAmount: config.maxAmount
                }
            };
        }
        
        return method;
    } catch (error) {
        console.error(`Error in getPaymentMethodById for ID ${id}:`, error);
        return null;
    }
};

// ===== MÉTHODES D'ADMINISTRATION =====

// Ajouter une méthode de paiement (admin uniquement)
const addPaymentMethod = async (
    name: string,
    type: PaymentMethod['type'],
    config: Partial<PaymentMethod['config']>,
    options: {
        instructions?: string;
        icon?: string;
        position?: number;
        requiresShipping?: boolean;
        availableCountries?: string[];
        isActive?: boolean;
    } = {}
): Promise<PaymentMethod> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        // Récupérer toutes les méthodes existantes pour déterminer la position par défaut
        const existingMethods = await dbService.getAllItems<PaymentMethod>("paymentMethods");
        const maxPosition = existingMethods.reduce((max, method) => Math.max(max, method.position), 0);
        
        // Créer la nouvelle méthode de paiement
        const newMethod: PaymentMethod = {
            id: `payment_method_${Date.now()}`,
            name,
            type,
            isActive: options.isActive !== undefined ? options.isActive : true,
            config: {
                sandbox: config.sandbox || true,
                apiKey: config.apiKey,
                secretKey: config.secretKey,
                merchantId: config.merchantId,
                handlingFee: config.handlingFee,
                minAmount: config.minAmount,
                maxAmount: config.maxAmount
            },
            instructions: options.instructions,
            icon: options.icon,
            position: options.position !== undefined ? options.position : maxPosition + 1,
            requiresShipping: options.requiresShipping !== undefined ? options.requiresShipping : true,
            availableCountries: options.availableCountries || ['*'],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await dbService.addItem("paymentMethods", newMethod);
        
        return newMethod;
    } catch (error) {
        console.error("Error in addPaymentMethod:", error);
        throw error;
    }
};

// Mettre à jour une méthode de paiement (admin uniquement)
const updatePaymentMethod = async (
    id: string,
    updates: Partial<Omit<PaymentMethod, 'id' | 'createdAt'>>
): Promise<PaymentMethod> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const method = await dbService.getItemById<PaymentMethod>("paymentMethods", id);
        
        if (!method) {
            throw new Error("Méthode de paiement non trouvée");
        }
        
        // Préparer les mises à jour
        const updatedMethod: PaymentMethod = {
            ...method,
            ...updates,
            config: {
                ...method.config,
                ...(updates.config || {})
            },
            updatedAt: new Date()
        };
        
        await dbService.updateItem("paymentMethods", updatedMethod);
        
        return updatedMethod;
    } catch (error) {
        console.error(`Error in updatePaymentMethod for ID ${id}:`, error);
        throw error;
    }
};

// Supprimer une méthode de paiement (admin uniquement)
const deletePaymentMethod = async (id: string): Promise<boolean> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        // Vérifier si la méthode existe
        const method = await dbService.getItemById<PaymentMethod>("paymentMethods", id);
        
        if (!method) {
            return false;
        }
        
        // Supprimer la méthode
        await dbService.deleteItem("paymentMethods", id);
        
        return true;
    } catch (error) {
        console.error(`Error in deletePaymentMethod for ID ${id}:`, error);
        return false;
    }
};

// Obtenir toutes les méthodes de paiement (admin uniquement)
const getAllPaymentMethods = async (): Promise<PaymentMethod[]> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        return await dbService.getAllItems<PaymentMethod>("paymentMethods");
    } catch (error) {
        console.error("Error in getAllPaymentMethods:", error);
        return [];
    }
};

// Réorganiser les méthodes de paiement (admin uniquement)
const reorderPaymentMethods = async (idOrder: string[]): Promise<boolean> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        // Récupérer toutes les méthodes de paiement
        const allMethods = await getAllPaymentMethods();
        
        // Vérifier que tous les IDs sont valides
        const validIds = allMethods.map(method => method.id);
        if (!idOrder.every(id => validIds.includes(id))) {
            throw new Error("Certains IDs de méthodes de paiement sont invalides");
        }
        
        // Mettre à jour les positions
        for (let i = 0; i < idOrder.length; i++) {
            const methodId = idOrder[i];
            const method = allMethods.find(m => m.id === methodId);
            
            if (method) {
                await updatePaymentMethod(methodId, { position: i + 1 });
            }
        }
        
        return true;
    } catch (error) {
        console.error("Error in reorderPaymentMethods:", error);
        return false;
    }
};

// Tester une configuration de paiement (admin uniquement)
const testPaymentConfiguration = async (
    type: PaymentMethod['type'],
    config: PaymentMethod['config']
): Promise<{
    success: boolean;
    message: string;
    details?: any;
}> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        // Dans une vraie application, on ferait un appel aux APIs des passerelles de paiement
        // Pour cette démo, on simule simplement une vérification de base
        
        let success = false;
        let message = "";
        
        switch (type) {
            case 'credit_card':
                if (!config.apiKey || !config.secretKey) {
                    message = "Clés API manquantes";
                } else {
                    success = true;
                    message = "Configuration validée avec succès";
                }
                break;
            case 'paypal':
                if (!config.apiKey || !config.secretKey || !config.merchantId) {
                    message = "Informations de compte PayPal incomplètes";
                } else {
                    success = true;
                    message = "Configuration PayPal validée";
                }
                break;
            case 'bank_transfer':
                success = true;
                message = "Configuration validée (pas de vérification requise pour les virements)";
                break;
            case 'cash_on_delivery':
                success = true;
                message = "Configuration validée (pas de vérification requise pour le paiement à la livraison)";
                break;
        }
        
        return {
            success,
            message,
            details: {
                testedIn: config.sandbox ? "Environnement de test" : "Environnement de production",
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error(`Error in testPaymentConfiguration for type ${type}:`, error);
        return {
            success: false,
            message: "Erreur lors du test de configuration"
        };
    }
};

// ===== TRANSACTIONS DE PAIEMENT =====

// Créer une transaction de paiement
const createPaymentTransaction = async (
    orderId: string,
    amount: number,
    paymentMethodId: string
): Promise<PaymentTransaction> => {
    try {
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }
        
        // Vérifier si la méthode de paiement existe et est active
        const paymentMethod = await getPaymentMethodById(paymentMethodId);
        
        if (!paymentMethod || !paymentMethod.isActive) {
            throw new Error("Méthode de paiement invalide ou inactive");
        }
        
        // Créer la transaction
        const newTransaction: PaymentTransaction = {
            id: `transaction_${Date.now()}`,
            orderId,
            userId: currentUser.id,
            amount,
            paymentMethodId,
            status: 'pending',
            transactionDate: new Date()
        };
        
        await dbService.addItem("paymentTransactions", newTransaction);
        
        return newTransaction;
    } catch (error) {
        console.error(`Error in createPaymentTransaction for order ${orderId}:`, error);
        throw error;
    }
};

// Mettre à jour le statut d'une transaction
const updateTransactionStatus = async (
    transactionId: string,
    status: PaymentTransaction['status'],
    details: {
        transactionId?: string;
        gatewayResponse?: any;
        refundedAmount?: number;
        notes?: string;
    } = {}
): Promise<PaymentTransaction> => {
    try {
        // Vérifier les permissions
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }
        
        const transaction = await dbService.getItemById<PaymentTransaction>("paymentTransactions", transactionId);
        
        if (!transaction) {
            throw new Error("Transaction non trouvée");
        }
        
        // Vérifier que l'utilisateur est autorisé (propriétaire ou admin)
        if (transaction.userId !== currentUser.id && !authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        // Mettre à jour la transaction
        const updatedTransaction: PaymentTransaction = {
            ...transaction,
            status,
            transactionId: details.transactionId || transaction.transactionId,
            gatewayResponse: details.gatewayResponse || transaction.gatewayResponse,
            refundedAmount: details.refundedAmount || transaction.refundedAmount,
            notes: details.notes || transaction.notes
        };
        
        await dbService.updateItem("paymentTransactions", updatedTransaction);
        
        return updatedTransaction;
    } catch (error) {
        console.error(`Error in updateTransactionStatus for transaction ${transactionId}:`, error);
        throw error;
    }
};

// Récupérer les transactions liées à une commande
const getTransactionsByOrderId = async (orderId: string): Promise<PaymentTransaction[]> => {
    try {
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }
        
        const transactions = await dbService.getByIndex<PaymentTransaction>("paymentTransactions", "orderId", orderId);
        
        // Vérifier que l'utilisateur est autorisé (propriétaire ou admin)
        const isOwner = transactions.some(transaction => transaction.userId === currentUser.id);
        
        if (!isOwner && !authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        return transactions;
    } catch (error) {
        console.error(`Error in getTransactionsByOrderId for order ${orderId}:`, error);
        return [];
    }
};

// Simuler un processus de paiement
const processPayment = async (
    transactionId: string,
    paymentDetails: any
): Promise<{
    success: boolean;
    message: string;
    transactionId?: string;
}> => {
    try {
        const transaction = await dbService.getItemById<PaymentTransaction>("paymentTransactions", transactionId);
        
        if (!transaction) {
            throw new Error("Transaction non trouvée");
        }
        
        const paymentMethod = await getPaymentMethodById(transaction.paymentMethodId);
        
        if (!paymentMethod) {
            throw new Error("Méthode de paiement non trouvée");
        }
        
        // Simuler un traitement de paiement
        // Dans une vraie application, ici on ferait appel à l'API de la passerelle de paiement
        
        const success = Math.random() > 0.1; // 90% de chance de succès
        
        if (success) {
            // Simuler un ID de transaction de la passerelle de paiement
            const gatewayTransactionId = `gw_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            
            // Mettre à jour la transaction
            await updateTransactionStatus(transactionId, 'completed', {
                transactionId: gatewayTransactionId,
                gatewayResponse: {
                    status: 'approved',
                    timestamp: new Date().toISOString(),
                    details: paymentDetails
                }
            });
            
            return {
                success: true,
                message: "Paiement traité avec succès",
                transactionId: gatewayTransactionId
            };
        } else {
            // Simuler une erreur
            await updateTransactionStatus(transactionId, 'failed', {
                gatewayResponse: {
                    status: 'declined',
                    timestamp: new Date().toISOString(),
                    errorCode: 'PAYMENT_DECLINED',
                    reason: 'Fonds insuffisants'
                }
            });
            
            return {
                success: false,
                message: "Le paiement a été refusé. Veuillez vérifier vos informations et réessayer."
            };
        }
    } catch (error) {
        console.error(`Error in processPayment for transaction ${transactionId}:`, error);
        
        // Mettre à jour la transaction avec l'erreur
        try {
            await updateTransactionStatus(transactionId, 'failed', {
                gatewayResponse: {
                    status: 'error',
                    timestamp: new Date().toISOString(),
                    errorCode: 'PROCESSING_ERROR',
                    errorMessage: error.message
                }
            });
        } catch (updateError) {
            console.error("Error updating transaction status:", updateError);
        }
        
        return {
            success: false,
            message: "Une erreur est survenue lors du traitement du paiement. Veuillez réessayer."
        };
    }
};

// Rembourser un paiement (admin uniquement)
const refundPayment = async (
    transactionId: string,
    amount?: number,
    reason?: string
): Promise<{
    success: boolean;
    message: string;
    refundId?: string;
}> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const transaction = await dbService.getItemById<PaymentTransaction>("paymentTransactions", transactionId);
        
        if (!transaction) {
            throw new Error("Transaction non trouvée");
        }
        
        if (transaction.status !== 'completed') {
            throw new Error("Seules les transactions complétées peuvent être remboursées");
        }
        
        // Déterminer le montant à rembourser
        const refundAmount = amount || transaction.amount;
        
        if (refundAmount <= 0 || refundAmount > transaction.amount) {
            throw new Error("Montant de remboursement invalide");
        }
        
        // Simuler un remboursement (dans une vraie application, appel à l'API de paiement)
        const refundId = `refund_${Date.now()}`;
        
        // Mettre à jour la transaction
        await updateTransactionStatus(transactionId, 'refunded', {
            refundedAmount: refundAmount,
            notes: reason ? `Remboursement : ${reason}` : "Remboursement traité",
            gatewayResponse: {
                ...transaction.gatewayResponse,
                refund: {
                    id: refundId,
                    amount: refundAmount,
                    timestamp: new Date().toISOString(),
                    reason
                }
            }
        });
        
        return {
            success: true,
            message: "Remboursement traité avec succès",
            refundId
        };
    } catch (error) {
        console.error(`Error in refundPayment for transaction ${transactionId}:`, error);
        return {
            success: false,
            message: error.message || "Erreur lors du remboursement"
        };
    }
};

// Initialiser les méthodes de paiement par défaut
const initDefaultPaymentMethods = async (): Promise<void> => {
    try {
        const existingMethods = await dbService.getAllItems<PaymentMethod>("paymentMethods");
        
        if (existingMethods.length === 0) {
            console.log("Initializing default payment methods...");
            
            // Créer les méthodes par défaut
            const defaultMethods = [
                {
                    name: "Carte de crédit",
                    type: "credit_card" as const,
                    config: {
                        sandbox: true,
                        apiKey: "demo_api_key",
                        secretKey: "demo_secret_key"
                    },
                    icon: "credit-card",
                    position: 1
                },
                {
                    name: "PayPal",
                    type: "paypal" as const,
                    config: {
                        sandbox: true,
                        apiKey: "demo_paypal_client_id",
                        secretKey: "demo_paypal_secret"
                    },
                    icon: "paypal",
                    position: 2
                },
                {
                    name: "Virement bancaire",
                    type: "bank_transfer" as const,
                    config: {
                        sandbox: true
                    },
                    instructions: "Veuillez effectuer votre virement sur le compte suivant: \nIBAN: FR76 1234 5678 9012 3456 7890 123\nBIC: BNPAFRPPXXX\nBanque: Banque Nationale\nRéférence: Votre numéro de commande",
                    icon: "bank",
                    position: 3
                },
                {
                    name: "Paiement à la livraison",
                    type: "cash_on_delivery" as const,
                    config: {
                        sandbox: true,
                        handlingFee: 5.0
                    },
                    icon: "cash",
                    position: 4
                }
            ];
            
            for (const method of defaultMethods) {
                await addPaymentMethod(
                    method.name,
                    method.type,
                    method.config,
                    {
                        instructions: method.instructions,
                        icon: method.icon,
                        position: method.position,
                        isActive: true
                    }
                );
            }
            
            console.log("Default payment methods initialized!");
        }
    } catch (error) {
        console.error("Error in initDefaultPaymentMethods:", error);
    }
};

export const paymentService = {
    // Méthodes publiques
    getActivePaymentMethods,
    getPaymentMethodById,
    createPaymentTransaction,
    getTransactionsByOrderId,
    processPayment,
    // Méthodes d'administration
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getAllPaymentMethods,
    reorderPaymentMethods,
    testPaymentConfiguration,
    refundPayment,
    // Initialisation
    initDefaultPaymentMethods
};