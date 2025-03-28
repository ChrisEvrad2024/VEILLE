// src/services/login-history.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';

export interface LoginHistoryEntry {
    id: string;
    userId: string;
    timestamp: Date;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    device?: string;
    failureReason?: string;
}

/**
 * Record a successful login attempt
 */
const recordSuccessfulLogin = async (): Promise<void> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            console.error("Cannot record login for non-authenticated user");
            return;
        }

        const entry: LoginHistoryEntry = {
            id: `login_${Date.now()}`,
            userId: currentUser.id,
            timestamp: new Date(),
            success: true,
            userAgent: window.navigator.userAgent,
            // In a real app, we would get this from the server
            ipAddress: '127.0.0.1',
            // Parse user agent to get device info
            device: getDeviceInfo(),
            // In a real app, we might use IP geolocation
            location: 'France'
        };

        await dbService.addItem('loginHistory', entry);
    } catch (error) {
        console.error("Error recording successful login:", error);
    }
};

/**
 * Record a failed login attempt
 */
const recordFailedLogin = async (email: string, reason: string): Promise<void> => {
    try {
        // Try to find the user by email
        const users = await dbService.getByIndex('users', 'email', email);
        const userId = users && users.length > 0 ? users[0].id : `unknown_${email}`;

        const entry: LoginHistoryEntry = {
            id: `login_failed_${Date.now()}`,
            userId,
            timestamp: new Date(),
            success: false,
            userAgent: window.navigator.userAgent,
            ipAddress: '127.0.0.1', // In a real app, this would come from the server
            device: getDeviceInfo(),
            location: 'France', // In a real app, we might use IP geolocation
            failureReason: reason
        };

        await dbService.addItem('loginHistory', entry);
    } catch (error) {
        console.error("Error recording failed login:", error);
    }
};

/**
 * Get login history for the current user
 */
const getLoginHistory = async (limit: number = 10): Promise<LoginHistoryEntry[]> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            return [];
        }

        // Get login history by userId
        const entries = await dbService.getByIndex<LoginHistoryEntry>('loginHistory', 'userId', currentUser.id);

        if (!entries || entries.length === 0) {
            return [];
        }

        // Sort by timestamp descending (newest first) and limit the results
        return entries
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    } catch (error) {
        console.error("Error getting login history:", error);
        return [];
    }
};

/**
 * Get login history for a specific user (admin only)
 */
const getUserLoginHistory = async (userId: string, limit: number = 10): Promise<LoginHistoryEntry[]> => {
    try {
        // Check if user is admin
        if (!authService.isAdmin()) {
            throw new Error("Permission denied: Only administrators can access other users' login history");
        }

        // Get login history by userId
        const entries = await dbService.getByIndex<LoginHistoryEntry>('loginHistory', 'userId', userId);

        if (!entries) {
            return [];
        }

        // Sort by timestamp descending (newest first) and limit the results
        return entries
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    } catch (error) {
        console.error("Error getting user login history:", error);
        return [];
    }
};

/**
 * Clear login history for the current user
 */
const clearLoginHistory = async (): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            return false;
        }

        // Get all entries for this user
        const entries = await dbService.getByIndex<LoginHistoryEntry>('loginHistory', 'userId', currentUser.id);

        if (!entries || entries.length === 0) {
            return true;
        }

        // Delete each entry
        for (const entry of entries) {
            await dbService.deleteItem('loginHistory', entry.id);
        }

        return true;
    } catch (error) {
        console.error("Error clearing login history:", error);
        return false;
    }
};

/**
 * Helper function to parse user agent and get device info
 */
const getDeviceInfo = (): string => {
    const ua = window.navigator.userAgent;
    const browsers = [
        { name: 'Chrome', pattern: /Chrome\/(\d+)/ },
        { name: 'Firefox', pattern: /Firefox\/(\d+)/ },
        { name: 'Safari', pattern: /Safari\/(\d+)/ },
        { name: 'Edge', pattern: /Edg\/(\d+)/ },
        { name: 'Opera', pattern: /OPR\/(\d+)/ },
        { name: 'IE', pattern: /MSIE|Trident/ }
    ];

    const devices = [
        { name: 'iPhone', pattern: /iPhone/ },
        { name: 'iPad', pattern: /iPad/ },
        { name: 'Android', pattern: /Android/ },
        { name: 'Windows', pattern: /Windows/ },
        { name: 'Mac', pattern: /Macintosh/ },
        { name: 'Linux', pattern: /Linux/ }
    ];

    let browserInfo = 'Unknown Browser';
    let deviceInfo = 'Unknown Device';

    // Detect browser
    for (const browser of browsers) {
        const match = ua.match(browser.pattern);
        if (match) {
            browserInfo = match[1] ? `${browser.name} ${match[1]}` : browser.name;
            break;
        }
    }

    // Detect device
    for (const device of devices) {
        if (device.pattern.test(ua)) {
            deviceInfo = device.name;
            break;
        }
    }

    return `${deviceInfo}, ${browserInfo}`;
};

export const loginHistoryService = {
    recordSuccessfulLogin,
    recordFailedLogin,
    getLoginHistory,
    getUserLoginHistory,
    clearLoginHistory
};