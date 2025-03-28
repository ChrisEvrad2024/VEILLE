// src/services/analytics.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';

// Types pour les analytics
export interface PageView {
    id: string;
    pageUrl: string;
    pageTitle?: string;
    referrer?: string;
    timestamp: Date;
    sessionId: string;
    userId?: string;
    deviceType: 'desktop' | 'tablet' | 'mobile' | 'unknown';
    browser?: string;
    os?: string;
    countryCode?: string;
    regionCode?: string;
    city?: string;
    ip?: string;
    queryParams?: Record<string, string>;
}

export interface ProductView {
    id: string;
    productId: string;
    timestamp: Date;
    sessionId: string;
    userId?: string;
    deviceType: 'desktop' | 'tablet' | 'mobile' | 'unknown';
    referrer?: string;
    source?: string;
    timeSpent?: number; // en secondes
}

export interface CartAction {
    id: string;
    action: 'add' | 'remove' | 'update' | 'checkout' | 'abandon';
    productId?: string;
    quantity?: number;
    timestamp: Date;
    sessionId: string;
    userId?: string;
    deviceType: 'desktop' | 'tablet' | 'mobile' | 'unknown';
    cartValue?: number;
}

export interface SearchQuery {
    id: string;
    query: string;
    timestamp: Date;
    sessionId: string;
    userId?: string;
    resultsCount?: number;
    clickedResults?: string[]; // IDs des produits cliqués
    deviceType: 'desktop' | 'tablet' | 'mobile' | 'unknown';
}

export interface VisitorSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    userId?: string;
    deviceType: 'desktop' | 'tablet' | 'mobile' | 'unknown';
    browser?: string;
    os?: string;
    isNew: boolean;
    pagesViewed: number;
    productsViewed: number;
    cartActions: number;
    conversion?: boolean;
    orderId?: string;
    source?: string;
    campaign?: string;
    medium?: string;
    referrer?: string;
    landingPage: string;
    exitPage?: string;
    bounced: boolean; // Une seule page vue
    deviceInfo?: any;
}

// Générer un ID de session unique
const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Détecter le type d'appareil (dans une application réelle, cette fonction serait plus sophistiquée)
const detectDeviceType = (userAgent: string): 'desktop' | 'tablet' | 'mobile' | 'unknown' => {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('ipad') || ua.includes('tablet')) {
        return 'tablet';
    } else if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'mobile';
    } else if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
        return 'desktop';
    }
    
    return 'unknown';
};

// Détecter le navigateur (version simplifiée)
const detectBrowser = (userAgent: string): string => {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('firefox')) {
        return 'Firefox';
    } else if (ua.includes('chrome')) {
        return 'Chrome';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
        return 'Safari';
    } else if (ua.includes('edge')) {
        return 'Edge';
    } else if (ua.includes('opera') || ua.includes('opr')) {
        return 'Opera';
    }
    
    return 'Unknown';
};

// Détecter le système d'exploitation (version simplifiée)
const detectOS = (userAgent: string): string => {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('windows')) {
        return 'Windows';
    } else if (ua.includes('macintosh') || ua.includes('mac os')) {
        return 'macOS';
    } else if (ua.includes('linux')) {
        return 'Linux';
    } else if (ua.includes('android')) {
        return 'Android';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
        return 'iOS';
    }
    
    return 'Unknown';
};

// ===== TRACKING DES VUES DE PAGES =====

// Enregistrer une vue de page
const trackPageView = async (
    pageUrl: string,
    pageTitle: string,
    referrer?: string,
    queryParams?: Record<string, string>
): Promise<void> => {
    try {
        // Simuler des données de navigateur
        const userAgent = navigator.userAgent;
        const deviceType = detectDeviceType(userAgent);
        const browser = detectBrowser(userAgent);
        const os = detectOS(userAgent);
        
        // Récupérer l'ID de session du localStorage ou en créer un nouveau
        let sessionId = localStorage.getItem('analyticsSessionId');
        if (!sessionId) {
            sessionId = generateSessionId();
            localStorage.setItem('analyticsSessionId', sessionId);
            
            // Initialiser une nouvelle session
            await initSession(sessionId, pageUrl, referrer);
        } else {
            // Mettre à jour la session existante
            await updateSessionActivity(sessionId, pageUrl);
        }
        
        // Récupérer l'ID utilisateur si connecté
        const currentUser = authService.getCurrentUser();
        const userId = currentUser?.id;
        
        // Créer l'enregistrement de vue de page
        const pageView: PageView = {
            id: `pageview_${Date.now()}`,
            pageUrl,
            pageTitle,
            referrer,
            timestamp: new Date(),
            sessionId,
            userId,
            deviceType,
            browser,
            os,
            queryParams
        };
        
        await dbService.addItem("analyticsPageViews", pageView);
    } catch (error) {
        console.error(`Error in trackPageView for page ${pageUrl}:`, error);
    }
};

// Initialiser une nouvelle session
const initSession = async (sessionId: string, landingPage: string, referrer?: string): Promise<void> => {
    try {
        // Récupérer l'ID utilisateur si connecté
        const currentUser = authService.getCurrentUser();
        const userId = currentUser?.id;
        
        // Simuler des données de navigateur
        const userAgent = navigator.userAgent;
        const deviceType = detectDeviceType(userAgent);
        const browser = detectBrowser(userAgent);
        const os = detectOS(userAgent);
        
        // Extraire les paramètres UTM pour les campagnes
        const url = new URL(window.location.href);
        const source = url.searchParams.get('utm_source') || referrer || 'direct';
        const campaign = url.searchParams.get('utm_campaign') || undefined;
        const medium = url.searchParams.get('utm_medium') || undefined;
        
        // Vérifier si c'est un nouvel utilisateur
        const isNew = !localStorage.getItem('analyticsFirstVisit');
        if (isNew) {
            localStorage.setItem('analyticsFirstVisit', Date.now().toString());
        }
        
        // Créer la session
        const session: VisitorSession = {
            id: sessionId,
            startTime: new Date(),
            userId,
            deviceType,
            browser,
            os,
            isNew,
            pagesViewed: 1,
            productsViewed: 0,
            cartActions: 0,
            source,
            campaign,
            medium,
            referrer,
            landingPage,
            bounced: true // Par défaut, considéré comme bounce jusqu'à preuve du contraire
        };
        
        await dbService.addItem("analyticsSessions", session);
    } catch (error) {
        console.error(`Error in initSession for session ${sessionId}:`, error);
    }
};

// Mettre à jour l'activité d'une session
const updateSessionActivity = async (sessionId: string, currentPage: string): Promise<void> => {
    try {
        const session = await dbService.getItemById<VisitorSession>("analyticsSessions", sessionId);
        
        if (!session) {
            // Si la session n'existe pas (peut arriver si la base est effacée), en créer une nouvelle
            await initSession(sessionId, currentPage);
            return;
        }
        
        // Récupérer l'ID utilisateur si connecté
        const currentUser = authService.getCurrentUser();
        const userId = currentUser?.id || session.userId;
        
        // Mettre à jour la session
        const updatedSession: VisitorSession = {
            ...session,
            endTime: new Date(),
            userId,
            pagesViewed: session.pagesViewed + 1,
            exitPage: currentPage,
            bounced: false // Plus d'une page vue, donc pas un bounce
        };
        
        await dbService.updateItem("analyticsSessions", updatedSession);
    } catch (error) {
        console.error(`Error in updateSessionActivity for session ${sessionId}:`, error);
    }
};

// ===== TRACKING DES PRODUITS =====

// Enregistrer une vue de produit
const trackProductView = async (
    productId: string,
    referrer?: string,
    source?: string
): Promise<void> => {
    try {
        // Récupérer l'ID de session
        const sessionId = localStorage.getItem('analyticsSessionId') || generateSessionId();
        
        // Récupérer l'ID utilisateur si connecté
        const currentUser = authService.getCurrentUser();
        const userId = currentUser?.id;
        
        // Simuler des données de navigateur
        const userAgent = navigator.userAgent;
        const deviceType = detectDeviceType(userAgent);
        
        // Créer l'enregistrement de vue de produit
        const productView: ProductView = {
            id: `productview_${Date.now()}`,
            productId,
            timestamp: new Date(),
            sessionId,
            userId,
            deviceType,
            referrer,
            source
        };
        
        await dbService.addItem("analyticsProductViews", productView);
        
        // Mettre à jour la session
        await updateSessionProductView(sessionId);
    } catch (error) {
        console.error(`Error in trackProductView for product ${productId}:`, error);
    }
};

// Mettre à jour le compteur de produits vus dans la session
const updateSessionProductView = async (sessionId: string): Promise<void> => {
    try {
        const session = await dbService.getItemById<VisitorSession>("analyticsSessions", sessionId);
        
        if (!session) return;
        
        const updatedSession: VisitorSession = {
            ...session,
            productsViewed: session.productsViewed + 1,
            endTime: new Date()
        };
        
        await dbService.updateItem("analyticsSessions", updatedSession);
    } catch (error) {
        console.error(`Error in updateSessionProductView for session ${sessionId}:`, error);
    }
};

// ===== TRACKING DU PANIER =====

// Enregistrer une action sur le panier
const trackCartAction = async (
    action: CartAction['action'],
    productId?: string,
    quantity?: number,
    cartValue?: number
): Promise<void> => {
    try {
        // Récupérer l'ID de session
        const sessionId = localStorage.getItem('analyticsSessionId') || generateSessionId();
        
        // Récupérer l'ID utilisateur si connecté
        const currentUser = authService.getCurrentUser();
        const userId = currentUser?.id;
        
        // Simuler des données de navigateur
        const userAgent = navigator.userAgent;
        const deviceType = detectDeviceType(userAgent);
        
        // Créer l'enregistrement d'action sur le panier
        const cartAction: CartAction = {
            id: `cartaction_${Date.now()}`,
            action,
            productId,
            quantity,
            timestamp: new Date(),
            sessionId,
            userId,
            deviceType,
            cartValue
        };
        
        await dbService.addItem("analyticsCartActions", cartAction);
        
        // Mettre à jour la session
        await updateSessionCartAction(sessionId, action);
    } catch (error) {
        console.error(`Error in trackCartAction for action ${action}:`, error);
    }
};

// Mettre à jour le compteur d'actions sur le panier dans la session
const updateSessionCartAction = async (sessionId: string, action: CartAction['action']): Promise<void> => {
    try {
        const session = await dbService.getItemById<VisitorSession>("analyticsSessions", sessionId);
        
        if (!session) return;
        
        const updatedSession: VisitorSession = {
            ...session,
            cartActions: session.cartActions + 1,
            endTime: new Date()
        };
        
        // Si c'est un checkout, marquer la conversion
        if (action === 'checkout') {
            updatedSession.conversion = true;
        }
        
        await dbService.updateItem("analyticsSessions", updatedSession);
    } catch (error) {
        console.error(`Error in updateSessionCartAction for session ${sessionId}:`, error);
    }
};

// ===== TRACKING DES RECHERCHES =====

// Enregistrer une recherche
const trackSearch = async (
    query: string,
    resultsCount: number
): Promise<void> => {
    try {
        // Récupérer l'ID de session
        const sessionId = localStorage.getItem('analyticsSessionId') || generateSessionId();
        
        // Récupérer l'ID utilisateur si connecté
        const currentUser = authService.getCurrentUser();
        const userId = currentUser?.id;
        
        // Simuler des données de navigateur
        const userAgent = navigator.userAgent;
        const deviceType = detectDeviceType(userAgent);
        
        // Créer l'enregistrement de recherche
        const searchQuery: SearchQuery = {
            id: `search_${Date.now()}`,
            query,
            timestamp: new Date(),
            sessionId,
            userId,
            resultsCount,
            deviceType
        };
        
        await dbService.addItem("analyticsSearches", searchQuery);
    } catch (error) {
        console.error(`Error in trackSearch for query ${query}:`, error);
    }
};

// Enregistrer un clic sur un résultat de recherche
const trackSearchResultClick = async (
    searchId: string,
    productId: string
): Promise<void> => {
    try {
        const search = await dbService.getItemById<SearchQuery>("analyticsSearches", searchId);
        
        if (!search) return;
        
        const clickedResults = search.clickedResults || [];
        
        if (!clickedResults.includes(productId)) {
            const updatedSearch: SearchQuery = {
                ...search,
                clickedResults: [...clickedResults, productId]
            };
            
            await dbService.updateItem("analyticsSearches", updatedSearch);
        }
    } catch (error) {
        console.error(`Error in trackSearchResultClick for search ${searchId} and product ${productId}:`, error);
    }
};

// ===== FONCTIONS ADMIN POUR RAPPORT =====

// Vérifier les permissions d'admin
const checkAdminPermission = (): void => {
    if (!authService.isAdmin()) {
        throw new Error("Permission refusée. Seuls les administrateurs peuvent accéder à ces données.");
    }
};

// Obtenir les statistiques de pages vues
const getPageViewStats = async (
    startDate?: Date,
    endDate?: Date
): Promise<{
    totalViews: number;
    uniqueVisitors: number;
    mostViewedPages: Array<{ url: string; title: string; views: number }>;
    viewsByDevice: Record<string, number>;
    viewsByBrowser: Record<string, number>;
    viewsByHour: Record<string, number>;
}> => {
    try {
        checkAdminPermission();
        
        // Récupérer toutes les vues de pages
        let pageViews = await dbService.getAllItems<PageView>("analyticsPageViews");
        
        // Filtrer par période si spécifiée
        if (startDate) {
            pageViews = pageViews.filter(view => new Date(view.timestamp) >= startDate);
        }
        
        if (endDate) {
            pageViews = pageViews.filter(view => new Date(view.timestamp) <= endDate);
        }
        
        // Calculer le nombre total de vues
        const totalViews = pageViews.length;
        
        // Calculer le nombre de visiteurs uniques (par sessionId)
        const uniqueVisitors = new Set(pageViews.map(view => view.sessionId)).size;
        
        // Calculer les pages les plus vues
        const pageViewCount: Record<string, { url: string; title: string; views: number }> = {};
        
        for (const view of pageViews) {
            if (!pageViewCount[view.pageUrl]) {
                pageViewCount[view.pageUrl] = {
                    url: view.pageUrl,
                    title: view.pageTitle || view.pageUrl,
                    views: 0
                };
            }
            
            pageViewCount[view.pageUrl].views++;
        }
        
        const mostViewedPages = Object.values(pageViewCount)
            .sort((a, b) => b.views - a.views)
            .slice(0, 10); // Top 10
        
        // Vues par appareil
        const viewsByDevice: Record<string, number> = {};
        
        for (const view of pageViews) {
            viewsByDevice[view.deviceType] = (viewsByDevice[view.deviceType] || 0) + 1;
        }
        
        // Vues par navigateur
        const viewsByBrowser: Record<string, number> = {};
        
        for (const view of pageViews) {
            if (view.browser) {
                viewsByBrowser[view.browser] = (viewsByBrowser[view.browser] || 0) + 1;
            }
        }
        
        // Vues par heure de la journée
        const viewsByHour: Record<string, number> = {};
        
        for (const view of pageViews) {
            const hour = new Date(view.timestamp).getHours();
            viewsByHour[hour] = (viewsByHour[hour] || 0) + 1;
        }
        
        return {
            totalViews,
            uniqueVisitors,
            mostViewedPages,
            viewsByDevice,
            viewsByBrowser,
            viewsByHour
        };
    } catch (error) {
        console.error("Error in getPageViewStats:", error);
        throw error;
    }
};

// Obtenir les statistiques de produits
const getProductViewStats = async (
    startDate?: Date,
    endDate?: Date
): Promise<{
    totalViews: number;
    mostViewedProducts: Array<{ productId: string; views: number }>;
    viewsByDevice: Record<string, number>;
    conversionRate: Record<string, number>; // par productId
}> => {
    try {
        checkAdminPermission();
        
        // Récupérer toutes les vues de produits
        let productViews = await dbService.getAllItems<ProductView>("analyticsProductViews");
        
        // Filtrer par période si spécifiée
        if (startDate) {
            productViews = productViews.filter(view => new Date(view.timestamp) >= startDate);
        }
        
        if (endDate) {
            productViews = productViews.filter(view => new Date(view.timestamp) <= endDate);
        }
        
        // Calculer le nombre total de vues
        const totalViews = productViews.length;
        
        // Calculer les produits les plus vus
        const productViewCount: Record<string, number> = {};
        
        for (const view of productViews) {
            productViewCount[view.productId] = (productViewCount[view.productId] || 0) + 1;
        }
        
        const mostViewedProducts = Object.entries(productViewCount)
            .map(([productId, views]) => ({ productId, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10); // Top 10
        
        // Vues par appareil
        const viewsByDevice: Record<string, number> = {};
        
        for (const view of productViews) {
            viewsByDevice[view.deviceType] = (viewsByDevice[view.deviceType] || 0) + 1;
        }
        
        // Simuler les taux de conversion par produit
        // Dans une vraie application, on croiserait avec les données de commandes
        const conversionRate: Record<string, number> = {};
        
        for (const productId in productViewCount) {
            // Simulation: entre 1% et 10% de conversion
            conversionRate[productId] = Math.round((Math.random() * 9 + 1) * 10) / 10; // 1.0 à 10.0 avec 1 décimale
        }
        
        return {
            totalViews,
            mostViewedProducts,
            viewsByDevice,
            conversionRate
        };
    } catch (error) {
        console.error("Error in getProductViewStats:", error);
        throw error;
    }
};

// Obtenir les statistiques de panier
const getCartStats = async (
    startDate?: Date,
    endDate?: Date
): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    abandonRate: number;
    topAddedProducts: Array<{ productId: string; count: number }>;
    topRemovedProducts: Array<{ productId: string; count: number }>;
}> => {
    try {
        checkAdminPermission();
        
        // Récupérer toutes les actions de panier
        let cartActions = await dbService.getAllItems<CartAction>("analyticsCartActions");
        
        // Filtrer par période si spécifiée
        if (startDate) {
            cartActions = cartActions.filter(action => new Date(action.timestamp) >= startDate);
        }
        
        if (endDate) {
            cartActions = cartActions.filter(action => new Date(action.timestamp) <= endDate);
        }
        
        // Calculer le nombre total d'actions
        const totalActions = cartActions.length;
        
        // Compter les actions par type
        const actionsByType: Record<string, number> = {};
        
        for (const action of cartActions) {
            actionsByType[action.action] = (actionsByType[action.action] || 0) + 1;
        }
        
        // Calculer le taux d'abandon
        const addToCartCount = actionsByType['add'] || 0;
        const checkoutCount = actionsByType['checkout'] || 0;
        const abandonRate = addToCartCount > 0 
            ? ((addToCartCount - checkoutCount) / addToCartCount) * 100 
            : 0;
        
        // Produits les plus ajoutés au panier
        const addedProducts: Record<string, number> = {};
        
        for (const action of cartActions) {
            if (action.action === 'add' && action.productId) {
                addedProducts[action.productId] = (addedProducts[action.productId] || 0) + 1;
            }
        }
        
        const topAddedProducts = Object.entries(addedProducts)
            .map(([productId, count]) => ({ productId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10
        
        // Produits les plus retirés du panier
        const removedProducts: Record<string, number> = {};
        
        for (const action of cartActions) {
            if (action.action === 'remove' && action.productId) {
                removedProducts[action.productId] = (removedProducts[action.productId] || 0) + 1;
            }
        }
        
        const topRemovedProducts = Object.entries(removedProducts)
            .map(([productId, count]) => ({ productId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10
        
        return {
            totalActions,
            actionsByType,
            abandonRate,
            topAddedProducts,
            topRemovedProducts
        };
    } catch (error) {
        console.error("Error in getCartStats:", error);
        throw error;
    }
};

// Obtenir les statistiques de recherche
const getSearchStats = async (
    startDate?: Date,
    endDate?: Date
): Promise<{
    totalSearches: number;
    avgResultsCount: number;
    topQueries: Array<{ query: string; count: number; avgResults: number }>;
    queriesWithNoResults: Array<{ query: string; count: number }>;
    clickThroughRate: number;
}> => {
    try {
        checkAdminPermission();
        
        // Récupérer toutes les recherches
        let searches = await dbService.getAllItems<SearchQuery>("analyticsSearches");
        
        // Filtrer par période si spécifiée
        if (startDate) {
            searches = searches.filter(search => new Date(search.timestamp) >= startDate);
        }
        
        if (endDate) {
            searches = searches.filter(search => new Date(search.timestamp) <= endDate);
        }
        
        // Calculer le nombre total de recherches
        const totalSearches = searches.length;
        
        // Calculer le nombre moyen de résultats
        const totalResults = searches.reduce((sum, search) => sum + (search.resultsCount || 0), 0);
        const avgResultsCount = totalSearches > 0 ? totalResults / totalSearches : 0;
        
        // Calculer les requêtes les plus populaires
        const queryCount: Record<string, { count: number; results: number[] }> = {};
        
        for (const search of searches) {
            const query = search.query.toLowerCase().trim();
            
            if (!queryCount[query]) {
                queryCount[query] = { count: 0, results: [] };
            }
            
            queryCount[query].count++;
            
            if (search.resultsCount !== undefined) {
                queryCount[query].results.push(search.resultsCount);
            }
        }
        
        const topQueries = Object.entries(queryCount)
            .map(([query, data]) => ({
                query,
                count: data.count,
                avgResults: data.results.length > 0 
                    ? data.results.reduce((sum, count) => sum + count, 0) / data.results.length 
                    : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10
        
        // Calculer les requêtes sans résultats
        const queriesWithNoResults = Object.entries(queryCount)
            .filter(([_, data]) => data.results.some(count => count === 0))
            .map(([query, data]) => ({
                query,
                count: data.results.filter(count => count === 0).length
            }))
            .sort((a, b) => b.count - a.count);
        
        // Calculer le taux de clic (Click-through rate)
        const searchesWithClicks = searches.filter(search => search.clickedResults && search.clickedResults.length > 0).length;
        const clickThroughRate = totalSearches > 0 ? (searchesWithClicks / totalSearches) * 100 : 0;
        
        return {
            totalSearches,
            avgResultsCount,
            topQueries,
            queriesWithNoResults,
            clickThroughRate
        };
    } catch (error) {
        console.error("Error in getSearchStats:", error);
        throw error;
    }
};

// Obtenir les statistiques de sessions
const getSessionStats = async (
    startDate?: Date,
    endDate?: Date
): Promise<{
    totalSessions: number;
    newVisitors: number;
    returningVisitors: number;
    avgSessionDuration: number; // en secondes
    avgPagesPerSession: number;
    bounceRate: number; // en pourcentage
    conversionRate: number; // en pourcentage
    sessionsByDevice: Record<string, number>;
    sessionsBySource: Record<string, number>;
    sessionsByCampaign: Record<string, number>;
}> => {
    try {
        checkAdminPermission();
        
        // Récupérer toutes les sessions
        let sessions = await dbService.getAllItems<VisitorSession>("analyticsSessions");
        
        // Filtrer par période si spécifiée
        if (startDate) {
            sessions = sessions.filter(session => new Date(session.startTime) >= startDate);
        }
        
        if (endDate) {
            sessions = sessions.filter(session => new Date(session.startTime) <= endDate);
        }
        
        // Calculer le nombre total de sessions
        const totalSessions = sessions.length;
        
        // Calculer le nombre de nouveaux et de visiteurs récurrents
        const newVisitors = sessions.filter(session => session.isNew).length;
        const returningVisitors = totalSessions - newVisitors;
        
        // Calculer la durée moyenne des sessions
        let totalDuration = 0;
        let sessionsWithDuration = 0;
        
        for (const session of sessions) {
            if (session.endTime) {
                const start = new Date(session.startTime).getTime();
                const end = new Date(session.endTime).getTime();
                const duration = (end - start) / 1000; // en secondes
                
                totalDuration += duration;
                sessionsWithDuration++;
            }
        }
        
        const avgSessionDuration = sessionsWithDuration > 0 ? totalDuration / sessionsWithDuration : 0;
        
        // Calculer le nombre moyen de pages par session
        const totalPages = sessions.reduce((sum, session) => sum + session.pagesViewed, 0);
        const avgPagesPerSession = totalSessions > 0 ? totalPages / totalSessions : 0;
        
        // Calculer le taux de rebond
        const bouncedSessions = sessions.filter(session => session.bounced).length;
        const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;
        
        // Calculer le taux de conversion
        const convertedSessions = sessions.filter(session => session.conversion).length;
        const conversionRate = totalSessions > 0 ? (convertedSessions / totalSessions) * 100 : 0;
        
        // Sessions par type d'appareil
        const sessionsByDevice: Record<string, number> = {};
        
        for (const session of sessions) {
            sessionsByDevice[session.deviceType] = (sessionsByDevice[session.deviceType] || 0) + 1;
        }
        
        // Sessions par source
        const sessionsBySource: Record<string, number> = {};
        
        for (const session of sessions) {
            if (session.source) {
                sessionsBySource[session.source] = (sessionsBySource[session.source] || 0) + 1;
            }
        }
        
        // Sessions par campagne
        const sessionsByCampaign: Record<string, number> = {};
        
        for (const session of sessions) {
            if (session.campaign) {
                sessionsByCampaign[session.campaign] = (sessionsByCampaign[session.campaign] || 0) + 1;
            }
        }
        
        return {
            totalSessions,
            newVisitors,
            returningVisitors,
            avgSessionDuration,
            avgPagesPerSession,
            bounceRate,
            conversionRate,
            sessionsByDevice,
            sessionsBySource,
            sessionsByCampaign
        };
    } catch (error) {
        console.error("Error in getSessionStats:", error);
        throw error;
    }
};

export const analyticsService = {
    // Fonctions de tracking
    trackPageView,
    trackProductView,
    trackCartAction,
    trackSearch,
    trackSearchResultClick,
    // Fonctions de rapport (admin uniquement)
    getPageViewStats,
    getProductViewStats,
    getCartStats,
    getSearchStats,
    getSessionStats
};