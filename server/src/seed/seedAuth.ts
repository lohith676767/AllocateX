import { prisma } from '../db/client.js';
import { hashPassword } from '../utils/password.js';

/** Demo password shared by every seeded account — see DEMO_CREDENTIALS.md. Never a real secret. */
const DEMO_PASSWORD = 'password123';

interface CompanySpec {
  name: string;
}

interface CompanyUserSpec {
  email: string;
  name: string;
  companyNames: string[];
}

interface NgoUserSpec {
  email: string;
  name: string;
  ngoName: string;
}

const COMPANIES: CompanySpec[] = [
  { name: 'Vertex Industries CSR' },
  { name: 'Horizon Bank CSR Trust' },
  { name: 'Meridian Textiles Foundation' },
];

const COMPANY_USERS: CompanyUserSpec[] = [
  { email: 'company1@fairfill.demo', name: 'Priya Sharma', companyNames: ['Vertex Industries CSR'] },
  {
    email: 'company2@fairfill.demo',
    name: 'Arjun Mehta',
    companyNames: ['Horizon Bank CSR Trust', 'Meridian Textiles Foundation'],
  },
];

const NGO_USERS: NgoUserSpec[] = [
  { email: 'ngo1@fairfill.demo', name: 'Anita Desai', ngoName: 'Grameen Swasthya Trust' },
  { email: 'ngo2@fairfill.demo', name: 'Rahul Verma', ngoName: 'JalDhara Foundation' },
];

/**
 * Idempotent by design (upserts keyed on email/name) so it can safely run
 * again after every `Reset Demo` — which recreates NGO/Region records with
 * fresh ids — without duplicating login accounts or losing the NGO<->User
 * link. Login accounts and companies are demo fixtures, not scenario data.
 */
export async function seedAuthDemo() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const companyByName = new Map<string, { id: string; name: string }>();
  for (const spec of COMPANIES) {
    const existing = await prisma.company.findFirst({ where: { name: spec.name } });
    const company = existing ?? (await prisma.company.create({ data: { name: spec.name } }));
    companyByName.set(spec.name, company);
  }

  for (const spec of COMPANY_USERS) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: { name: spec.name, passwordHash, role: 'COMPANY' },
      create: { email: spec.email, name: spec.name, passwordHash, role: 'COMPANY' },
    });
    for (const companyName of spec.companyNames) {
      const company = companyByName.get(companyName);
      if (!company) continue;
      await prisma.companyUser.upsert({
        where: { userId_companyId: { userId: user.id, companyId: company.id } },
        update: {},
        create: { userId: user.id, companyId: company.id },
      });
    }
  }

  for (const spec of NGO_USERS) {
    const ngo = await prisma.nGO.findFirst({ where: { name: spec.ngoName } });
    await prisma.user.upsert({
      where: { email: spec.email },
      update: { name: spec.name, passwordHash, role: 'NGO', ngoId: ngo?.id ?? null },
      create: { email: spec.email, name: spec.name, passwordHash, role: 'NGO', ngoId: ngo?.id ?? null },
    });
  }

  return {
    companies: COMPANIES.length,
    companyUsers: COMPANY_USERS.length,
    ngoUsers: NGO_USERS.length,
  };
}

const isMainModule = process.argv[1]?.endsWith('seedAuth.ts') || process.argv[1]?.endsWith('seedAuth.js');

if (isMainModule) {
  seedAuthDemo()
    .then((counts) => {
      console.log('Auth seed complete:', counts);
      return prisma.$disconnect();
    })
    .catch(async (err) => {
      console.error(err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
