// Combined User Service - Points directly to firestoreService logic
// This ensures no localStorage conflicts.

import { usersService } from './firestoreService';
import { doc, updateDoc } from 'firebase/firestore';
import { db, getServerTimestamp } from '@/lib/firebase';

export const userService = {
  // Get user profile
  async getUser(userId: string): Promise<any | null> {
    return await usersService.getById(userId);
  },

  // Update user profile in Firestore
  async updateUser(userId: string, updates: any): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: getServerTimestamp()
    });
  },

  // These can be added as simple fields in the User document in Firestore
  async savePreferences(userId: string, prefs: any): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { preferences: prefs });
  },

  async savePrivacySettings(userId: string, settings: any): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { privacy: settings });
  },

  async softDeleteAccount(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isActive: false, deletedAt: getServerTimestamp() });
  }
};
