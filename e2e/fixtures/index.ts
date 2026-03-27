/**
 * E2E Test Fixtures — Real Estate CRM
 * Prepared by Sara Mostafa (QA Automation)
 */

export const TEST_USERS = {
  admin: {
    username: process.env.E2E_ADMIN_USERNAME || 'admin@crm.test',
    password: process.env.E2E_ADMIN_PASSWORD || 'Admin@123!',
    role: 'crm-admin',
  },
  manager: {
    username: process.env.E2E_MANAGER_USERNAME || 'manager@crm.test',
    password: process.env.E2E_MANAGER_PASSWORD || 'Manager@123!',
    role: 'crm-manager',
  },
  agent: {
    username: process.env.E2E_AGENT_USERNAME || 'agent@crm.test',
    password: process.env.E2E_AGENT_PASSWORD || 'Agent@123!',
    role: 'crm-agent',
  },
} as const;

export const API_URL = process.env.E2E_API_URL || 'http://localhost:3000/api';
export const ADMIN_URL = process.env.E2E_ADMIN_URL || 'http://localhost:5173';
export const AGENT_URL = process.env.E2E_AGENT_URL || 'http://localhost:5174';

export const SAMPLE_PROPERTY = {
  title: 'E2E Test Property — Luxury Apartment',
  type: 'APARTMENT',
  status: 'AVAILABLE',
  price: '1500000',
  area: '150',
  bedrooms: '3',
  bathrooms: '2',
  floor: '4',
  address: '10 Tahrir Square',
  city: 'Cairo',
  region: 'Downtown',
};

export const SAMPLE_CLIENT = {
  firstName: 'E2E',
  lastName: 'TestClient',
  email: `e2e.client.${Date.now()}@test.com`,
  phone: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
  type: 'BUYER',
  source: 'WEBSITE',
};
