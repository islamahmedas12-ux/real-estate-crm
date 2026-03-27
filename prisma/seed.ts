/**
 * prisma/seed.ts — Database Seed Script
 *
 * Issue #6: Database Seed Script
 * Implemented by: Karim Mostafa (Backend Developer)
 *
 * Seeds the database with:
 *   - 3 test users (AuthMe test accounts: admin, manager, agent)
 *   - 5 sample properties (different types and statuses)
 *   - 3 sample clients
 *   - 2 sample leads
 *   - Sample appointments, lead activities
 *
 * Test users correspond to AuthMe accounts:
 *   - admin@test.com  (ADMIN)
 *   - manager@test.com (MANAGER)
 *   - agent@test.com  (AGENT)
 */

import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString:
    process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/crm_dev',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Clean existing data (order matters for FK constraints) ─────
  await prisma.appointment.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.client.deleteMany();
  await prisma.emailPreference.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  // ─── Test Users (AuthMe accounts) ───────────────────────────────
  // These correspond to users in AuthMe: admin@test.com, manager@test.com, agent@test.com
  const [adminUser, managerUser, agentUser] = await Promise.all([
    prisma.user.create({
      data: {
        authmeId: 'authme-admin-001',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        authmeId: 'authme-manager-001',
        email: 'manager@test.com',
        firstName: 'Manager',
        lastName: 'User',
        role: UserRole.MANAGER,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        authmeId: 'authme-agent-001',
        email: 'agent@test.com',
        firstName: 'Agent',
        lastName: 'User',
        role: UserRole.AGENT,
        isActive: true,
      },
    }),
  ]);

  console.log(
    `✅ Created 3 test users: admin@test.com (${adminUser.id}), manager@test.com (${managerUser.id}), agent@test.com (${agentUser.id})`,
  );

  // ─── Properties (5 — different types and statuses) ──────────────
  const [prop1, prop2, prop3, prop4, prop5] = await Promise.all([
    prisma.property.create({
      data: {
        title: 'Modern 3BR Apartment in Zamalek',
        description: 'Spacious apartment with Nile view, fully furnished, high-end finishes',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 3_500_000,
        area: 180,
        bedrooms: 3,
        bathrooms: 2,
        floor: 8,
        address: '15 Shagaret El Dorr St',
        city: 'Cairo',
        region: 'Zamalek',
        latitude: 30.0561,
        longitude: 31.2194,
        features: { parking: true, elevator: true, security: true, pool: false, nileView: true },
        assignedAgentId: agentUser.id,
      },
    }),
    prisma.property.create({
      data: {
        title: 'Luxury Villa in New Cairo',
        description: 'Standalone villa with private garden, pool, and smart home system',
        type: 'VILLA',
        status: 'RESERVED',
        price: 12_000_000,
        area: 450,
        bedrooms: 5,
        bathrooms: 4,
        floor: 0,
        address: 'El Rehab City, Group 42',
        city: 'Cairo',
        region: 'New Cairo',
        latitude: 30.0589,
        longitude: 31.4908,
        features: { parking: true, garden: true, pool: true, security: true, smartHome: true },
        assignedAgentId: managerUser.id,
      },
    }),
    prisma.property.create({
      data: {
        title: 'Grade A Office in Smart Village',
        description: 'Open plan office with conference rooms, fiber internet, parking',
        type: 'OFFICE',
        status: 'AVAILABLE',
        price: 85_000,
        area: 200,
        address: 'Smart Village, Building B2',
        city: 'Cairo',
        region: '6th of October',
        features: { airConditioning: true, internet: true, parking: true, conferenceRooms: 2 },
        assignedAgentId: agentUser.id,
      },
    }),
    prisma.property.create({
      data: {
        title: 'Sea View Studio in Alexandria',
        description: 'Cozy furnished studio with direct sea view on the Corniche',
        type: 'STUDIO',
        status: 'RENTED',
        price: 800_000,
        area: 55,
        bedrooms: 0,
        bathrooms: 1,
        floor: 12,
        address: 'Corniche Rd, Sidi Bishr',
        city: 'Alexandria',
        region: 'Sidi Bishr',
        latitude: 31.2653,
        longitude: 29.9906,
        features: { seaView: true, furnished: true, elevator: true },
        assignedAgentId: adminUser.id,
      },
    }),
    prisma.property.create({
      data: {
        title: 'Land Plot in North Coast',
        description: '500 sqm plot in gated community with beach access',
        type: 'LAND',
        status: 'SOLD',
        price: 2_000_000,
        area: 500,
        address: 'Hacienda Bay, Km 200',
        city: 'North Coast',
        region: 'Sidi Abdel Rahman',
        features: { gatedCommunity: true, beachAccess: true, utilities: true },
        assignedAgentId: managerUser.id,
      },
    }),
  ]);

  console.log(`✅ Created 5 properties (APARTMENT, VILLA, OFFICE, STUDIO, LAND)`);

  // ─── Clients (3) ────────────────────────────────────────────────
  const [client1, client2, client3] = await Promise.all([
    prisma.client.create({
      data: {
        firstName: 'Ahmed',
        lastName: 'Hassan',
        email: 'ahmed.hassan@example.com',
        phone: '+201001234567',
        nationalId: '29001011234567',
        type: 'BUYER',
        source: 'REFERRAL',
        notes: 'Looking for family apartment in New Cairo, budget 3-4M EGP',
        assignedAgentId: agentUser.id,
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Fatma',
        lastName: 'Ali',
        email: 'fatma.ali@example.com',
        phone: '+201112345678',
        type: 'INVESTOR',
        source: 'WEBSITE',
        notes: 'Interested in commercial properties in Smart Village area',
        assignedAgentId: managerUser.id,
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Mohamed',
        lastName: 'Ibrahim',
        email: 'mo.ibrahim@example.com',
        phone: '+201223456789',
        nationalId: '28505051234567',
        type: 'TENANT',
        source: 'SOCIAL_MEDIA',
        notes: 'Looking for furnished apartment or studio, 1-year lease preferred',
        assignedAgentId: agentUser.id,
      },
    }),
  ]);

  console.log(`✅ Created 3 clients`);

  // ─── Leads (2) ──────────────────────────────────────────────────
  const [lead1, lead2] = await Promise.all([
    prisma.lead.create({
      data: {
        clientId: client1.id,
        propertyId: prop1.id,
        status: 'QUALIFIED',
        priority: 'HIGH',
        source: 'Agent referral',
        budget: 3_800_000,
        notes: 'Visited property twice, very interested, requesting floor plan',
        assignedAgentId: agentUser.id,
        nextFollowUp: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      },
    }),
    prisma.lead.create({
      data: {
        clientId: client2.id,
        propertyId: prop3.id,
        status: 'CONTACTED',
        priority: 'MEDIUM',
        source: 'Website inquiry',
        budget: 100_000,
        notes: 'Interested in annual office lease, requested commercial proposal',
        assignedAgentId: managerUser.id,
        nextFollowUp: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
    }),
  ]);

  console.log(`✅ Created 2 leads`);

  // ─── Lead Activities ────────────────────────────────────────────
  await Promise.all([
    prisma.leadActivity.create({
      data: {
        leadId: lead1.id,
        type: 'VIEWING',
        description: 'First on-site property viewing with client Ahmed Hassan',
        performedBy: agentUser.id,
      },
    }),
    prisma.leadActivity.create({
      data: {
        leadId: lead1.id,
        type: 'FOLLOW_UP',
        description: 'Follow-up call — client confirmed strong interest, asking about payment plan',
        performedBy: agentUser.id,
      },
    }),
    prisma.leadActivity.create({
      data: {
        leadId: lead2.id,
        type: 'CALL',
        description: 'Initial discovery call with Fatma Ali regarding Smart Village office',
        performedBy: managerUser.id,
      },
    }),
  ]);

  console.log(`✅ Created lead activities`);

  // ─── Sample Appointments ─────────────────────────────────────────
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.appointment.create({
      data: {
        title: 'Property Viewing — Zamalek Apartment',
        type: 'VIEWING',
        status: 'CONFIRMED',
        startTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
        endTime: new Date(tomorrow.setHours(11, 0, 0, 0)),
        location: '15 Shagaret El Dorr St, Zamalek, Cairo',
        notes: 'Second viewing — bring floor plan and payment schedule',
        agentId: agentUser.id,
        clientId: client1.id,
        propertyId: prop1.id,
        leadId: lead1.id,
      },
    }),
    prisma.appointment.create({
      data: {
        title: 'Office Lease Proposal Meeting',
        type: 'MEETING',
        status: 'SCHEDULED',
        startTime: new Date(nextWeek.setHours(14, 0, 0, 0)),
        endTime: new Date(nextWeek.setHours(15, 0, 0, 0)),
        location: 'Smart Village, Building B2 — Management Office',
        notes: 'Present commercial lease proposal, discuss terms',
        agentId: managerUser.id,
        clientId: client2.id,
        propertyId: prop3.id,
        leadId: lead2.id,
      },
    }),
  ]);

  console.log(`✅ Created sample appointments`);

  // ─── Settings ───────────────────────────────────────────────────
  await Promise.all([
    prisma.setting.create({
      data: {
        key: 'company_name',
        value: '"Real Estate CRM"',
        description: 'Company display name',
      },
    }),
    prisma.setting.create({
      data: {
        key: 'currency',
        value: '"EGP"',
        description: 'Default currency',
      },
    }),
    prisma.setting.create({
      data: {
        key: 'invoice_prefix',
        value: '"INV"',
        description: 'Prefix for auto-generated invoice numbers',
      },
    }),
    prisma.setting.create({
      data: {
        key: 'lead_auto_assign',
        value: 'true',
        description: 'Auto-assign leads to agents using round-robin',
      },
    }),
  ]);

  console.log(`✅ Created settings`);
  console.log('\n🎉 Seed complete!');
  console.log('\nTest Users:');
  console.log(`  ADMIN   → admin@test.com   (id: ${adminUser.id})`);
  console.log(`  MANAGER → manager@test.com (id: ${managerUser.id})`);
  console.log(`  AGENT   → agent@test.com   (id: ${agentUser.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
