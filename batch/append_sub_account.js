import models from '../models/index.js';

export const append_sub_accounts = async (account, tenantId) => {
	const resolvedTenantId = tenantId || account.tenantId;
	if (!resolvedTenantId) {
		throw new Error('append_sub_accounts: tenantId is required for multi-tenant isolation');
	}

	let account_rec = await models.Account.findOne({
		where: {
			tenantId: resolvedTenantId,
			accountCode: account.code
		}
	});
	if (!account_rec) {
		throw new Error(`Account not found for code=${account.code}, tenantId=${resolvedTenantId}`);
	}

	account_rec.subAccountCount += 1;
	await account_rec.save();

	let sub_account_rec = await models.SubAccount.create({
		name: account.name,
		key: account.key,
		accountId: account_rec.id,
		subAccountCode: account_rec.subAccountCount,
		taxClass: account.tax_class,
		tenantId: resolvedTenantId
	});

	await models.SubAccountRemaining.create({
		subAccountId: sub_account_rec.id,
		term: account.term,
		debit: 0,
		credit: account.balance || 0,
		balance: account.balance || 0,
		tenantId: resolvedTenantId
	});

	return sub_account_rec;
}

