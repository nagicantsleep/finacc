<svelte:head>
  <title>{$bi('estimate_title')}</title>
  <meta http-equiv="Content-Language" content="ja" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/public/bootstrap-icons/font/bootstrap-icons.css">
  <link rel="stylesheet" href="/style/transaction.css">
</svelte:head>
  
<div class="transaction">
  <header class="estimate-header">
    <div class="info">
      <p class="strong">{transaction.companyName || ''} {$bi('company_honorific')}</p>
      <p class="strong"><span><BilingualText key="task_subject" /></span>&nbsp;{transaction.subject || ''}</p>
      <div class="salutation">
        <p><BilingualText key="estimate_intro" /></p>
      </div>
      <div class="condition">
        <p class="title"><BilingualText key="delivery_location" /></p>
        <p class="item"><BilingualText key="per_agreement" /></p>
      </div>
      <div class="condition">
        <p class="title"><BilingualText key="payment_terms" /></p>
        <p class="item">{transaction.paymentMethod || ''}</p>
      </div>
      <div class="condition">
        <p class="title"><BilingualText key="delivery_limit" /></p>
        <p class="item">{formatDate(transaction.deliveryLimit, $bi('per_agreement'))}</p>
      </div>
      <div class="condition">
        <p class="title"><BilingualText key="validity" /></p>
        <p class="item">{formatDate(transaction.expiringDate, $bi('validity_fallback'))}</p>
      </div>
    </div>
    <div class="">
      <div class="title-info">
        <div class="title-line">
          <h1><BilingualText key="estimate_form" /></h1>
          <div style="margin-left:20px;margin-top:10px;font-size:14px;">
            <span>No. {transaction.no}</span>
          </div>
        </div>
        <p>{$bi('issue_date')}:&nbsp;{formatDate(transaction.issueDate)}</p>
      </div>
      <div class="company-info">
        {#if company.logo}
        <div class="company-name-with-logo">
          <img src={company.logo} style="max-height:50px;">
          <p class="name">{company.name}</p>
        </div>
        {:else}
        <p class="name">{company.name || ''}</p>
        {/if}
        <p class="zip">〒{company.zip || ''}</p>
        <p class="address">{company.address1 || ''}</p>
        <p class="address">{company.address2 || ''}</p>
        <p class="tel">
          {#if company.tel}<span>TEL {company.tel}</span>{/if}
          {#if company.fax}<span>FAX {company.fax}</span>{/if}
        </p>
        {#if company.homepage}
        <p class="homepage">{company.homepage}</p>
        {/if}
        <p class="handler">
          {$bi('person_in_charge')}:&nbsp;
          {#if transaction.handleUser.memberships?.[0]?.tradingName}
          {transaction.handleUser.memberships[0].tradingName}
          {:else}
          {transaction.handleUser.legalName}
          {/if}
        </p>
      </div>
    </div>
  </header>
  <main>
    <div class="total-amount">
      <div class="title"><BilingualText key="total_amount" /></div>
      <div class="amount">{formatMoney(transaction.amount)}</div>
    </div>
    <Details
      {transaction}></Details>
    </main>
  </div>
<script>
import Details from '../components/details.svelte';
import {formatMoney} from '../../../../libs/utils.js';

import BilingualText from '../../components/bilingual-text.svelte';
import { bi } from '../../../javascripts/bilingual.js';

export let transaction;
export let company;
   
console.log('estimate.svelte');
    
const formatDate = (dateStr, fallback) => {
  if (!dateStr) return fallback;
  const date = new Date(dateStr);
  return `${date.getFullYear()}${$bi('year_num')}${date.getMonth() + 1}${$bi('month_num')}${date.getDate()}${$bi('day')}`;
};
      
</script>
      
    