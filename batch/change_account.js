import models from '../models/index.js';

export const change_detail = async (list, tenantId) => {
    if (!tenantId) {
        throw new Error('change_detail: tenantId is required for multi-tenant isolation');
    }
    const details = await models.CrossSlipDetail.findAll({ where: { tenantId } });
    for (const detail of details) {
        let update = false;
        let i;
        let j;
        for ( i = 0; i < list.length; i += 1 )  {
            if  ( detail.debitAccount == list[i][0] )   break;
        }
        for ( j = 0; j < list.length; j += 1 )  {
            if  ( detail.creditAccount == list[j][0] )  break;
        }
        if  ( i < list.length ) {
            detail.debitAccount = list[i][1];
            update = true;
        }
        if  ( j < list.length ) {
            detail.creditAccount = list[j][1];
            update = true;
        }
        if  ( update )  {
            await detail.save();
        }
    }
}

export const change_account = async (list, tenantId) => {
    if (!tenantId) {
        throw new Error('change_account: tenantId is required for multi-tenant isolation');
    }
    const accounts = await models.Account.findAll({ where: { tenantId } });
    for (const account of accounts) {
        let i;
        for ( i = 0; i < list.length; i += 1 )  {
            if  ( account.accountCode == list[i][0] )   break;
        }
        if  ( i < list.length ) {
            account.accountCode = list[i][1];
            await account.save();
        }
    }
}

export const change_account_class = async (list, tenantId) => {
    if (!tenantId) {
        throw new Error('change_account_class: tenantId is required for multi-tenant isolation');
    }
    const table = await models.AccountClass.findAll({ where: { tenantId } });
    for (const item of table) {
        let code = item.field.toString() + ( '00' + item.adding.toString() ).slice(-2);
        let i;
        for ( i = 0; i < list.length ; i += 1 ) {
            if  ( list[i][0] == code )  break;
        }
        if  ( i < list.length ) {
            item.field = list[i][1];
            item.adding = list[i][2];
            await item.save();
        }
    }
}

