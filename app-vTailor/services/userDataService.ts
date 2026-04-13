import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '@/contexts/AuthContext';

// User-specific data storage keys
const userCustomizationsKey = (userId: string) => `customizations_${userId}`;
const userMeasurementsKey = (userId: string) => `measurements_${userId}`;
const userOrdersKey = (userId: string) => `orders_${userId}`;

/**
 * On first login with an email, migrate any existing global CUSTOMIZATIONS to user-specific storage.
 * This allows users to have their customizations restored when they log back in.
 */
export async function migrateCustomizationsToUser(userId: string): Promise<void> {
  try {
    // Check if user already has customizations
    const userCustomizationsJson = await AsyncStorage.getItem(userCustomizationsKey(userId));
    if (userCustomizationsJson) {
      // User already has their own customizations, no need to migrate
      return;
    }

    // Check if there's a global CUSTOMIZATIONS key (from pre-user-id era)
    const globalCustomizationsJson = await AsyncStorage.getItem('CUSTOMIZATIONS');
    if (globalCustomizationsJson) {
      // Migrate to user-specific key
      await AsyncStorage.setItem(userCustomizationsKey(userId), globalCustomizationsJson);
      // Optionally keep the global key for backward compat, or remove it
      // For now, we'll keep both for backward compatibility
    }
  } catch (error) {
    console.warn('Failed to migrate customizations for user:', error);
  }
}

/**
 * Get all customizations for the current user.
 * Falls back to global CUSTOMIZATIONS key if user-specific key doesn't exist (backward compat).
 */
export async function getUserCustomizations(userId: string): Promise<any[]> {
  try {
    // Try user-specific key first
    const userCustomizationsJson = await AsyncStorage.getItem(userCustomizationsKey(userId));
    if (userCustomizationsJson) {
      return JSON.parse(userCustomizationsJson);
    }

    // Fall back to global key (backward compat)
    const globalCustomizationsJson = await AsyncStorage.getItem('CUSTOMIZATIONS');
    if (globalCustomizationsJson) {
      return JSON.parse(globalCustomizationsJson);
    }

    return [];
  } catch (error) {
    console.error('Failed to get customizations:', error);
    return [];
  }
}

/**
 * Save a new customization for the user.
 * Stores in both user-specific and global keys for backward compat.
 */
export async function saveUserCustomization(userId: string, customization: any): Promise<void> {
  try {
    // Get existing customizations
    const customizations = await getUserCustomizations(userId);
    customizations.push(customization);

    // Save to user-specific key
    await AsyncStorage.setItem(userCustomizationsKey(userId), JSON.stringify(customizations));

    // Also update global key for backward compat
    await AsyncStorage.setItem('CUSTOMIZATIONS', JSON.stringify(customizations));
  } catch (error) {
    console.error('Failed to save customization:', error);
  }
}

/**
 * Get all measurements for the current user.
 */
export async function getUserMeasurements(userId: string): Promise<any> {
  try {
    const measurementsJson = await AsyncStorage.getItem(userMeasurementsKey(userId));
    return measurementsJson ? JSON.parse(measurementsJson) : null;
  } catch (error) {
    console.error('Failed to get measurements:', error);
    return null;
  }
}

/**
 * Save measurements for the user.
 */
export async function saveUserMeasurements(userId: string, measurements: any): Promise<void> {
  try {
    await AsyncStorage.setItem(userMeasurementsKey(userId), JSON.stringify(measurements));
  } catch (error) {
    console.error('Failed to save measurements:', error);
  }
}

/**
 * Get all orders for the current user.
 */
export async function getUserOrders(userId: string): Promise<any[]> {
  try {
    const ordersJson = await AsyncStorage.getItem(userOrdersKey(userId));
    return ordersJson ? JSON.parse(ordersJson) : [];
  } catch (error) {
    console.error('Failed to get orders:', error);
    return [];
  }
}

/**
 * Save orders for the user.
 */
export async function saveUserOrders(userId: string, orders: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(userOrdersKey(userId), JSON.stringify(orders));
  } catch (error) {
    console.error('Failed to save orders:', error);
  }
}

/**
 * Add a new order for the user.
 */
export async function addUserOrder(userId: string, order: any): Promise<void> {
  try {
    const orders = await getUserOrders(userId);
    orders.push(order);
    await saveUserOrders(userId, orders);
  } catch (error) {
    console.error('Failed to add order:', error);
  }
}

/**
 * Clear all user-specific data (called on logout).
 */
export async function clearUserData(userId: string): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      userCustomizationsKey(userId),
      userMeasurementsKey(userId),
      userOrdersKey(userId),
    ]);
  } catch (error) {
    console.error('Failed to clear user data:', error);
  }
}
