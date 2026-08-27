import axios from 'axios';
import {isNode, isBrowser} from './utils.js';

export default async (tenantId) => {
  let company;
  if  ( isBrowser() ) {
    const result = await axios.get('/api/company?ownClass=true');
    if	( result.data.companies.length > 0 )	{
      company = result.data.companies[0];
    }
  } else if  ( isNode() )  {
    const { default: models } = await import('../models/index.js');
    const ownCompanyClass = await models.CompanyClass.findOne({
      where: {
        tenantId,
        name: '自社'
      }
    });
    if (!ownCompanyClass) {
      return null;
    }
    company = await models.Company.findOne({
      where: {
        tenantId,
        companyClassId: ownCompanyClass.id
      },
      include: [
        {
          model: models.CompanyClass,
          as: 'companyClass'
        }
      ]
    });
  }
  return company;
}

