import models from '../../../../models/index.js';

export const DEFAULT_COMPANY_CLASSES = [
  { name: '国内購買先', displayOrder: 1, isClient: false },
  { name: '海外購買先', displayOrder: 2, isClient: false },
  { name: '国内外注', displayOrder: 3, isClient: false },
  { name: '海外外注', displayOrder: 4, isClient: false },
  { name: '国内顧客', displayOrder: 5, isClient: true },
  { name: '海外顧客', displayOrder: 6, isClient: true },
  { name: '税金公共料金等', displayOrder: 7, isClient: false },
  { name: '自社', displayOrder: 8, isClient: false }
];

function randomChars(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function slugFromName(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'user';
  const entropy = 4 + Math.floor(Math.random() * 3);
  return `${base}-${Date.now().toString(36)}${randomChars(entropy)}`;
}

export async function seedTenantBase(user, { name, slug, isDefault }, t) {
  const tenant = await models.Tenant.create(
    { slug, name, status: 'active' },
    { transaction: t }
  );

  const membership = await models.TenantMember.create(
    {
      tenantId: tenant.id,
      userId: user.id,
      role: 'owner',
      status: 'active',
      isDefault: Boolean(isDefault),
      isOwner: true,
      administrable: true,
      accounting: true,
      fiscalBrowsing: true,
      approvable: true,
      inventoryManagement: true,
      companyManagement: true,
      personnelManagement: true,
      tenantSettings: true
    },
    { transaction: t }
  );

  const companyClasses = await Promise.all(
    DEFAULT_COMPANY_CLASSES.map((cls) =>
      models.CompanyClass.create(
        {
          tenantId: tenant.id,
          name: cls.name,
          displayOrder: cls.displayOrder,
          isClient: cls.isClient
        },
        { transaction: t }
      )
    )
  );

  const jisyaClass = companyClasses.find((c) => c.name === '自社');

  const company = await models.Company.create(
    {
      tenantId: tenant.id,
      code: 1,
      name: '本社',
      officialName: user.legalName || user.name || '本社',
      nameKana: user.legalRuby || user.name || 'ホンシャ',
      isClient: false,
      companyClassId: jisyaClass.id
    },
    { transaction: t }
  );

  return { tenant, membership, companyClasses, company };
}

export async function bootstrapTenantMember(user, { name, slug }, t) {
  const existingDefault = await models.TenantMember.findOne({
    where: { userId: user.id, isDefault: true },
    transaction: t
  });
  const isDefault = !existingDefault;
  const tenantName = name || user.legalName || user.name;
  const tenantSlug = slug || slugFromName(tenantName);

  return seedTenantBase(user, { name: tenantName, slug: tenantSlug, isDefault }, t);
}
