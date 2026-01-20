
import React from 'react';

export enum AppRoutes {
  HOME = '/',
  AI_ASSISTANT = '/ai-assistant',
  CREATE_POST = '/create-post',
  PET_PROFILE = '/pet-profile',
  HEALTH_CHECKUP = '/health-checkup',
  PET_CARE = '/pet-care',
  SETTINGS = '/settings',
  TERMS = '/terms',
  PRIVACY = '/privacy',
  CHAT = '/chat',
  FIND_FRIENDS = '/find-friends',
  CONTACT = '/contact',
}

export interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber?: string;
  username?: string;
  lowercaseDisplayName?: string;
}

export interface WeightRecord {
  date: string;
  weight: number;
}

export interface VaccinationRecord {
  name: string;
  date: string;
  nextDueDate: string;
}

export interface PetProfile {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string;
  birthday: string;
  bio: string;
  temperament?: string;
  avatarStylePreference?: string;
  avatarUrl?: string;
  qrCodeUrl?: string;
  ageYears?: string;
  ageMonths?: string;
  healthNotes?: string;
  weightHistory: WeightRecord[];
  vaccinations: VaccinationRecord[];
  isPublic: boolean;
  ownerName: string;
  lowercaseName?: string;
}

// FIX: Add missing Post interface used in Community.tsx
export interface Post {
  id: string;
  user: string;
  avatar: string | null;
  petName: string;
  petType: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  createdAt: any;
  userId: string;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: any;
}

export interface ChatSession {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastTimestamp?: any;
  otherUser?: {
    uid: string;
    displayName: string;
    photoURL: string;
    phoneNumber?: string;
    username?: string;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'follow_request';
  timestamp: any;
  read: boolean;
  // Fields for user-to-user notifications
  fromUserId?: string;
  fromUserName?: string;
  relatedId?: string; // e.g., the ID of the follow document
}

export type FollowStatus = 'not_following' | 'pending' | 'following' | 'is_self';
