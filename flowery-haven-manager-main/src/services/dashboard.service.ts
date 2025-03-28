// src/services/dashboard.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';
import { orderService, Order } from './order.service';
import { productService, Product } from './product.service';
import { blogService } from './blog.service';

// Types pour les données du tableau de bord
export interface SalesData {
    period: string;
    revenue: number;
    orders: number;
    averageOrderValue: number;
    refunds?: number;
}

export interface ProductPerformance {
    id: string;
    name: string;
    unitsSold: number;
    revenue: number;
    views: number;
    conversionRate: number; // en pourcentage
    stock: number;
}

export interface CategoryPerformance {
    id: string;
    name: string;
    unitsSold: number;
    revenue: number;
    products: number;
    averagePrice: number;
}

export interface UserActivity {
    newUsers: number;
    activeUsers: number;
    totalUsers: number;
    newSubscribers: number;
    totalSubscribers: number;
}

export interface DashboardSummary {
    today: {
        revenue: number;
        orders: number;
        visitors: number;
        conversion: number; // en pourcentage
    };
    thisWeek: {
        revenue: number;
        orders: number;
        visitors: number;
        topProducts: Array<{id: string; name: string; unitsSold: number}>;
    };
    thisMonth: {
        revenue: number;
        orders: number;
        visitors: number;
        comparisonWithLastMonth: number; // en pourcentage
    };
}

// Vérifier les permissions d'admin
const checkAdminPermission = (): void => {
    if (!authService.isAdmin()) {
        throw new Error("Permission refusée. Seuls les administrateurs peuvent accéder à ces données.");
    }
};

// Récupérer un résumé pour le tableau de bord
const getDashboardSummary = async (): Promise<DashboardSummary> => {
    try {
        checkAdminPermission();
        
        // Dans une vraie application, ces données seraient calculées à partir de la base de données
        // Ici, nous simulons des données pour démonstration
        
        const now = new Date();
        
        // Récupérer toutes les commandes
        const allOrders = await orderService.getAllOrders();
        
        // Filtrer les commandes selon les périodes
        const todayOrders = allOrders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate.toDateString() === now.toDateString();
        });
        
        const thisWeekOrders = allOrders.filter(order => {
            const orderDate = new Date(order.orderDate);
            const diffTime = Math.abs(now.getTime() - orderDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7;
        });
        
        const thisMonthOrders = allOrders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        });
        
        const lastMonthOrders = allOrders.filter(order => {
            const orderDate = new Date(order.orderDate);
            const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear;
        });
        
        // Calculer les totaux
        const calculateRevenue = (orders: Order[]): number => {
            return orders.reduce((sum, order) => sum + order.total, 0);
        };
        
        const todayRevenue = calculateRevenue(todayOrders);
        const thisWeekRevenue = calculateRevenue(thisWeekOrders);
        const thisMonthRevenue = calculateRevenue(thisMonthOrders);
        const lastMonthRevenue = calculateRevenue(lastMonthOrders);
        
        // Calculer les produits les plus vendus cette semaine
        const productSales: Record<string, { id: string; name: string; unitsSold: number }> = {};
        
        for (const order of thisWeekOrders) {
            for (const item of order.orderItems) {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        id: item.productId,
                        name: item.name,
                        unitsSold: 0
                    };
                }
                productSales[item.productId].unitsSold += item.quantity;
            }
        }
        
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .slice(0, 5);
        
        // Calculer la comparaison avec le mois précédent
        const monthlyComparison = lastMonthRevenue === 0 
            ? 100 // Si aucune vente le mois dernier, on considère une croissance de 100%
            : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
        
        // Simuler des données de visiteurs et taux de conversion
        const visitors = {
            today: Math.floor(Math.random() * 500) + 100,
            thisWeek: Math.floor(Math.random() * 3000) + 700,
            thisMonth: Math.floor(Math.random() * 10000) + 3000
        };
        
        const conversionRate = todayOrders.length / visitors.today * 100;
        
        return {
            today: {
                revenue: todayRevenue,
                orders: todayOrders.length,
                visitors: visitors.today,
                conversion: parseFloat(conversionRate.toFixed(2))
            },
            thisWeek: {
                revenue: thisWeekRevenue,
                orders: thisWeekOrders.length,
                visitors: visitors.thisWeek,
                topProducts
            },
            thisMonth: {
                revenue: thisMonthRevenue,
                orders: thisMonthOrders.length,
                visitors: visitors.thisMonth,
                comparisonWithLastMonth: parseFloat(monthlyComparison.toFixed(2))
            }
        };
    } catch (error) {
        console.error("Error in getDashboardSummary:", error);
        throw error;
    }
};

// Récupérer les données de ventes par période
const getSalesData = async (
    period: 'day' | 'week' | 'month' | 'year',
    count: number = 12
): Promise<SalesData[]> => {
    try {
        checkAdminPermission();
        
        const allOrders = await orderService.getAllOrders();
        const now = new Date();
        const result: SalesData[] = [];
        
        // Fonction pour formater la date selon la période
        const formatPeriod = (date: Date, period: 'day' | 'week' | 'month' | 'year'): string => {
            switch (period) {
                case 'day':
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                case 'week':
                    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
                    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
                    return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
                case 'month':
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                case 'year':
                    return `${date.getFullYear()}`;
            }
        };
        
        // Générer les périodes à analyser
        const periods: string[] = [];
        let currentDate = new Date();
        
        for (let i = 0; i < count; i++) {
            periods.unshift(formatPeriod(currentDate, period));
            
            // Décrémenter la date selon la période
            switch (period) {
                case 'day':
                    currentDate.setDate(currentDate.getDate() - 1);
                    break;
                case 'week':
                    currentDate.setDate(currentDate.getDate() - 7);
                    break;
                case 'month':
                    currentDate.setMonth(currentDate.getMonth() - 1);
                    break;
                case 'year':
                    currentDate.setFullYear(currentDate.getFullYear() - 1);
                    break;
            }
        }
        
        // Calculer les données pour chaque période
        for (const periodLabel of periods) {
            const ordersInPeriod = allOrders.filter(order => {
                const orderDate = new Date(order.orderDate);
                return formatPeriod(orderDate, period) === periodLabel;
            });
            
            const revenue = ordersInPeriod.reduce((sum, order) => sum + order.total, 0);
            const orderCount = ordersInPeriod.length;
            const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;
            
            result.push({
                period: periodLabel,
                revenue,
                orders: orderCount,
                averageOrderValue
            });
        }
        
        return result;
    } catch (error) {
        console.error(`Error in getSalesData for period ${period}:`, error);
        throw error;
    }
};

// Récupérer les performances des produits
const getProductPerformance = async (
    sortBy: 'unitsSold' | 'revenue' | 'views' | 'conversionRate' = 'unitsSold',
    limit: number = 10
): Promise<ProductPerformance[]> => {
    try {
        checkAdminPermission();
        
        const allProducts = await productService.getAllProducts();
        const allOrders = await orderService.getAllOrders();
        
        // Calculer les ventes pour chaque produit
        const productPerformance: Record<string, ProductPerformance> = {};
        
        // Initialiser les données pour tous les produits
        for (const product of allProducts) {
            productPerformance[product.id] = {
                id: product.id,
                name: product.name,
                unitsSold: 0,
                revenue: 0,
                views: Math.floor(Math.random() * 1000) + 50, // Simulé
                conversionRate: 0,
                stock: product.stock
            };
        }
        
        // Agréger les données de ventes
        for (const order of allOrders) {
            if (order.status === 'cancelled') continue;
            
            for (const item of order.orderItems) {
                if (productPerformance[item.productId]) {
                    productPerformance[item.productId].unitsSold += item.quantity;
                    productPerformance[item.productId].revenue += item.price * item.quantity;
                }
            }
        }
        
        // Calculer les taux de conversion
        for (const id in productPerformance) {
            const perf = productPerformance[id];
            perf.conversionRate = perf.views > 0 
                ? (perf.unitsSold / perf.views) * 100 
                : 0;
        }
        
        // Trier et limiter les résultats
        return Object.values(productPerformance)
            .sort((a, b) => b[sortBy] - a[sortBy])
            .slice(0, limit);
    } catch (error) {
        console.error(`Error in getProductPerformance:`, error);
        throw error;
    }
};

// Récupérer les performances des catégories
const getCategoryPerformance = async (): Promise<CategoryPerformance[]> => {
    try {
        checkAdminPermission();
        
        const allProducts = await productService.getAllProducts();
        const allCategories = await productService.getAllCategories();
        const allOrders = await orderService.getAllOrders();
        
        // Calculer les ventes pour chaque catégorie
        const categoryPerformance: Record<string, CategoryPerformance> = {};
        
        // Initialiser les données pour toutes les catégories
        for (const category of allCategories) {
            categoryPerformance[category.id] = {
                id: category.id,
                name: category.name,
                unitsSold: 0,
                revenue: 0,
                products: 0,
                averagePrice: 0
            };
        }
        
        // Compter les produits par catégorie
        for (const product of allProducts) {
            if (categoryPerformance[product.category]) {
                categoryPerformance[product.category].products += 1;
            }
        }
        
        // Agréger les données de ventes
        for (const order of allOrders) {
            if (order.status === 'cancelled') continue;
            
            for (const item of order.orderItems) {
                const product = allProducts.find(p => p.id === item.productId);
                if (product && categoryPerformance[product.category]) {
                    categoryPerformance[product.category].unitsSold += item.quantity;
                    categoryPerformance[product.category].revenue += item.price * item.quantity;
                }
            }
        }
        
        // Calculer le prix moyen par catégorie
        for (const id in categoryPerformance) {
            const perf = categoryPerformance[id];
            if (perf.products > 0) {
                const categoryProducts = allProducts.filter(p => p.category === id);
                const totalPrice = categoryProducts.reduce((sum, p) => sum + p.price, 0);
                perf.averagePrice = totalPrice / perf.products;
            }
        }
        
        return Object.values(categoryPerformance);
    } catch (error) {
        console.error(`Error in getCategoryPerformance:`, error);
        throw error;
    }
};

// Récupérer les activités des utilisateurs
const getUserActivity = async (): Promise<UserActivity> => {
    try {
        checkAdminPermission();
        
        // Récupérer tous les utilisateurs
        const allUsers = await dbService.getAllItems("users");
        
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        
        // Compter les nouveaux utilisateurs des 30 derniers jours
        const newUsers = allUsers.filter(user => {
            const createdAt = new Date(user.createdAt);
            return createdAt >= thirtyDaysAgo;
        }).length;
        
        // Compter les utilisateurs actifs (ayant une date de connexion dans les 30 derniers jours)
        const activeUsers = allUsers.filter(user => {
            if (!user.lastLogin) return false;
            const lastLogin = new Date(user.lastLogin);
            return lastLogin >= thirtyDaysAgo;
        }).length;
        
        // Simuler les données d'abonnement à la newsletter
        const totalSubscribers = Math.floor(allUsers.length * 0.6); // ~60% des utilisateurs
        const newSubscribers = Math.floor(newUsers * 0.8); // ~80% des nouveaux utilisateurs
        
        return {
            newUsers,
            activeUsers,
            totalUsers: allUsers.length,
            newSubscribers,
            totalSubscribers
        };
    } catch (error) {
        console.error(`Error in getUserActivity:`, error);
        throw error;
    }
};

// Récupérer les statistiques du blog
const getBlogStats = async (): Promise<any> => {
    try {
        checkAdminPermission();
        
        const allPosts = await blogService.getAllPosts();
        
        // Calculer les statistiques
        const totalPosts = allPosts.length;
        const totalViews = allPosts.reduce((sum, post) => sum + (post.viewCount || 0), 0);
        const averageViewsPerPost = totalPosts > 0 ? totalViews / totalPosts : 0;
        
        // Trouver les posts les plus populaires
        const popularPosts = await blogService.getPopularPosts(5);
        
        // Obtenir les commentaires
        let totalComments = 0;
        const postWithMostComments = { postId: 0, commentCount: 0, title: '' };
        
        for (const post of allPosts) {
            const comments = await blogService.getCommentsForPost(post.id);
            totalComments += comments.length;
            
            if (comments.length > postWithMostComments.commentCount) {
                postWithMostComments.postId = post.id;
                postWithMostComments.commentCount = comments.length;
                postWithMostComments.title = post.title;
            }
        }
        
        return {
            totalPosts,
            totalViews,
            averageViewsPerPost,
            popularPosts: popularPosts.map(post => ({
                id: post.id,
                title: post.title,
                views: post.viewCount
            })),
            totalComments,
            postWithMostComments
        };
    } catch (error) {
        console.error(`Error in getBlogStats:`, error);
        throw error;
    }
};

// Récupérer les statistiques de commandes
const getOrderStats = async (): Promise<any> => {
    try {
        checkAdminPermission();
        
        const allOrders = await orderService.getAllOrders();
        
        // Compter les commandes par statut
        const ordersByStatus = {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
        };
        
        for (const order of allOrders) {
            ordersByStatus[order.status]++;
        }
        
        // Calculer le panier moyen
        const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
        const averageOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
        
        // Calculer le taux d'annulation
        const cancellationRate = allOrders.length > 0 
            ? (ordersByStatus.cancelled / allOrders.length) * 100 
            : 0;
        
        return {
            totalOrders: allOrders.length,
            totalRevenue,
            averageOrderValue,
            ordersByStatus,
            cancellationRate
        };
    } catch (error) {
        console.error(`Error in getOrderStats:`, error);
        throw error;
    }
};

// Exporter les données en CSV
const exportData = async (
    dataType: 'sales' | 'products' | 'categories' | 'orders' | 'users',
    period?: 'day' | 'week' | 'month' | 'year',
    count?: number
): Promise<string> => {
    try {
        checkAdminPermission();
        
        let data: any[] = [];
        let headers: string[] = [];
        
        // Récupérer les données selon le type
        switch (dataType) {
            case 'sales':
                data = await getSalesData(period || 'month', count || 12);
                headers = ['Période', 'Revenu', 'Commandes', 'Panier Moyen'];
                break;
            case 'products':
                data = await getProductPerformance('revenue');
                headers = ['ID', 'Nom', 'Unités Vendues', 'Revenu', 'Vues', 'Taux de Conversion', 'Stock'];
                break;
            case 'categories':
                data = await getCategoryPerformance();
                headers = ['ID', 'Nom', 'Unités Vendues', 'Revenu', 'Nombre de Produits', 'Prix Moyen'];
                break;
            case 'orders':
                data = await orderService.getAllOrders();
                headers = ['ID', 'Utilisateur', 'Date', 'Statut', 'Total', 'Nombre de Produits'];
                // Transformer les données pour l'export
                data = data.map(order => ({
                    id: order.id,
                    userId: order.userId,
                    date: new Date(order.orderDate).toISOString(),
                    status: order.status,
                    total: order.total,
                    itemCount: order.orderItems.length
                }));
                break;
            case 'users':
                data = await dbService.getAllItems("users");
                headers = ['ID', 'Email', 'Prénom', 'Nom', 'Rôle', 'Date d\'inscription', 'Dernière connexion'];
                // Transformer les données pour l'export
                data = data.map(user => ({
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    createdAt: new Date(user.createdAt).toISOString(),
                    lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : 'Jamais'
                }));
                break;
        }
        
        // Convertir en CSV
        const csvRows = [];
        
        // Ajouter les en-têtes
        csvRows.push(headers.join(','));
        
        // Ajouter les données
        for (const row of data) {
            const values = headers.map((header, index) => {
                const key = Object.keys(row)[index];
                const value = row[key];
                
                // Gérer les chaînes contenant des virgules
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                
                return value;
            });
            
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    } catch (error) {
        console.error(`Error in exportData for type ${dataType}:`, error);
        throw error;
    }
};

export const dashboardService = {
    getDashboardSummary,
    getSalesData,
    getProductPerformance,
    getCategoryPerformance,
    getUserActivity,
    getBlogStats,
    getOrderStats,
    exportData
};