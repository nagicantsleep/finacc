import { create_ssr_component, escape, add_attribute, validate_component } from "svelte/internal";
import { D as Details } from "./assets/details-C06MNI4n.js";
import { f as formatMoney } from "./assets/utils-CnigPmtq.js";
import "@formkit/tempo";
import "axios";
const Estimate = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  var _a, _b;
  let { transaction } = $$props;
  let { company } = $$props;
  console.log("estimate.svelte");
  const formatDate = (dateStr, fallback) => {
    if (!dateStr) return fallback;
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };
  if ($$props.transaction === void 0 && $$bindings.transaction && transaction !== void 0) $$bindings.transaction(transaction);
  if ($$props.company === void 0 && $$bindings.company && company !== void 0) $$bindings.company(company);
  return `${$$result.head += `<!-- HEAD_svelte-o8bx9w_START -->${$$result.title = `<title>見積書::Hieronymus</title>`, ""}<meta http-equiv="Content-Language" content="ja"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="/public/bootstrap-icons/font/bootstrap-icons.css"><link rel="stylesheet" href="/style/transaction.css"><!-- HEAD_svelte-o8bx9w_END -->`, ""} <div class="transaction"><header class="estimate-header"><div class="info"><p class="strong">${escape(transaction.companyName || "")} 御中</p> <p class="strong"><span data-svelte-h="svelte-i9zerr">件名</span> ${escape(transaction.subject || "")}</p> <div class="salutation" data-svelte-h="svelte-16p9b6p"><p>下記の通り御見積申し上げます。</p></div> <div class="condition" data-svelte-h="svelte-kjt7kp"><p class="title">納入場所</p> <p class="item">お打ち合わせ通り</p></div> <div class="condition"><p class="title" data-svelte-h="svelte-dxgehe">支払条件</p> <p class="item">${escape(transaction.paymentMethod || "")}</p></div> <div class="condition"><p class="title" data-svelte-h="svelte-wt64gz">納期</p> <p class="item">${escape(formatDate(transaction.deliveryLimit, "お打ち合わせ通り"))}</p></div> <div class="condition"><p class="title" data-svelte-h="svelte-10f6jdg">有効期限</p> <p class="item">${escape(formatDate(transaction.expiringDate, "御見積後１ヶ月以内"))}</p></div></div> <div class=""><div class="title-info"><div class="title-line"><h1 data-svelte-h="svelte-1fxlgph">御見積書</h1> <div style="margin-left:20px;margin-top:10px;font-size:14px;"><span>No. ${escape(transaction.no)}</span></div></div> <p>発行日: ${escape(formatDate(transaction.issueDate))}</p></div> <div class="company-info">${company.logo ? `<div class="company-name-with-logo"><img${add_attribute("src", company.logo, 0)} style="max-height:50px;"> <p class="name">${escape(company.name)}</p></div>` : `<p class="name">${escape(company.name || "")}</p>`} <p class="zip">〒${escape(company.zip || "")}</p> <p class="address">${escape(company.address1 || "")}</p> <p class="address">${escape(company.address2 || "")}</p> <p class="tel">${company.tel ? `<span>TEL ${escape(company.tel)}</span>` : ``} ${company.fax ? `<span>FAX ${escape(company.fax)}</span>` : ``}</p> ${company.homepage ? `<p class="homepage">${escape(company.homepage)}</p>` : ``} <p class="handler">担当: 
          ${((_b = (_a = transaction.handleUser.memberships) == null ? void 0 : _a[0]) == null ? void 0 : _b.tradingName) ? `${escape(transaction.handleUser.memberships[0].tradingName)}` : `${escape(transaction.handleUser.legalName)}`}</p></div></div></header> <main><div class="total-amount"><div class="title" data-svelte-h="svelte-a27zxh">合計金額</div> <div class="amount">${escape(formatMoney(transaction.amount))}</div></div> ${validate_component(Details, "Details").$$render($$result, { transaction }, {}, {})}</main> </div>`;
});
export {
  Estimate as default
};
