import { create_ssr_component, escape, add_attribute, validate_component } from "svelte/internal";
import { D as Details } from "./assets/details-C06MNI4n.js";
import { B as BANK_ACCOUNT_TYPE, f as formatMoney } from "./assets/utils-CnigPmtq.js";
import "@formkit/tempo";
import "axios";
const Invoice = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  var _a;
  let { transaction } = $$props;
  let { company } = $$props;
  console.log("invoice.svelte");
  let date = new Date(transaction.issueDate);
  if ($$props.transaction === void 0 && $$bindings.transaction && transaction !== void 0) $$bindings.transaction(transaction);
  if ($$props.company === void 0 && $$bindings.company && company !== void 0) $$bindings.company(company);
  return `${$$result.head += `<!-- HEAD_svelte-7vlyak_START -->${$$result.title = `<title>請求書::Hieronymus</title>`, ""}<meta http-equiv="Content-Language" content="ja"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="/public/bootstrap-icons/font/bootstrap-icons.css"><link rel="stylesheet" href="/style/paperA4.css"><link rel="stylesheet" href="/style/transaction.css"><!-- HEAD_svelte-7vlyak_END -->`, ""} <div class="transaction"><header class="transaction-header"><div class="window-recipient-info"><p>〒${escape(transaction.zip || "")}</p> <p>${escape(transaction.address1 || "")}</p> <p>${escape(transaction.address2 || "")}</p> <p>${escape(transaction.companyName || "")} 御中</p></div> <div class=""><div class="title-info"><div class="title-line"><h1 data-svelte-h="svelte-ao9q93">請 求 書</h1> <div style="margin-left:20px;margin-top:10px;font-size:14px;"><span>No. ${escape(transaction.no)}</span></div></div> <p>発行日: 
          ${escape(date.getFullYear())}年
          ${escape(date.getMonth() + 1)}月
          ${escape(date.getDate())}日</p></div> <div class="company-info">${company.logoURL ? `<div class="company-name-with-logo"><img${add_attribute("src", company.logoURL, 0)} style="max-height:50px;"> <p class="name">${escape(company.name)}</p></div>` : `<p class="name">${escape(company.name || "")}</p>`} <p class="zip">〒${escape(company.zip || "")}</p> <p class="address">${escape(company.address1 || "")}</p> <p class="address">${escape(company.address2 || "")}</p> <p class="tel">${company.tel ? `<span>TEL ${escape(company.tel)}</span>` : ``} ${company.fax ? `<span>FAX ${escape(company.fax)}</span>` : ``}</p> ${company.url ? `<p class="homepage">${escape(company.url)}</p>` : ``} <p class="handler">担当:  
          ${transaction.handleUser.memberships && ((_a = transaction.handleUser.memberships[0]) == null ? void 0 : _a.tradingName) ? `${escape(transaction.handleUser.memberships[0].tradingName)}` : `${escape(transaction.handleUser.legalName)}`}</p> <p class="account">[振込先]
          ${escape(company.bankName)} ${escape(company.bankBranchName)} ${escape(BANK_ACCOUNT_TYPE.find((bank) => bank[0] === company.accountType))} ${escape(company.accountNo)}</p></div></div></header> <main><div class="salutation" data-svelte-h="svelte-1o6qz0f"><p>毎度ありがとうございます。</p> <p>下記のとおり御請求申し上げます。</p></div> <div class="total-amount"><div class="title" data-svelte-h="svelte-1j9zlkh">合計金額</div> <div class="amount">${escape(formatMoney(transaction.amount))}</div></div> ${validate_component(Details, "Details").$$render($$result, { transaction }, {}, {})}</main> </div>`;
});
export {
  Invoice as default
};
