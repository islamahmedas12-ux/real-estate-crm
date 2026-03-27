import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL'],
});
const prisma = new PrismaClient({ adapter });

const AGENT_IDS = [
  'agent-001',
  'agent-002',
  'agent-003',
  'agent-004',
  'agent-005',
];

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.leadActivity.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.client.deleteMany();
  await prisma.setting.deleteMany();

  // ─── Properties (20) ────────────────────────────────────────────
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        title: 'Modern 3BR Apartment in Zamalek',
        description: 'Spacious apartment with Nile view, fully furnished',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 3500000,
        area: 180,
        bedrooms: 3,
        bathrooms: 2,
        floor: 8,
        address: '15 Shagaret El Dorr St',
        city: 'Cairo',
        region: 'Zamalek',
        latitude: 30.0561,
        longitude: 31.2194,
        features: { parking: true, elevator: true, security: true, pool: false },
        assignedAgentId: AGENT_IDS[0],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Luxury Villa in New Cairo',
        description: 'Standalone villa with private garden and pool',
        type: 'VILLA',
        status: 'AVAILABLE',
        price: 12000000,
        area: 450,
        bedrooms: 5,
        bathrooms: 4,
        floor: 0,
        address: 'El Rehab City, Group 42',
        city: 'Cairo',
        region: 'New Cairo',
        latitude: 30.0589,
        longitude: 31.4908,
        features: { parking: true, garden: true, pool: true, security: true },
        assignedAgentId: AGENT_IDS[0],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Office Space in Smart Village',
        description: 'Grade A office, open plan with meeting rooms',
        type: 'OFFICE',
        status: 'AVAILABLE',
        price: 85000,
        area: 200,
        address: 'Smart Village, Building B2',
        city: 'Cairo',
        region: '6th of October',
        features: { airConditioning: true, internet: true, parking: true },
        assignedAgentId: AGENT_IDS[1],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Retail Shop in Citystars',
        description: 'Prime retail location on ground floor',
        type: 'SHOP',
        status: 'RENTED',
        price: 150000,
        area: 60,
        floor: 0,
        address: 'Citystars Mall, Phase 1',
        city: 'Cairo',
        region: 'Nasr City',
        features: { storefront: true, storage: true },
        assignedAgentId: AGENT_IDS[1],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Sea View Studio in Alexandria',
        description: 'Cozy studio with direct sea view',
        type: 'STUDIO',
        status: 'AVAILABLE',
        price: 800000,
        area: 55,
        bedrooms: 0,
        bathrooms: 1,
        floor: 12,
        address: 'Corniche Rd, Sidi Bishr',
        city: 'Alexandria',
        region: 'Sidi Bishr',
        latitude: 31.2653,
        longitude: 29.9906,
        features: { seaView: true, furnished: true },
        assignedAgentId: AGENT_IDS[2],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Duplex in Madinaty',
        description: 'Modern duplex with rooftop terrace',
        type: 'DUPLEX',
        status: 'AVAILABLE',
        price: 5200000,
        area: 280,
        bedrooms: 4,
        bathrooms: 3,
        floor: 3,
        address: 'Madinaty, B12',
        city: 'Cairo',
        region: 'Madinaty',
        features: { terrace: true, parking: true, clubAccess: true },
        assignedAgentId: AGENT_IDS[2],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Land Plot in North Coast',
        description: '500sqm plot in gated community',
        type: 'LAND',
        status: 'AVAILABLE',
        price: 2000000,
        area: 500,
        address: 'Hacienda Bay, Km 200',
        city: 'North Coast',
        region: 'Sidi Abdel Rahman',
        features: { gatedCommunity: true, beachAccess: true },
        assignedAgentId: AGENT_IDS[3],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Penthouse in Garden City',
        description: 'Top floor penthouse with 360° views',
        type: 'PENTHOUSE',
        status: 'RESERVED',
        price: 8500000,
        area: 320,
        bedrooms: 4,
        bathrooms: 3,
        floor: 15,
        address: '22 Qasr El Aini St',
        city: 'Cairo',
        region: 'Garden City',
        latitude: 30.0377,
        longitude: 31.2314,
        features: { panoramicView: true, jacuzzi: true, smartHome: true },
        assignedAgentId: AGENT_IDS[3],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Chalet in Ain Sokhna',
        description: 'Beachfront chalet with pool access',
        type: 'CHALET',
        status: 'AVAILABLE',
        price: 1800000,
        area: 120,
        bedrooms: 2,
        bathrooms: 1,
        floor: 0,
        address: 'La Vista Bay, Km 140',
        city: 'Ain Sokhna',
        region: 'Suez',
        features: { beachAccess: true, pool: true, furnished: true },
        assignedAgentId: AGENT_IDS[4],
      },
    }),
    prisma.property.create({
      data: {
        title: '2BR Apartment in Mohandessin',
        description: 'Renovated apartment close to metro',
        type: 'APARTMENT',
        status: 'SOLD',
        price: 1500000,
        area: 110,
        bedrooms: 2,
        bathrooms: 1,
        floor: 4,
        address: 'Shehab St, Mohandessin',
        city: 'Cairo',
        region: 'Mohandessin',
        features: { metro: true, elevator: true },
        assignedAgentId: AGENT_IDS[4],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Commercial Building in Downtown',
        description: 'Full building for commercial use, 10 floors',
        type: 'BUILDING',
        status: 'AVAILABLE',
        price: 45000000,
        area: 2000,
        address: 'Talaat Harb St',
        city: 'Cairo',
        region: 'Downtown',
        features: { elevator: true, parking: true, generator: true },
        assignedAgentId: AGENT_IDS[0],
      },
    }),
    prisma.property.create({
      data: {
        title: '1BR Apartment in Heliopolis',
        description: 'Bright apartment near Airport Rd',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 950000,
        area: 75,
        bedrooms: 1,
        bathrooms: 1,
        floor: 3,
        address: 'Othman Ibn Affan St',
        city: 'Cairo',
        region: 'Heliopolis',
        features: { elevator: true, security: true },
        assignedAgentId: AGENT_IDS[1],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Villa Twin House in Palm Hills',
        description: 'Semi-detached villa in compound',
        type: 'VILLA',
        status: 'AVAILABLE',
        price: 7500000,
        area: 350,
        bedrooms: 4,
        bathrooms: 3,
        floor: 0,
        address: 'Palm Hills, 6th October',
        city: 'Cairo',
        region: '6th of October',
        features: { garden: true, parking: true, clubAccess: true },
        assignedAgentId: AGENT_IDS[2],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Furnished Studio in Dokki',
        description: 'Fully furnished studio near Cairo University',
        type: 'STUDIO',
        status: 'RENTED',
        price: 450000,
        area: 45,
        bedrooms: 0,
        bathrooms: 1,
        floor: 6,
        address: 'Tahrir St, Dokki',
        city: 'Cairo',
        region: 'Dokki',
        features: { furnished: true, airConditioning: true },
        assignedAgentId: AGENT_IDS[3],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Office Floor in New Administrative Capital',
        description: 'Full floor open office space, smart building',
        type: 'OFFICE',
        status: 'AVAILABLE',
        price: 200000,
        area: 500,
        address: 'Business District, Tower C3',
        city: 'New Capital',
        region: 'Business District',
        features: { smartBuilding: true, conferenceRooms: true, parking: true },
        assignedAgentId: AGENT_IDS[4],
      },
    }),
    prisma.property.create({
      data: {
        title: '3BR Apartment in Sheikh Zayed',
        description: 'Corner unit with garden view',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 2800000,
        area: 165,
        bedrooms: 3,
        bathrooms: 2,
        floor: 2,
        address: 'Zayed 2000 Compound',
        city: 'Cairo',
        region: 'Sheikh Zayed',
        features: { gardenView: true, parking: true, clubAccess: true },
        assignedAgentId: AGENT_IDS[0],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Retail Shop in Mall of Egypt',
        description: 'High-traffic location, food court wing',
        type: 'SHOP',
        status: 'AVAILABLE',
        price: 250000,
        area: 80,
        floor: 1,
        address: 'Mall of Egypt, 6th October',
        city: 'Cairo',
        region: '6th of October',
        features: { highTraffic: true, foodCourt: true },
        assignedAgentId: AGENT_IDS[1],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Land in New Mansoura',
        description: 'Residential land plot near the coast',
        type: 'LAND',
        status: 'AVAILABLE',
        price: 900000,
        area: 300,
        address: 'New Mansoura City, Sector 4',
        city: 'Mansoura',
        region: 'New Mansoura',
        features: { coastal: true, utilities: true },
        assignedAgentId: AGENT_IDS[2],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Duplex in Katameya Heights',
        description: 'Golf course view duplex',
        type: 'DUPLEX',
        status: 'RESERVED',
        price: 15000000,
        area: 400,
        bedrooms: 5,
        bathrooms: 4,
        floor: 0,
        address: 'Katameya Heights, Street 9',
        city: 'Cairo',
        region: 'New Cairo',
        features: { golfView: true, pool: true, security: true, smartHome: true },
        assignedAgentId: AGENT_IDS[3],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Chalet in Sahel - Marassi',
        description: 'Premium chalet in Marassi resort',
        type: 'CHALET',
        status: 'SOLD',
        price: 4500000,
        area: 150,
        bedrooms: 3,
        bathrooms: 2,
        floor: 0,
        address: 'Marassi, Sidi Abdel Rahman',
        city: 'North Coast',
        region: 'Sidi Abdel Rahman',
        features: { beachAccess: true, pool: true, lagoon: true },
        assignedAgentId: AGENT_IDS[4],
      },
    }),
  ]);

  console.log(`Created ${properties.length} properties`);

  // ─── Clients (15) ───────────────────────────────────────────────
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        firstName: 'Ahmed',
        lastName: 'Hassan',
        email: 'ahmed.hassan@email.com',
        phone: '+201001234567',
        nationalId: '29001011234567',
        type: 'BUYER',
        source: 'REFERRAL',
        notes: 'Looking for family apartment in New Cairo',
        assignedAgentId: AGENT_IDS[0],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Fatma',
        lastName: 'Ali',
        email: 'fatma.ali@email.com',
        phone: '+201112345678',
        type: 'BUYER',
        source: 'WEBSITE',
        notes: 'First-time buyer, budget 2-3M EGP',
        assignedAgentId: AGENT_IDS[0],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Mohamed',
        lastName: 'Ibrahim',
        email: 'mo.ibrahim@email.com',
        phone: '+201223456789',
        nationalId: '28505051234567',
        type: 'INVESTOR',
        source: 'SOCIAL_MEDIA',
        notes: 'Interested in commercial properties',
        assignedAgentId: AGENT_IDS[1],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Sara',
        lastName: 'Mahmoud',
        email: 'sara.m@email.com',
        phone: '+201034567890',
        type: 'TENANT',
        source: 'WALK_IN',
        notes: 'Looking for furnished apartment',
        assignedAgentId: AGENT_IDS[1],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Khaled',
        lastName: 'Mostafa',
        email: 'khaled.m@email.com',
        phone: '+201145678901',
        nationalId: '29201011234567',
        type: 'SELLER',
        source: 'PHONE',
        notes: 'Selling inherited villa',
        assignedAgentId: AGENT_IDS[2],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Nour',
        lastName: 'El-Din',
        email: 'nour.eldin@email.com',
        phone: '+201256789012',
        type: 'BUYER',
        source: 'ADVERTISEMENT',
        notes: 'Relocating from Saudi, needs large villa',
        assignedAgentId: AGENT_IDS[2],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Tarek',
        lastName: 'Sayed',
        email: 'tarek.s@email.com',
        phone: '+201067890123',
        nationalId: '28808081234567',
        type: 'LANDLORD',
        source: 'REFERRAL',
        notes: 'Owns multiple properties in Zamalek',
        assignedAgentId: AGENT_IDS[3],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Hana',
        lastName: 'Youssef',
        email: 'hana.y@email.com',
        phone: '+201178901234',
        type: 'BUYER',
        source: 'WEBSITE',
        notes: 'Young professional, looking for studio',
        assignedAgentId: AGENT_IDS[3],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Omar',
        lastName: 'Farouk',
        email: 'omar.f@email.com',
        phone: '+201289012345',
        nationalId: '29505051234567',
        type: 'INVESTOR',
        source: 'SOCIAL_MEDIA',
        notes: 'Portfolio investor, 10+ properties',
        assignedAgentId: AGENT_IDS[4],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Layla',
        lastName: 'Abdel-Rahim',
        email: 'layla.ar@email.com',
        phone: '+201090123456',
        type: 'TENANT',
        source: 'OTHER',
        notes: 'Corporate lease for expat employees',
        assignedAgentId: AGENT_IDS[4],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Yasser',
        lastName: 'Gamal',
        email: 'yasser.g@email.com',
        phone: '+201501234567',
        type: 'BUYER',
        source: 'REFERRAL',
        assignedAgentId: AGENT_IDS[0],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Dina',
        lastName: 'Adel',
        email: 'dina.adel@email.com',
        phone: '+201612345678',
        type: 'SELLER',
        source: 'PHONE',
        notes: 'Downsizing, selling family home',
        assignedAgentId: AGENT_IDS[1],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Amr',
        lastName: 'Helmy',
        email: 'amr.helmy@email.com',
        phone: '+201723456789',
        nationalId: '29303031234567',
        type: 'BUYER',
        source: 'WEBSITE',
        notes: 'Interested in North Coast chalets',
        assignedAgentId: AGENT_IDS[2],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Mona',
        lastName: 'Rashid',
        email: 'mona.r@email.com',
        phone: '+201834567890',
        type: 'LANDLORD',
        source: 'WALK_IN',
        notes: 'Managing family property portfolio',
        assignedAgentId: AGENT_IDS[3],
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Sherif',
        lastName: 'Nabil',
        email: 'sherif.n@email.com',
        phone: '+201945678901',
        type: 'BUYER',
        source: 'ADVERTISEMENT',
        notes: 'Looking for commercial space in New Capital',
        assignedAgentId: AGENT_IDS[4],
      },
    }),
  ]);

  console.log(`Created ${clients.length} clients`);

  // ─── Leads (10) ─────────────────────────────────────────────────
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        clientId: clients[0].id,
        propertyId: properties[1].id,
        status: 'QUALIFIED',
        priority: 'HIGH',
        source: 'Agent referral',
        budget: 15000000,
        notes: 'Visited property twice, very interested',
        assignedAgentId: AGENT_IDS[0],
        nextFollowUp: new Date('2026-03-28'),
      },
    }),
    prisma.lead.create({
      data: {
        clientId: clients[1].id,
        propertyId: properties[0].id,
        status: 'CONTACTED',
        priority: 'MEDIUM',
        source: 'Website inquiry',
        budget: 3500000,
        notes: 'Requested floor plan',
        assignedAgentId: AGENT_IDS[0],
        nextFollowUp: new Date('2026-03-27'),
      },
    }),
    prisma.lead.create({
      data: {
        clientId: clients[2].id,
        propertyId: properties[10].id,
        status: 'PROPOSAL',
        priority: 'HIGH',
        source: 'LinkedIn campaign',
        budget: 50000000,
        notes: 'Wants to convert to mixed-use',
        assignedAgentId: AGENT_IDS[1],
        nextFollowUp: new Date('2026-03-26'),
      },
    }),
    prisma.lead.create({
      data: {
        clientId: clients[3].id,
        propertyId: properties[13].id,
        status: 'NEW',
        priority: 'MEDIUM',
        source: 'Walk-in',
        budget: 500000,
        notes: 'Needs 1-year lease',
        assignedAgentId: AGENT_IDS[1],
      },
    }),
    prisma.lead.create({
      data: {
        clientId: clients[5].id,
        propertyId: properties[1].id,
        status: 'NEGOTIATION',
        priority: 'URGENT',
        source: 'Ad campaign',
        budget: 12000000,
        notes: 'Counter-offered at 11.5M',
        assignedAgentId: AGENT_IDS[2],
        nextFollowUp: new Date('2026-03-26'),
      },
    }),
    prisma.lead.create({
      data: {
        clientId: clients[7].id,
        propertyId: properties[4].id,
        status: 'CONTACTED',
        priority: 'LOW',
        source: 'Website',
        budget: 900000,
        notes: 'Exploring options, not urgent',
        assignedAgentId: AGENT_IDS[3],
      },
    }),
    prisma.lead.create({
      data: {
        clientId: clients[8].id,
        status: 'QUALIFIED',
        priority: 'HIGH',
        source: 'Social media',
        budget: 20000000,
        notes: 'Looking for bulk commercial properties',
        assignedAgentId: AGENT_IDS[4],
        nextFollowUp: new Date('2026-03-29'),
      },
    }),
    prisma.lead.create({
      data: {
        clientId: clients[12].id,
        propertyId: properties[19].id,
        status: 'WON',
        priority: 'MEDIUM',
        source: 'Website',
        budget: 5000000,
        notes: 'Deal closed, contract pending',
        assignedAgentId: AGENT_IDS[2],
      },
    }),
    prisma.lead.create({
      data: {
        clientId: clients[14].id,
        propertyId: properties[14].id,
        status: 'NEW',
        priority: 'HIGH',
        source: 'Ad',
        budget: 250000,
        notes: 'Interested in leasing full floor',
        assignedAgentId: AGENT_IDS[4],
        nextFollowUp: new Date('2026-03-27'),
      },
    }),
    prisma.lead.create({
      data: {
        clientId: clients[10].id,
        propertyId: properties[15].id,
        status: 'LOST',
        priority: 'LOW',
        source: 'Referral',
        budget: 3000000,
        notes: 'Chose competitor listing',
        assignedAgentId: AGENT_IDS[0],
      },
    }),
  ]);

  console.log(`Created ${leads.length} leads`);

  // ─── Lead Activities ────────────────────────────────────────────
  await Promise.all([
    prisma.leadActivity.create({
      data: {
        leadId: leads[0].id,
        type: 'VIEWING',
        description: 'First property viewing with client',
        performedBy: AGENT_IDS[0],
      },
    }),
    prisma.leadActivity.create({
      data: {
        leadId: leads[0].id,
        type: 'FOLLOW_UP',
        description: 'Follow-up call, client still interested',
        performedBy: AGENT_IDS[0],
      },
    }),
    prisma.leadActivity.create({
      data: {
        leadId: leads[2].id,
        type: 'MEETING',
        description: 'Meeting to discuss proposal terms',
        performedBy: AGENT_IDS[1],
      },
    }),
    prisma.leadActivity.create({
      data: {
        leadId: leads[4].id,
        type: 'CALL',
        description: 'Price negotiation call',
        performedBy: AGENT_IDS[2],
      },
    }),
    prisma.leadActivity.create({
      data: {
        leadId: leads[4].id,
        type: 'STATUS_CHANGE',
        description: 'Moved to negotiation stage',
        performedBy: AGENT_IDS[2],
      },
    }),
  ]);

  console.log('Created lead activities');

  // ─── Contracts (5) ──────────────────────────────────────────────
  const contracts = await Promise.all([
    prisma.contract.create({
      data: {
        type: 'SALE',
        propertyId: properties[9].id,
        clientId: clients[0].id,
        agentId: AGENT_IDS[4],
        startDate: new Date('2026-02-01'),
        totalAmount: 1500000,
        paymentTerms: { installments: 4, downPayment: 500000 },
        status: 'COMPLETED',
        notes: 'Sale completed, property transferred',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'RENT',
        propertyId: properties[3].id,
        clientId: clients[3].id,
        agentId: AGENT_IDS[1],
        startDate: new Date('2026-01-15'),
        endDate: new Date('2027-01-14'),
        totalAmount: 1800000,
        paymentTerms: { monthlyRent: 150000, deposit: 300000 },
        status: 'ACTIVE',
        notes: 'Annual lease with auto-renewal',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'SALE',
        propertyId: properties[19].id,
        clientId: clients[12].id,
        agentId: AGENT_IDS[2],
        startDate: new Date('2026-03-20'),
        totalAmount: 4500000,
        paymentTerms: { installments: 6, downPayment: 1500000 },
        status: 'ACTIVE',
        notes: 'Installment sale, 6 quarterly payments',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'RENT',
        propertyId: properties[13].id,
        clientId: clients[9].id,
        agentId: AGENT_IDS[3],
        startDate: new Date('2026-03-01'),
        endDate: new Date('2027-02-28'),
        totalAmount: 540000,
        paymentTerms: { monthlyRent: 45000, deposit: 90000 },
        status: 'ACTIVE',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'LEASE',
        propertyId: properties[2].id,
        clientId: clients[2].id,
        agentId: AGENT_IDS[1],
        startDate: new Date('2026-04-01'),
        endDate: new Date('2029-03-31'),
        totalAmount: 3060000,
        paymentTerms: { monthlyRent: 85000, annualIncrease: '10%' },
        status: 'DRAFT',
        notes: 'Pending legal review',
      },
    }),
  ]);

  console.log(`Created ${contracts.length} contracts`);

  // ─── Invoices (10) ──────────────────────────────────────────────
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        contractId: contracts[0].id,
        invoiceNumber: 'INV-2026-001',
        amount: 500000,
        dueDate: new Date('2026-02-01'),
        paidDate: new Date('2026-02-01'),
        status: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        notes: 'Down payment',
      },
    }),
    prisma.invoice.create({
      data: {
        contractId: contracts[0].id,
        invoiceNumber: 'INV-2026-002',
        amount: 333333,
        dueDate: new Date('2026-05-01'),
        status: 'PENDING',
        notes: 'Installment 1 of 3',
      },
    }),
    prisma.invoice.create({
      data: {
        contractId: contracts[0].id,
        invoiceNumber: 'INV-2026-003',
        amount: 333333,
        dueDate: new Date('2026-08-01'),
        status: 'PENDING',
        notes: 'Installment 2 of 3',
      },
    }),
    prisma.invoice.create({
      data: {
        contractId: contracts[0].id,
        invoiceNumber: 'INV-2026-004',
        amount: 333334,
        dueDate: new Date('2026-11-01'),
        status: 'PENDING',
        notes: 'Installment 3 of 3',
      },
    }),
    prisma.invoice.create({
      data: {
        contractId: contracts[1].id,
        invoiceNumber: 'INV-2026-005',
        amount: 300000,
        dueDate: new Date('2026-01-15'),
        paidDate: new Date('2026-01-15'),
        status: 'PAID',
        paymentMethod: 'CASH',
        notes: 'Security deposit',
      },
    }),
    prisma.invoice.create({
      data: {
        contractId: contracts[1].id,
        invoiceNumber: 'INV-2026-006',
        amount: 150000,
        dueDate: new Date('2026-02-15'),
        paidDate: new Date('2026-02-14'),
        status: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        notes: 'Feb rent',
      },
    }),
    prisma.invoice.create({
      data: {
        contractId: contracts[1].id,
        invoiceNumber: 'INV-2026-007',
        amount: 150000,
        dueDate: new Date('2026-03-15'),
        status: 'PENDING',
        notes: 'Mar rent',
      },
    }),
    prisma.invoice.create({
      data: {
        contractId: contracts[2].id,
        invoiceNumber: 'INV-2026-008',
        amount: 1500000,
        dueDate: new Date('2026-03-20'),
        paidDate: new Date('2026-03-20'),
        status: 'PAID',
        paymentMethod: 'CHECK',
        notes: 'Down payment',
      },
    }),
    prisma.invoice.create({
      data: {
        contractId: contracts[2].id,
        invoiceNumber: 'INV-2026-009',
        amount: 600000,
        dueDate: new Date('2026-06-20'),
        status: 'PENDING',
        notes: 'Q2 installment',
      },
    }),
    prisma.invoice.create({
      data: {
        contractId: contracts[3].id,
        invoiceNumber: 'INV-2026-010',
        amount: 90000,
        dueDate: new Date('2026-03-01'),
        paidDate: new Date('2026-03-01'),
        status: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        notes: 'Security deposit',
      },
    }),
  ]);

  console.log(`Created ${invoices.length} invoices`);

  // ─── Activities (audit trail) ───────────────────────────────────
  await Promise.all([
    prisma.activity.create({
      data: {
        type: 'CREATE',
        description: 'Property listed for sale',
        entityType: 'PROPERTY',
        entityId: properties[0].id,
        performedBy: AGENT_IDS[0],
      },
    }),
    prisma.activity.create({
      data: {
        type: 'UPDATE',
        description: 'Property status changed to SOLD',
        entityType: 'PROPERTY',
        entityId: properties[9].id,
        performedBy: AGENT_IDS[4],
        metadata: { oldStatus: 'RESERVED', newStatus: 'SOLD' },
      },
    }),
    prisma.activity.create({
      data: {
        type: 'CREATE',
        description: 'New client registered',
        entityType: 'CLIENT',
        entityId: clients[0].id,
        performedBy: AGENT_IDS[0],
      },
    }),
    prisma.activity.create({
      data: {
        type: 'CREATE',
        description: 'Contract signed',
        entityType: 'CONTRACT',
        entityId: contracts[0].id,
        performedBy: AGENT_IDS[4],
      },
    }),
    prisma.activity.create({
      data: {
        type: 'CREATE',
        description: 'Invoice generated for down payment',
        entityType: 'INVOICE',
        entityId: invoices[0].id,
        performedBy: AGENT_IDS[4],
      },
    }),
    prisma.activity.create({
      data: {
        type: 'UPDATE',
        description: 'Invoice marked as paid',
        entityType: 'INVOICE',
        entityId: invoices[0].id,
        performedBy: AGENT_IDS[4],
        metadata: { oldStatus: 'PENDING', newStatus: 'PAID', paymentMethod: 'BANK_TRANSFER' },
      },
    }),
  ]);

  console.log('Created activities');

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

  console.log('Created settings');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
