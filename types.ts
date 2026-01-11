
import React from 'react';

export enum AppRoutes {
  HOME = '/',
  AI_ASSISTANT = '/ai-assistant',
  CREATE_POST = '/create-post',
  PET_PROFILE = '/pet-profile',
  HEALTH_CHECKUP = '/health-checkup',
  PET_CARE = '/pet-care',
  SETTINGS = '/settings',
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
}
