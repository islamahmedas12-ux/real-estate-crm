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

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Seeding database...');

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

  // ─── Properties (22) ────────────────────────────────────────────
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        title: 'Modern 3BR Apartment in Zamalek',
        description: 'Spacious apartment with Nile view, fully furnished',
        type: 'APARTMENT', status: 'AVAILABLE', price: 3500000, area: 180,
        bedrooms: 3, bathrooms: 2, floor: 8,
        address: '15 Shagaret El Dorr St', city: 'Cairo', region: 'Zamalek',
        latitude: 30.0561, longitude: 31.2194,
        features: { parking: true, elevator: true, security: true },
        assignedAgentId: AGENT_IDS[0],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Luxury Villa in New Cairo',
        description: 'Standalone villa with private garden and pool',
        type: 'VILLA', status: 'AVAILABLE', price: 12000000, area: 450,
        bedrooms: 5, bathrooms: 4, floor: 0,
        address: 'El Rehab City, Group 42', city: 'Cairo', region: 'New Cairo',
        latitude: 30.0589, longitude: 31.4908,
        features: { parking: true, garden: true, pool: true, security: true },
        assignedAgentId: AGENT_IDS[0],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Office Space in Smart Village',
        description: 'Grade A office, open plan with meeting rooms',
        type: 'OFFICE', status: 'AVAILABLE', price: 85000, area: 200,
        address: 'Smart Village, Building B2', city: 'Cairo', region: '6th of October',
        features: { airConditioning: true, internet: true, parking: true },
        assignedAgentId: AGENT_IDS[1],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Retail Shop in Citystars',
        description: 'Prime retail location on ground floor',
        type: 'SHOP', status: 'RENTED', price: 150000, area: 60, floor: 0,
        address: 'Citystars Mall, Phase 1', city: 'Cairo', region: 'Nasr City',
        features: { storefront: true, storage: true },
        assignedAgentId: AGENT_IDS[1],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Sea View Studio in Alexandria',
        description: 'Cozy studio with direct sea view',
        type: 'STUDIO', status: 'AVAILABLE', price: 800000, area: 55,
        bedrooms: 0, bathrooms: 1, floor: 12,
        address: 'Corniche Rd, Sidi Bishr', city: 'Alexandria', region: 'Sidi Bishr',
        latitude: 31.2653, longitude: 29.9906,
        features: { seaView: true, furnished: true },
        assignedAgentId: AGENT_IDS[2],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Duplex in Madinaty',
        description: 'Modern duplex with rooftop terrace',
        type: 'DUPLEX', status: 'AVAILABLE', price: 5200000, area: 280,
        bedrooms: 4, bathrooms: 3, floor: 3,
        address: 'Madinaty, B12', city: 'Cairo', region: 'Madinaty',
        features: { terrace: true, parking: true, clubAccess: true },
        assignedAgentId: AGENT_IDS[2],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Land Plot in North Coast',
        description: '500sqm plot in gated community',
        type: 'LAND', status: 'AVAILABLE', price: 2000000, area: 500,
        address: 'Hacienda Bay, Km 200', city: 'North Coast', region: 'Sidi Abdel Rahman',
        features: { gatedCommunity: true, beachAccess: true },
        assignedAgentId: AGENT_IDS[3],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Penthouse in Garden City',
        description: 'Top floor penthouse with 360° views',
        type: 'PENTHOUSE', status: 'RESERVED', price: 8500000, area: 320,
        bedrooms: 4, bathrooms: 3, floor: 15,
        address: '22 Qasr El Aini St', city: 'Cairo', region: 'Garden City',
        latitude: 30.0377, longitude: 31.2314,
        features: { panoramicView: true, jacuzzi: true, smartHome: true },
        assignedAgentId: AGENT_IDS[3],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Chalet in Ain Sokhna',
        description: 'Beachfront chalet with pool access',
        type: 'CHALET', status: 'AVAILABLE', price: 1800000, area: 120,
        bedrooms: 2, bathrooms: 1, floor: 0,
        address: 'La Vista Bay, Km 140', city: 'Ain Sokhna', region: 'Suez',
        features: { beachAccess: true, pool: true, furnished: true },
        assignedAgentId: AGENT_IDS[4],
      },
    }),
    prisma.property.create({
      data: {
        title: '2BR Apartment in Mohandessin',
        description: 'Renovated apartment close to metro',
        type: 'APARTMENT', status: 'SOLD', price: 1500000, area: 110,
        bedrooms: 2, bathrooms: 1, floor: 4,
        address: 'Shehab St, Mohandessin', city: 'Cairo', region: 'Mohandessin',
        features: { metro: true, elevator: true },
        assignedAgentId: AGENT_IDS[4],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Commercial Building in Downtown',
        description: 'Full building for commercial use, 10 floors',
        type: 'BUILDING', status: 'AVAILABLE', price: 45000000, area: 2000,
        address: 'Talaat Harb St', city: 'Cairo', region: 'Downtown',
        features: { elevator: true, parking: true, generator: true },
        assignedAgentId: AGENT_IDS[0],
      },
    }),
    prisma.property.create({
      data: {
        title: '1BR Apartment in Heliopolis',
        description: 'Bright apartment near Airport Rd',
        type: 'APARTMENT', status: 'AVAILABLE', price: 950000, area: 75,
        bedrooms: 1, bathrooms: 1, floor: 3,
        address: 'Othman Ibn Affan St', city: 'Cairo', region: 'Heliopolis',
        features: { elevator: true, security: true },
        assignedAgentId: AGENT_IDS[1],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Villa Twin House in Palm Hills',
        description: 'Semi-detached villa in compound',
        type: 'VILLA', status: 'AVAILABLE', price: 7500000, area: 350,
        bedrooms: 4, bathrooms: 3, floor: 0,
        address: 'Palm Hills, 6th October', city: 'Cairo', region: '6th of October',
        features: { garden: true, parking: true, clubAccess: true },
        assignedAgentId: AGENT_IDS[2],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Furnished Studio in Dokki',
        description: 'Fully furnished studio near Cairo University',
        type: 'STUDIO', status: 'RENTED', price: 450000, area: 45,
        bedrooms: 0, bathrooms: 1, floor: 6,
        address: 'Tahrir St, Dokki', city: 'Cairo', region: 'Dokki',
        features: { furnished: true, airConditioning: true },
        assignedAgentId: AGENT_IDS[3],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Office Floor in New Administrative Capital',
        description: 'Full floor open office space, smart building',
        type: 'OFFICE', status: 'AVAILABLE', price: 200000, area: 500,
        address: 'Business District, Tower C3', city: 'New Capital', region: 'Business District',
        features: { smartBuilding: true, conferenceRooms: true, parking: true },
        assignedAgentId: AGENT_IDS[4],
      },
    }),
    prisma.property.create({
      data: {
        title: '3BR Apartment in Sheikh Zayed',
        description: 'Corner unit with garden view',
        type: 'APARTMENT', status: 'AVAILABLE', price: 2800000, area: 165,
        bedrooms: 3, bathrooms: 2, floor: 2,
        address: 'Zayed 2000 Compound', city: 'Cairo', region: 'Sheikh Zayed',
        features: { gardenView: true, parking: true, clubAccess: true },
        assignedAgentId: AGENT_IDS[0],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Retail Shop in Mall of Egypt',
        description: 'High-traffic location, food court wing',
        type: 'SHOP', status: 'AVAILABLE', price: 250000, area: 80, floor: 1,
        address: 'Mall of Egypt, 6th October', city: 'Cairo', region: '6th of October',
        features: { highTraffic: true, foodCourt: true },
        assignedAgentId: AGENT_IDS[1],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Land in New Mansoura',
        description: 'Residential land plot near the coast',
        type: 'LAND', status: 'AVAILABLE', price: 900000, area: 300,
        address: 'New Mansoura City, Sector 4', city: 'Mansoura', region: 'New Mansoura',
        features: { coastal: true, utilities: true },
        assignedAgentId: AGENT_IDS[2],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Duplex in Katameya Heights',
        description: 'Golf course view duplex',
        type: 'DUPLEX', status: 'RESERVED', price: 15000000, area: 400,
        bedrooms: 5, bathrooms: 4, floor: 0,
        address: 'Katameya Heights, Street 9', city: 'Cairo', region: 'New Cairo',
        features: { golfView: true, pool: true, security: true, smartHome: true },
        assignedAgentId: AGENT_IDS[3],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Chalet in Sahel - Marassi',
        description: 'Premium chalet in Marassi resort',
        type: 'CHALET', status: 'SOLD', price: 4500000, area: 150,
        bedrooms: 3, bathrooms: 2, floor: 0,
        address: 'Marassi, Sidi Abdel Rahman', city: 'North Coast', region: 'Sidi Abdel Rahman',
        features: { beachAccess: true, pool: true, lagoon: true },
        assignedAgentId: AGENT_IDS[4],
      },
    }),
    prisma.property.create({
      data: {
        title: '4BR Apartment in Tagamoa',
        description: 'Family apartment in gated compound',
        type: 'APARTMENT', status: 'AVAILABLE', price: 4200000, area: 220,
        bedrooms: 4, bathrooms: 3, floor: 5,
        address: 'Mountain View, Tagamoa', city: 'Cairo', region: 'New Cairo',
        features: { compound: true, parking: true, clubAccess: true },
        assignedAgentId: AGENT_IDS[0],
      },
    }),
    prisma.property.create({
      data: {
        title: 'Warehouse in 10th of Ramadan',
        description: 'Industrial warehouse with loading docks',
        type: 'BUILDING', status: 'AVAILABLE', price: 8000000, area: 1200,
        address: 'Industrial Zone A, 10th of Ramadan', city: '10th of Ramadan', region: 'Sharqia',
        features: { loadingDock: true, highCeiling: true, parking: true },
        assignedAgentId: AGENT_IDS[1],
      },
    }),
  ]);
  console.log(`✅ Created ${properties.length} properties`);

  // ─── Clients (16) ───────────────────────────────────────────────
  const clients = await Promise.all([
    prisma.client.create({ data: { firstName: 'Ahmed', lastName: 'Hassan', email: 'ahmed.hassan@email.com', phone: '+201001234567', nationalId: '29001011234567', type: 'BUYER', source: 'REFERRAL', notes: 'Looking for family apartment in New Cairo', assignedAgentId: AGENT_IDS[0] } }),
    prisma.client.create({ data: { firstName: 'Fatma', lastName: 'Ali', email: 'fatma.ali@email.com', phone: '+201112345678', type: 'BUYER', source: 'WEBSITE', notes: 'First-time buyer, budget 2-3M EGP', assignedAgentId: AGENT_IDS[0] } }),
    prisma.client.create({ data: { firstName: 'Mohamed', lastName: 'Ibrahim', email: 'mo.ibrahim@email.com', phone: '+201223456789', nationalId: '28505051234567', type: 'INVESTOR', source: 'SOCIAL_MEDIA', notes: 'Interested in commercial properties', assignedAgentId: AGENT_IDS[1] } }),
    prisma.client.create({ data: { firstName: 'Sara', lastName: 'Mahmoud', email: 'sara.m@email.com', phone: '+201034567890', type: 'TENANT', source: 'WALK_IN', notes: 'Looking for furnished apartment', assignedAgentId: AGENT_IDS[1] } }),
    prisma.client.create({ data: { firstName: 'Khaled', lastName: 'Mostafa', email: 'khaled.m@email.com', phone: '+201145678901', nationalId: '29201011234567', type: 'SELLER', source: 'PHONE', notes: 'Selling inherited villa', assignedAgentId: AGENT_IDS[2] } }),
    prisma.client.create({ data: { firstName: 'Nour', lastName: 'El-Din', email: 'nour.eldin@email.com', phone: '+201256789012', type: 'BUYER', source: 'ADVERTISEMENT', notes: 'Relocating from Saudi, needs large villa', assignedAgentId: AGENT_IDS[2] } }),
    prisma.client.create({ data: { firstName: 'Tarek', lastName: 'Sayed', email: 'tarek.s@email.com', phone: '+201067890123', nationalId: '28808081234567', type: 'LANDLORD', source: 'REFERRAL', notes: 'Owns multiple properties in Zamalek', assignedAgentId: AGENT_IDS[3] } }),
    prisma.client.create({ data: { firstName: 'Hana', lastName: 'Youssef', email: 'hana.y@email.com', phone: '+201178901234', type: 'BUYER', source: 'WEBSITE', notes: 'Young professional, looking for studio', assignedAgentId: AGENT_IDS[3] } }),
    prisma.client.create({ data: { firstName: 'Omar', lastName: 'Farouk', email: 'omar.f@email.com', phone: '+201289012345', nationalId: '29505051234567', type: 'INVESTOR', source: 'SOCIAL_MEDIA', notes: 'Portfolio investor, 10+ properties', assignedAgentId: AGENT_IDS[4] } }),
    prisma.client.create({ data: { firstName: 'Layla', lastName: 'Abdel-Rahim', email: 'layla.ar@email.com', phone: '+201090123456', type: 'TENANT', source: 'OTHER', notes: 'Corporate lease for expat employees', assignedAgentId: AGENT_IDS[4] } }),
    prisma.client.create({ data: { firstName: 'Yasser', lastName: 'Gamal', email: 'yasser.g@email.com', phone: '+201501234567', type: 'BUYER', source: 'REFERRAL', assignedAgentId: AGENT_IDS[0] } }),
    prisma.client.create({ data: { firstName: 'Dina', lastName: 'Adel', email: 'dina.adel@email.com', phone: '+201612345678', type: 'SELLER', source: 'PHONE', notes: 'Downsizing, selling family home', assignedAgentId: AGENT_IDS[1] } }),
    prisma.client.create({ data: { firstName: 'Amr', lastName: 'Helmy', email: 'amr.helmy@email.com', phone: '+201723456789', nationalId: '29303031234567', type: 'BUYER', source: 'WEBSITE', notes: 'Interested in North Coast chalets', assignedAgentId: AGENT_IDS[2] } }),
    prisma.client.create({ data: { firstName: 'Mona', lastName: 'Rashid', email: 'mona.r@email.com', phone: '+201834567890', type: 'LANDLORD', source: 'WALK_IN', notes: 'Managing family property portfolio', assignedAgentId: AGENT_IDS[3] } }),
    prisma.client.create({ data: { firstName: 'Sherif', lastName: 'Nabil', email: 'sherif.n@email.com', phone: '+201945678901', type: 'BUYER', source: 'ADVERTISEMENT', notes: 'Looking for commercial space in New Capital', assignedAgentId: AGENT_IDS[4] } }),
    prisma.client.create({ data: { firstName: 'Rania', lastName: 'Kamel', email: 'rania.k@email.com', phone: '+201056789012', type: 'BUYER', source: 'WEBSITE', notes: 'Looking for investment apartments', assignedAgentId: AGENT_IDS[0] } }),
  ]);
  console.log(`✅ Created ${clients.length} clients`);

  // ─── Leads (28) ─────────────────────────────────────────────────
  const leadData = [
    { clientIdx: 0, propIdx: 1, status: 'QUALIFIED' as const, priority: 'HIGH' as const, source: 'Agent referral', budget: 15000000, notes: 'Visited property twice, very interested', agentIdx: 0, nextFollowUp: new Date('2026-03-28') },
    { clientIdx: 1, propIdx: 0, status: 'CONTACTED' as const, priority: 'MEDIUM' as const, source: 'Website inquiry', budget: 3500000, notes: 'Requested floor plan', agentIdx: 0, nextFollowUp: new Date('2026-03-27') },
    { clientIdx: 2, propIdx: 10, status: 'PROPOSAL' as const, priority: 'HIGH' as const, source: 'LinkedIn campaign', budget: 50000000, notes: 'Wants to convert to mixed-use', agentIdx: 1, nextFollowUp: new Date('2026-03-26') },
    { clientIdx: 3, propIdx: 13, status: 'NEW' as const, priority: 'MEDIUM' as const, source: 'Walk-in', budget: 500000, notes: 'Needs 1-year lease', agentIdx: 1 },
    { clientIdx: 5, propIdx: 1, status: 'NEGOTIATION' as const, priority: 'URGENT' as const, source: 'Ad campaign', budget: 12000000, notes: 'Counter-offered at 11.5M', agentIdx: 2, nextFollowUp: new Date('2026-03-26') },
    { clientIdx: 7, propIdx: 4, status: 'CONTACTED' as const, priority: 'LOW' as const, source: 'Website', budget: 900000, notes: 'Exploring options, not urgent', agentIdx: 3 },
    { clientIdx: 8, propIdx: undefined, status: 'QUALIFIED' as const, priority: 'HIGH' as const, source: 'Social media', budget: 20000000, notes: 'Looking for bulk commercial properties', agentIdx: 4, nextFollowUp: new Date('2026-03-29') },
    { clientIdx: 12, propIdx: 19, status: 'WON' as const, priority: 'MEDIUM' as const, source: 'Website', budget: 5000000, notes: 'Deal closed, contract pending', agentIdx: 2 },
    { clientIdx: 14, propIdx: 14, status: 'NEW' as const, priority: 'HIGH' as const, source: 'Ad', budget: 250000, notes: 'Interested in leasing full floor', agentIdx: 4, nextFollowUp: new Date('2026-03-27') },
    { clientIdx: 10, propIdx: 15, status: 'LOST' as const, priority: 'LOW' as const, source: 'Referral', budget: 3000000, notes: 'Chose competitor listing', agentIdx: 0 },
    // Additional leads for Sprint 3 (25+ total)
    { clientIdx: 0, propIdx: 20, status: 'NEW' as const, priority: 'MEDIUM' as const, source: 'Website', budget: 4500000, notes: 'Looking at Tagamoa apartments', agentIdx: 0, nextFollowUp: new Date('2026-04-01') },
    { clientIdx: 1, propIdx: 5, status: 'QUALIFIED' as const, priority: 'HIGH' as const, source: 'Referral', budget: 5500000, notes: 'Wants duplex with rooftop', agentIdx: 0, nextFollowUp: new Date('2026-03-30') },
    { clientIdx: 2, propIdx: 21, status: 'PROPOSAL' as const, priority: 'URGENT' as const, source: 'Direct call', budget: 9000000, notes: 'Industrial investment opportunity', agentIdx: 1, nextFollowUp: new Date('2026-03-28') },
    { clientIdx: 3, propIdx: 4, status: 'CONTACTED' as const, priority: 'LOW' as const, source: 'Social media', budget: 850000, notes: 'Part-time residence in Alex', agentIdx: 1 },
    { clientIdx: 4, propIdx: 12, status: 'NEW' as const, priority: 'MEDIUM' as const, source: 'Walk-in', budget: 8000000, notes: 'Selling villa, needs valuation', agentIdx: 2 },
    { clientIdx: 5, propIdx: 7, status: 'NEGOTIATION' as const, priority: 'HIGH' as const, source: 'Agent referral', budget: 9000000, notes: 'Penthouse negotiation ongoing', agentIdx: 3, nextFollowUp: new Date('2026-03-29') },
    { clientIdx: 6, propIdx: 0, status: 'WON' as const, priority: 'MEDIUM' as const, source: 'Referral', budget: 3500000, notes: 'Lease signed for Zamalek apt', agentIdx: 3 },
    { clientIdx: 7, propIdx: 11, status: 'CONTACTED' as const, priority: 'MEDIUM' as const, source: 'Website', budget: 1000000, notes: 'Interested in Heliopolis', agentIdx: 3, nextFollowUp: new Date('2026-04-02') },
    { clientIdx: 8, propIdx: 16, status: 'QUALIFIED' as const, priority: 'HIGH' as const, source: 'Social media', budget: 300000, notes: 'Mall retail investment', agentIdx: 4, nextFollowUp: new Date('2026-04-01') },
    { clientIdx: 9, propIdx: 13, status: 'WON' as const, priority: 'MEDIUM' as const, source: 'Corporate', budget: 540000, notes: 'Corporate lease signed', agentIdx: 4 },
    { clientIdx: 10, propIdx: 8, status: 'CONTACTED' as const, priority: 'LOW' as const, source: 'Website', budget: 2000000, notes: 'Summer chalet inquiry', agentIdx: 0 },
    { clientIdx: 11, propIdx: 9, status: 'LOST' as const, priority: 'MEDIUM' as const, source: 'Phone', budget: 1500000, notes: 'Price too high for budget', agentIdx: 1 },
    { clientIdx: 12, propIdx: 6, status: 'PROPOSAL' as const, priority: 'HIGH' as const, source: 'Website', budget: 2200000, notes: 'Interested in North Coast land', agentIdx: 2, nextFollowUp: new Date('2026-04-03') },
    { clientIdx: 13, propIdx: 18, status: 'NEGOTIATION' as const, priority: 'URGENT' as const, source: 'Referral', budget: 16000000, notes: 'Katameya Heights final offer', agentIdx: 3, nextFollowUp: new Date('2026-03-28') },
    { clientIdx: 14, propIdx: 2, status: 'QUALIFIED' as const, priority: 'HIGH' as const, source: 'Ad', budget: 100000, notes: 'Office lease in Smart Village', agentIdx: 4, nextFollowUp: new Date('2026-04-05') },
    { clientIdx: 15, propIdx: 15, status: 'NEW' as const, priority: 'MEDIUM' as const, source: 'Website', budget: 3000000, notes: 'First inquiry, follow up needed', agentIdx: 0 },
    { clientIdx: 15, propIdx: 20, status: 'CONTACTED' as const, priority: 'HIGH' as const, source: 'Website', budget: 4500000, notes: 'Second property viewing scheduled', agentIdx: 0, nextFollowUp: new Date('2026-04-04') },
    { clientIdx: 6, propIdx: 15, status: 'LOST' as const, priority: 'LOW' as const, source: 'Referral', budget: 2800000, notes: 'Found better deal elsewhere', agentIdx: 0 },
  ];

  const leads = [];
  for (const ld of leadData) {
    const lead = await prisma.lead.create({
      data: {
        clientId: clients[ld.clientIdx].id,
        propertyId: ld.propIdx !== undefined ? properties[ld.propIdx].id : undefined,
        status: ld.status,
        priority: ld.priority,
        source: ld.source,
        budget: ld.budget,
        notes: ld.notes,
        assignedAgentId: AGENT_IDS[ld.agentIdx],
        nextFollowUp: ld.nextFollowUp,
      },
    });
    leads.push(lead);
  }
  console.log(`✅ Created ${leads.length} leads`);

  // ─── Lead Activities (30+) ──────────────────────────────────────
  const leadActivityData = [
    { leadIdx: 0, type: 'VIEWING' as const, desc: 'First property viewing with client', agent: 0 },
    { leadIdx: 0, type: 'FOLLOW_UP' as const, desc: 'Follow-up call, client still interested', agent: 0 },
    { leadIdx: 0, type: 'NOTE' as const, desc: 'Client requested second viewing with family', agent: 0 },
    { leadIdx: 1, type: 'CALL' as const, desc: 'Initial call to discuss requirements', agent: 0 },
    { leadIdx: 1, type: 'EMAIL' as const, desc: 'Sent floor plan and pricing details', agent: 0 },
    { leadIdx: 2, type: 'MEETING' as const, desc: 'Meeting to discuss proposal terms', agent: 1 },
    { leadIdx: 2, type: 'NOTE' as const, desc: 'Client wants legal review before proceeding', agent: 1 },
    { leadIdx: 4, type: 'CALL' as const, desc: 'Price negotiation call', agent: 2 },
    { leadIdx: 4, type: 'STATUS_CHANGE' as const, desc: 'Moved to negotiation stage', agent: 2 },
    { leadIdx: 4, type: 'MEETING' as const, desc: 'In-person negotiation meeting at office', agent: 2 },
    { leadIdx: 5, type: 'CALL' as const, desc: 'Called about studio availability', agent: 3 },
    { leadIdx: 6, type: 'VIEWING' as const, desc: 'Toured 3 commercial properties', agent: 4 },
    { leadIdx: 6, type: 'NOTE' as const, desc: 'Client shortlisted 2 properties', agent: 4 },
    { leadIdx: 7, type: 'STATUS_CHANGE' as const, desc: 'Lead won - contract to be drafted', agent: 2 },
    { leadIdx: 10, type: 'CALL' as const, desc: 'Initial call about Tagamoa apartment', agent: 0 },
    { leadIdx: 11, type: 'VIEWING' as const, desc: 'Duplex viewing in Madinaty', agent: 0 },
    { leadIdx: 11, type: 'FOLLOW_UP' as const, desc: 'Follow-up: client wants financing options', agent: 0 },
    { leadIdx: 12, type: 'MEETING' as const, desc: 'Factory tour and investment discussion', agent: 1 },
    { leadIdx: 15, type: 'CALL' as const, desc: 'Penthouse pricing discussion', agent: 3 },
    { leadIdx: 15, type: 'VIEWING' as const, desc: 'Penthouse viewing with client and architect', agent: 3 },
    { leadIdx: 16, type: 'STATUS_CHANGE' as const, desc: 'Lease agreement signed', agent: 3 },
    { leadIdx: 18, type: 'CALL' as const, desc: 'Discussed retail investment in Mall of Egypt', agent: 4 },
    { leadIdx: 19, type: 'STATUS_CHANGE' as const, desc: 'Corporate lease won', agent: 4 },
    { leadIdx: 22, type: 'VIEWING' as const, desc: 'Land site visit in North Coast', agent: 2 },
    { leadIdx: 23, type: 'MEETING' as const, desc: 'Final negotiation for Katameya duplex', agent: 3 },
    { leadIdx: 23, type: 'CALL' as const, desc: 'Counter-offer discussion with seller', agent: 3 },
    { leadIdx: 24, type: 'VIEWING' as const, desc: 'Office space tour at Smart Village', agent: 4 },
    { leadIdx: 26, type: 'VIEWING' as const, desc: 'Second viewing of Tagamoa apartment', agent: 0 },
    { leadIdx: 26, type: 'NOTE' as const, desc: 'Client comparing with Sheikh Zayed option', agent: 0 },
    { leadIdx: 3, type: 'FOLLOW_UP' as const, desc: 'Reminded about available furnished studios', agent: 1 },
  ];

  for (const act of leadActivityData) {
    await prisma.leadActivity.create({
      data: {
        leadId: leads[act.leadIdx].id,
        type: act.type,
        description: act.desc,
        performedBy: AGENT_IDS[act.agent],
      },
    });
  }
  console.log(`✅ Created ${leadActivityData.length} lead activities`);

  // ─── Contracts (12) ─────────────────────────────────────────────
  const contracts = await Promise.all([
    prisma.contract.create({
      data: {
        type: 'SALE', propertyId: properties[9].id, clientId: clients[0].id, agentId: AGENT_IDS[4],
        startDate: new Date('2026-02-01'), totalAmount: 1500000,
        paymentTerms: { installments: 4, downPayment: 500000 },
        status: 'COMPLETED', notes: 'Sale completed, property transferred',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'RENT', propertyId: properties[3].id, clientId: clients[3].id, agentId: AGENT_IDS[1],
        startDate: new Date('2026-01-15'), endDate: new Date('2027-01-14'),
        totalAmount: 1800000, paymentTerms: { monthlyRent: 150000, deposit: 300000 },
        status: 'ACTIVE', notes: 'Annual lease with auto-renewal',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'SALE', propertyId: properties[19].id, clientId: clients[12].id, agentId: AGENT_IDS[2],
        startDate: new Date('2026-03-20'), totalAmount: 4500000,
        paymentTerms: { installments: 6, downPayment: 1500000 },
        status: 'ACTIVE', notes: 'Installment sale, 6 quarterly payments',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'RENT', propertyId: properties[13].id, clientId: clients[9].id, agentId: AGENT_IDS[3],
        startDate: new Date('2026-03-01'), endDate: new Date('2027-02-28'),
        totalAmount: 540000, paymentTerms: { monthlyRent: 45000, deposit: 90000 },
        status: 'ACTIVE',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'LEASE', propertyId: properties[2].id, clientId: clients[2].id, agentId: AGENT_IDS[1],
        startDate: new Date('2026-04-01'), endDate: new Date('2029-03-31'),
        totalAmount: 3060000, paymentTerms: { monthlyRent: 85000, annualIncrease: '10%' },
        status: 'DRAFT', notes: 'Pending legal review',
      },
    }),
    // Additional contracts for Sprint 3
    prisma.contract.create({
      data: {
        type: 'SALE', propertyId: properties[7].id, clientId: clients[5].id, agentId: AGENT_IDS[3],
        startDate: new Date('2026-03-15'), totalAmount: 8500000,
        paymentTerms: { installments: 8, downPayment: 2500000 },
        status: 'ACTIVE', notes: 'Penthouse sale in Garden City, 8 quarterly installments',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'RENT', propertyId: properties[0].id, clientId: clients[6].id, agentId: AGENT_IDS[3],
        startDate: new Date('2026-04-01'), endDate: new Date('2028-03-31'),
        totalAmount: 2520000, paymentTerms: { monthlyRent: 105000, deposit: 210000 },
        status: 'DRAFT', notes: 'Zamalek apartment 2-year lease, pending signatures',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'SALE', propertyId: properties[18].id, clientId: clients[13].id, agentId: AGENT_IDS[3],
        startDate: new Date('2026-02-20'), totalAmount: 15000000,
        paymentTerms: { installments: 10, downPayment: 5000000 },
        status: 'ACTIVE', notes: 'Katameya Heights duplex premium sale',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'LEASE', propertyId: properties[14].id, clientId: clients[14].id, agentId: AGENT_IDS[4],
        startDate: new Date('2026-05-01'), endDate: new Date('2031-04-30'),
        totalAmount: 12000000, paymentTerms: { monthlyRent: 200000, annualIncrease: '8%' },
        status: 'DRAFT', notes: 'New Capital office 5-year lease',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'RENT', propertyId: properties[4].id, clientId: clients[7].id, agentId: AGENT_IDS[2],
        startDate: new Date('2026-06-01'), endDate: new Date('2027-05-31'),
        totalAmount: 96000, paymentTerms: { monthlyRent: 8000, deposit: 16000 },
        status: 'DRAFT', notes: 'Studio rental in Alexandria, summer start',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'SALE', propertyId: properties[20].id, clientId: clients[15].id, agentId: AGENT_IDS[0],
        startDate: new Date('2026-03-25'), totalAmount: 4200000,
        paymentTerms: { installments: 6, downPayment: 1200000 },
        status: 'ACTIVE', notes: 'Tagamoa apartment sale',
      },
    }),
    prisma.contract.create({
      data: {
        type: 'SALE', propertyId: properties[5].id, clientId: clients[1].id, agentId: AGENT_IDS[2],
        startDate: new Date('2026-01-10'), totalAmount: 5200000,
        paymentTerms: { installments: 4, downPayment: 2000000 },
        status: 'COMPLETED', notes: 'Madinaty duplex sale completed',
      },
    }),
  ]);
  console.log(`✅ Created ${contracts.length} contracts`);

  // ─── Invoices (18) ──────────────────────────────────────────────
  const invoices = await Promise.all([
    prisma.invoice.create({ data: { contractId: contracts[0].id, invoiceNumber: 'INV-2026-001', amount: 500000, dueDate: new Date('2026-02-01'), paidDate: new Date('2026-02-01'), status: 'PAID', paymentMethod: 'BANK_TRANSFER', notes: 'Down payment' } }),
    prisma.invoice.create({ data: { contractId: contracts[0].id, invoiceNumber: 'INV-2026-002', amount: 333333, dueDate: new Date('2026-05-01'), status: 'PENDING', notes: 'Installment 1 of 3' } }),
    prisma.invoice.create({ data: { contractId: contracts[0].id, invoiceNumber: 'INV-2026-003', amount: 333333, dueDate: new Date('2026-08-01'), status: 'PENDING', notes: 'Installment 2 of 3' } }),
    prisma.invoice.create({ data: { contractId: contracts[0].id, invoiceNumber: 'INV-2026-004', amount: 333334, dueDate: new Date('2026-11-01'), status: 'PENDING', notes: 'Installment 3 of 3' } }),
    prisma.invoice.create({ data: { contractId: contracts[1].id, invoiceNumber: 'INV-2026-005', amount: 300000, dueDate: new Date('2026-01-15'), paidDate: new Date('2026-01-15'), status: 'PAID', paymentMethod: 'CASH', notes: 'Security deposit' } }),
    prisma.invoice.create({ data: { contractId: contracts[1].id, invoiceNumber: 'INV-2026-006', amount: 150000, dueDate: new Date('2026-02-15'), paidDate: new Date('2026-02-14'), status: 'PAID', paymentMethod: 'BANK_TRANSFER', notes: 'Feb rent' } }),
    prisma.invoice.create({ data: { contractId: contracts[1].id, invoiceNumber: 'INV-2026-007', amount: 150000, dueDate: new Date('2026-03-15'), status: 'PENDING', notes: 'Mar rent' } }),
    prisma.invoice.create({ data: { contractId: contracts[2].id, invoiceNumber: 'INV-2026-008', amount: 1500000, dueDate: new Date('2026-03-20'), paidDate: new Date('2026-03-20'), status: 'PAID', paymentMethod: 'CHECK', notes: 'Down payment' } }),
    prisma.invoice.create({ data: { contractId: contracts[2].id, invoiceNumber: 'INV-2026-009', amount: 600000, dueDate: new Date('2026-06-20'), status: 'PENDING', notes: 'Q2 installment' } }),
    prisma.invoice.create({ data: { contractId: contracts[3].id, invoiceNumber: 'INV-2026-010', amount: 90000, dueDate: new Date('2026-03-01'), paidDate: new Date('2026-03-01'), status: 'PAID', paymentMethod: 'BANK_TRANSFER', notes: 'Security deposit' } }),
    // Additional invoices for new contracts
    prisma.invoice.create({ data: { contractId: contracts[5].id, invoiceNumber: 'INV-2026-011', amount: 2500000, dueDate: new Date('2026-03-15'), paidDate: new Date('2026-03-15'), status: 'PAID', paymentMethod: 'BANK_TRANSFER', notes: 'Penthouse down payment' } }),
    prisma.invoice.create({ data: { contractId: contracts[5].id, invoiceNumber: 'INV-2026-012', amount: 750000, dueDate: new Date('2026-06-15'), status: 'PENDING', notes: 'Q2 installment' } }),
    prisma.invoice.create({ data: { contractId: contracts[7].id, invoiceNumber: 'INV-2026-013', amount: 5000000, dueDate: new Date('2026-02-20'), paidDate: new Date('2026-02-20'), status: 'PAID', paymentMethod: 'CHECK', notes: 'Katameya Heights down payment' } }),
    prisma.invoice.create({ data: { contractId: contracts[7].id, invoiceNumber: 'INV-2026-014', amount: 1000000, dueDate: new Date('2026-05-20'), status: 'PENDING', notes: 'Q2 installment' } }),
    prisma.invoice.create({ data: { contractId: contracts[10].id, invoiceNumber: 'INV-2026-015', amount: 1200000, dueDate: new Date('2026-03-25'), paidDate: new Date('2026-03-25'), status: 'PAID', paymentMethod: 'BANK_TRANSFER', notes: 'Tagamoa down payment' } }),
    prisma.invoice.create({ data: { contractId: contracts[10].id, invoiceNumber: 'INV-2026-016', amount: 600000, dueDate: new Date('2026-06-25'), status: 'PENDING', notes: 'Q2 installment' } }),
    prisma.invoice.create({ data: { contractId: contracts[11].id, invoiceNumber: 'INV-2026-017', amount: 2000000, dueDate: new Date('2026-01-10'), paidDate: new Date('2026-01-10'), status: 'PAID', paymentMethod: 'BANK_TRANSFER', notes: 'Madinaty down payment' } }),
    prisma.invoice.create({ data: { contractId: contracts[11].id, invoiceNumber: 'INV-2026-018', amount: 1066667, dueDate: new Date('2026-04-10'), paidDate: new Date('2026-04-08'), status: 'PAID', paymentMethod: 'CHECK', notes: 'Q2 installment' } }),
  ]);
  console.log(`✅ Created ${invoices.length} invoices`);

  // ─── Activities (55+) ───────────────────────────────────────────
  const activityData = [
    // Property activities
    { type: 'CREATE', desc: 'Property listed: Modern 3BR Apartment in Zamalek', entityType: 'PROPERTY' as const, entityIdx: 0, agent: 0 },
    { type: 'CREATE', desc: 'Property listed: Luxury Villa in New Cairo', entityType: 'PROPERTY' as const, entityIdx: 1, agent: 0 },
    { type: 'UPDATE', desc: 'Property status changed to SOLD', entityType: 'PROPERTY' as const, entityIdx: 9, agent: 4, metadata: { oldStatus: 'RESERVED', newStatus: 'SOLD' } },
    { type: 'CREATE', desc: 'Property listed: Penthouse in Garden City', entityType: 'PROPERTY' as const, entityIdx: 7, agent: 3 },
    { type: 'UPDATE', desc: 'Property status changed to RESERVED', entityType: 'PROPERTY' as const, entityIdx: 7, agent: 3, metadata: { oldStatus: 'AVAILABLE', newStatus: 'RESERVED' } },
    { type: 'CREATE', desc: 'Property listed: 4BR Apartment in Tagamoa', entityType: 'PROPERTY' as const, entityIdx: 20, agent: 0 },
    { type: 'UPDATE', desc: 'Price updated for Commercial Building', entityType: 'PROPERTY' as const, entityIdx: 10, agent: 0, metadata: { oldPrice: 40000000, newPrice: 45000000 } },
    { type: 'CREATE', desc: 'Property listed: Warehouse in 10th of Ramadan', entityType: 'PROPERTY' as const, entityIdx: 21, agent: 1 },
    { type: 'UPDATE', desc: 'Property status changed to RENTED', entityType: 'PROPERTY' as const, entityIdx: 3, agent: 1, metadata: { oldStatus: 'AVAILABLE', newStatus: 'RENTED' } },
    { type: 'UPDATE', desc: 'Property status changed to RENTED', entityType: 'PROPERTY' as const, entityIdx: 13, agent: 3, metadata: { oldStatus: 'AVAILABLE', newStatus: 'RENTED' } },
    // Client activities
    { type: 'CREATE', desc: 'New client registered: Ahmed Hassan', entityType: 'CLIENT' as const, entityIdx: 0, agent: 0 },
    { type: 'CREATE', desc: 'New client registered: Fatma Ali', entityType: 'CLIENT' as const, entityIdx: 1, agent: 0 },
    { type: 'CREATE', desc: 'New client registered: Mohamed Ibrahim', entityType: 'CLIENT' as const, entityIdx: 2, agent: 1 },
    { type: 'UPDATE', desc: 'Client profile updated: Sara Mahmoud', entityType: 'CLIENT' as const, entityIdx: 3, agent: 1 },
    { type: 'CREATE', desc: 'New client registered: Nour El-Din', entityType: 'CLIENT' as const, entityIdx: 5, agent: 2 },
    { type: 'CREATE', desc: 'New client registered: Omar Farouk', entityType: 'CLIENT' as const, entityIdx: 8, agent: 4 },
    { type: 'CREATE', desc: 'New client registered: Rania Kamel', entityType: 'CLIENT' as const, entityIdx: 15, agent: 0 },
    { type: 'UPDATE', desc: 'Client type changed to INVESTOR', entityType: 'CLIENT' as const, entityIdx: 8, agent: 4, metadata: { oldType: 'BUYER', newType: 'INVESTOR' } },
    // Lead activities
    { type: 'CREATE', desc: 'New lead created for Ahmed Hassan', entityType: 'LEAD' as const, entityIdx: 0, agent: 0 },
    { type: 'UPDATE', desc: 'Lead qualified: Ahmed Hassan - Villa in New Cairo', entityType: 'LEAD' as const, entityIdx: 0, agent: 0 },
    { type: 'CREATE', desc: 'New lead created for Mohamed Ibrahim', entityType: 'LEAD' as const, entityIdx: 2, agent: 1 },
    { type: 'UPDATE', desc: 'Lead moved to proposal stage', entityType: 'LEAD' as const, entityIdx: 2, agent: 1 },
    { type: 'UPDATE', desc: 'Lead moved to negotiation: Nour El-Din', entityType: 'LEAD' as const, entityIdx: 4, agent: 2 },
    { type: 'UPDATE', desc: 'Lead won: Amr Helmy - Marassi Chalet', entityType: 'LEAD' as const, entityIdx: 7, agent: 2 },
    { type: 'CREATE', desc: 'New lead: Rania Kamel - Sheikh Zayed', entityType: 'LEAD' as const, entityIdx: 25, agent: 0 },
    { type: 'UPDATE', desc: 'Lead lost: Yasser Gamal - Sheikh Zayed', entityType: 'LEAD' as const, entityIdx: 9, agent: 0 },
    { type: 'UPDATE', desc: 'Lead won: Tarek Sayed - Zamalek lease', entityType: 'LEAD' as const, entityIdx: 16, agent: 3 },
    { type: 'UPDATE', desc: 'Lead won: Layla - Corporate lease', entityType: 'LEAD' as const, entityIdx: 19, agent: 4 },
    { type: 'CREATE', desc: 'New lead: Mona Rashid - Katameya Heights', entityType: 'LEAD' as const, entityIdx: 23, agent: 3 },
    // Contract activities
    { type: 'CREATE', desc: 'Contract signed: 2BR Mohandessin sale', entityType: 'CONTRACT' as const, entityIdx: 0, agent: 4 },
    { type: 'UPDATE', desc: 'Contract completed: 2BR Mohandessin', entityType: 'CONTRACT' as const, entityIdx: 0, agent: 4, metadata: { oldStatus: 'ACTIVE', newStatus: 'COMPLETED' } },
    { type: 'CREATE', desc: 'Contract created: Citystars rent', entityType: 'CONTRACT' as const, entityIdx: 1, agent: 1 },
    { type: 'CREATE', desc: 'Contract created: Marassi chalet sale', entityType: 'CONTRACT' as const, entityIdx: 2, agent: 2 },
    { type: 'CREATE', desc: 'Contract created: Dokki studio rent', entityType: 'CONTRACT' as const, entityIdx: 3, agent: 3 },
    { type: 'CREATE', desc: 'Contract drafted: Smart Village lease', entityType: 'CONTRACT' as const, entityIdx: 4, agent: 1 },
    { type: 'CREATE', desc: 'Contract created: Penthouse Garden City sale', entityType: 'CONTRACT' as const, entityIdx: 5, agent: 3 },
    { type: 'CREATE', desc: 'Contract drafted: Zamalek apartment lease', entityType: 'CONTRACT' as const, entityIdx: 6, agent: 3 },
    { type: 'CREATE', desc: 'Contract created: Katameya Heights sale', entityType: 'CONTRACT' as const, entityIdx: 7, agent: 3 },
    { type: 'CREATE', desc: 'Contract created: Tagamoa apartment sale', entityType: 'CONTRACT' as const, entityIdx: 10, agent: 0 },
    { type: 'CREATE', desc: 'Contract completed: Madinaty duplex sale', entityType: 'CONTRACT' as const, entityIdx: 11, agent: 2 },
    // Invoice activities
    { type: 'CREATE', desc: 'Invoice generated: INV-2026-001 (down payment)', entityType: 'INVOICE' as const, entityIdx: 0, agent: 4 },
    { type: 'UPDATE', desc: 'Invoice paid: INV-2026-001', entityType: 'INVOICE' as const, entityIdx: 0, agent: 4, metadata: { status: 'PAID', method: 'BANK_TRANSFER' } },
    { type: 'CREATE', desc: 'Invoice generated: INV-2026-005 (security deposit)', entityType: 'INVOICE' as const, entityIdx: 4, agent: 1 },
    { type: 'UPDATE', desc: 'Invoice paid: INV-2026-005', entityType: 'INVOICE' as const, entityIdx: 4, agent: 1, metadata: { status: 'PAID', method: 'CASH' } },
    { type: 'UPDATE', desc: 'Invoice paid: INV-2026-006 (Feb rent)', entityType: 'INVOICE' as const, entityIdx: 5, agent: 1 },
    { type: 'UPDATE', desc: 'Invoice paid: INV-2026-008 (Marassi down payment)', entityType: 'INVOICE' as const, entityIdx: 7, agent: 2 },
    { type: 'UPDATE', desc: 'Invoice paid: INV-2026-010 (Dokki deposit)', entityType: 'INVOICE' as const, entityIdx: 9, agent: 3 },
    { type: 'UPDATE', desc: 'Invoice paid: INV-2026-011 (Penthouse down payment)', entityType: 'INVOICE' as const, entityIdx: 10, agent: 3 },
    { type: 'UPDATE', desc: 'Invoice paid: INV-2026-013 (Katameya down payment)', entityType: 'INVOICE' as const, entityIdx: 12, agent: 3 },
    { type: 'UPDATE', desc: 'Invoice paid: INV-2026-015 (Tagamoa down payment)', entityType: 'INVOICE' as const, entityIdx: 14, agent: 0 },
    { type: 'UPDATE', desc: 'Invoice paid: INV-2026-017 (Madinaty down payment)', entityType: 'INVOICE' as const, entityIdx: 16, agent: 2 },
    { type: 'UPDATE', desc: 'Invoice paid: INV-2026-018 (Madinaty Q2)', entityType: 'INVOICE' as const, entityIdx: 17, agent: 2 },
    // System activities
    { type: 'SYSTEM', desc: 'Database maintenance completed', entityType: 'PROPERTY' as const, entityIdx: 0, agent: 0 },
    { type: 'SYSTEM', desc: 'Monthly report generated for January 2026', entityType: 'CONTRACT' as const, entityIdx: 0, agent: 0 },
    { type: 'SYSTEM', desc: 'Monthly report generated for February 2026', entityType: 'CONTRACT' as const, entityIdx: 0, agent: 0 },
  ];

  const entityMap = {
    PROPERTY: properties,
    CLIENT: clients,
    LEAD: leads,
    CONTRACT: contracts,
    INVOICE: invoices,
  };

  for (const act of activityData) {
    const entities = entityMap[act.entityType];
    await prisma.activity.create({
      data: {
        type: act.type,
        description: act.desc,
        entityType: act.entityType,
        entityId: entities[act.entityIdx].id,
        performedBy: AGENT_IDS[act.agent],
        metadata: (act as any).metadata ?? undefined,
      },
    });
  }
  console.log(`✅ Created ${activityData.length} activities`);

  // ─── Settings ───────────────────────────────────────────────────
  await Promise.all([
    prisma.setting.create({ data: { key: 'company_name', value: '"Real Estate CRM"', description: 'Company display name' } }),
    prisma.setting.create({ data: { key: 'currency', value: '"EGP"', description: 'Default currency' } }),
    prisma.setting.create({ data: { key: 'invoice_prefix', value: '"INV"', description: 'Prefix for auto-generated invoice numbers' } }),
    prisma.setting.create({ data: { key: 'lead_auto_assign', value: 'true', description: 'Auto-assign leads to agents using round-robin' } }),
  ]);
  console.log('✅ Created settings');

  console.log('\n🎉 Seeding complete!');
  console.log(`   📊 ${properties.length} properties, ${clients.length} clients, ${leads.length} leads`);
  console.log(`   📄 ${contracts.length} contracts, ${invoices.length} invoices`);
  console.log(`   📝 ${leadActivityData.length} lead activities, ${activityData.length} global activities`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
