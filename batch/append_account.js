import models from '../models/index.js';

export const append_accounts = async (account, tenantId) => {
	const resolvedTenantId = tenantId || account.tenantId;
	if (!resolvedTenantId) {
		throw new Error('append_accounts: tenantId is required for multi-tenant isolation');
	}
	let code_len = account.code.length;
	let field = parseInt(account.code.substring(code_len - 8, code_len - 6));
	let adding = parseInt(account.code.substring(code_len - 5, code_len - 4));

	let account_class = await models.AccountClass.findOne({
		where: {
			tenantId: resolvedTenantId,
			field: field,
			adding: adding
		}
	});
	if (!account_class) {
		throw new Error(`AccountClass not found for field=${field}, adding=${adding}, tenantId=${resolvedTenantId}`);
	}
	let account_rec = await models.Account.create({
		name: account.name,
		key: account.key,
		accountClassId: account_class.id,
		accountCode: account.code,
		taxClass: account.tax_class,
		subAccountCount: 0,
		tenantId: resolvedTenantId
	});
	return account_rec;
}

