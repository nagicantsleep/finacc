import models from '../models/index.js';

export const append_account_class = async (args, tenantId) => {
	const resolvedTenantId = tenantId || args.tenantId;
	if (!resolvedTenantId) {
		throw new Error('append_account_class: tenantId is required for multi-tenant isolation');
	}
	let account_rec = await models.AccountClass.create({
		major: args.major,
		middle: args.middle,
		minor: args.minor,
		field: args.field,
		adding: args.adding,
		tenantId: resolvedTenantId
	});
	return account_rec;
}

