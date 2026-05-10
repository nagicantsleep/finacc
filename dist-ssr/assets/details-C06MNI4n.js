import { create_ssr_component, each, add_attribute, escape } from "svelte/internal";
import { f as formatMoney } from "./utils-CnigPmtq.js";
const Details = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { transaction } = $$props;
  const formatNumber = (num) => {
    return num.toLocaleString();
  };
  if ($$props.transaction === void 0 && $$bindings.transaction && transaction !== void 0) $$bindings.transaction(transaction);
  return `<table class="table"><thead data-svelte-h="svelte-gvv64a"><tr><th style="width:250px;">品名・規格</th> <th style="width:100px;">単価</th> <th style="width:50px;">数量</th> <th style="width:50px;">単位</th> <th style="width:100px;">金額<br>
        消費税</th> <th>備考</th></tr></thead> <tbody>${each(transaction.lines, (line) => {
    var _a;
    return `<tr><td class="item"${add_attribute("colspan", line.itemId === 0 ? 4 : 1, 0)}>${line.itemId !== 0 ? `<!-- HTML_TAG_START -->${line.itemName || "&nbsp;"}<!-- HTML_TAG_END --><br> <!-- HTML_TAG_START -->${line.itemSpec || "&nbsp;"}<!-- HTML_TAG_END -->` : `※小計※`}</td> ${line.itemId !== 0 ? `<td class="number">@${escape(formatNumber(line.unitPrice))}</td> <td class="number">${escape(formatNumber(line.itemNumber))}</td> <td>${escape(line.unit || " ")}</td>` : ``} <td class="number">${escape(formatMoney(line.amount))} ${((_a = line.taxRule) == null ? void 0 : _a.taxClass) === 1 ? `(${escape(formatMoney(line.tax))})` : `${escape(formatMoney(line.tax))}`}</td> <td class="description">${escape(line.description)}</td> </tr>`;
  })}</tbody> <tfoot><tr><td colspan="2"${add_attribute("rowspan", transaction.taxClass !== 0 ? 3 : 2, 0)}></td> <td colspan="2" class="sums" data-svelte-h="svelte-3q9m09">小   計</td> <td class="number">${escape(formatMoney(transaction.amount))}</td> <td${add_attribute("rowspan", transaction.taxClass !== 0 ? 3 : 2, 0)}></td></tr> ${transaction.taxClass !== 0 ? `<tr><td colspan="2" class="sums" data-svelte-h="svelte-x5jzy3">消費税</td> <td class="number">${escape(formatMoney(transaction.tax))}</td></tr>` : ``} <tr><td colspan="2" class="sums" data-svelte-h="svelte-1norif9"><strong>合   計</strong></td> <td class="number"><strong>${escape(formatMoney(transaction.amount))}</strong></td></tr></tfoot> </table>`;
});
export {
  Details as D
};
