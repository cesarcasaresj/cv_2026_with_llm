import type { components } from '../api/generated';

export type Profile = components['schemas']['Profile'];
export type Position = components['schemas']['Position'];
export type Project = components['schemas']['Project'];
export type ProfileUpdate = components['schemas']['ProfileUpdate'];

export const PORTFOLIO_API = {
  profile: '/api/v1/profile',
  projects: '/api/v1/projects',
  updates: '/api/v1/updates',
} as const;
