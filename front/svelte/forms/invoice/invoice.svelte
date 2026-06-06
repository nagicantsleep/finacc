<svelte:head>
  <title>{$bi('invoice_title')}</title>
  <meta http-equiv="Content-Language" content="ja" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/public/bootstrap-icons/font/bootstrap-icons.css">
  <link rel="stylesheet" href="/style/paperA4.css">
  <link rel="stylesheet" href="/style/transaction.css">
</svelte:head>

<div class="transaction">
  <header class="transaction-header">
    <div class="window-recipient-info">
      <p>〒{transaction.zip || ''}</p>
      <p>{transaction.address1 || ''}</p>
      <p>{transaction.address2 || ''}</p>
      <p>{transaction.companyName || ''} {$bi('company_honorific')}</p>
    </div>
    <div class="">
      <div class="title-info">
        <div class="title-line">
          <h1><BilingualText key="invoice_form" /></h1>
          <div style="margin-left:20px;margin-top:10px;font-size:14px;">
            <span>No. {transaction.no}</span>
          </div>
        </div>
        <p>
          {$bi('issue_date')}:&nbsp;
          {date.getFullYear()}{$bi('year_num')}
          {date.getMonth() + 1}{$bi('month_num')}
          {date.getDate()}{$bi('day')}
        </p>
      </div>
      <div class="company-info">
        {#if ( company.logoURL )}
        <div class="company-name-with-logo">
          <img src="{company.logoURL}" style="max-height:50px;">
          <p class="name">{company.name}</p>
        </div>
        {:else}
        <p class="name">{company.name || ''}</p>
        {/if}
        <p class="zip">〒{company.zip || ''}</p>
        <p class="address">{company.address1 || ''}</p>
        <p class="address">{company.address2 || '' }</p>
        <p class="tel">
        {#if ( company.tel ) }
        <span>TEL {company.tel}</span>
        {/if}
        {#if ( company.fax ) }
        <span>FAX {company.fax}</span>
        {/if}
        </p>
        {#if ( company.url ) }
        <p class="homepage">{company.url}</p>
        {/if}
        <p class="handler">
          {$bi('person_in_charge')}: &nbsp;
          {#if transaction.handleUser.memberships && transaction.handleUser.memberships[0]?.tradingName}
          {transaction.handleUser.memberships[0].tradingName}
          {:else}
          {transaction.handleUser.legalName}
          {/if}
        </p>
        <p class="account">
          [{$bi('bank_transfer_destination')}]
          {company.bankName}
          {company.bankBranchName}
          {BANK_ACCOUNT_TYPE.find((bank) => bank[0] === company.accountType)}
          {company.accountNo}
        </p>
      </div>
    </div>
  </header>
	<main>
  	<div class="salutation">
    	<p><BilingualText key="thank_you" /></p>
    	<p><BilingualText key="invoice_intro" /></p>
  	</div>
  	<div class="total-amount">
	    <div class="title"><BilingualText key="total_amount" /></div>
	    <div class="amount">
        {formatMoney(transaction.amount)}
	    </div>
	  </div>
		<Details
  	  {transaction}></Details>
	</main>
</div>
<script>
import Details from '../components/details.svelte';
import {BANK_ACCOUNT_TYPE, formatMoney} from '../../../../libs/utils.js';

import BilingualText from '../../components/bilingual-text.svelte';
import { bi } from '../../../javascripts/bilingual.js';
export let transaction;
export let company;
   
console.log('invoice.svelte');

let date = new Date(transaction.issueDate);

</script>
      
    