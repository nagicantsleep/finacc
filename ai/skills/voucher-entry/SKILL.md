---
name: voucher-entry
description: 証憑（画像/PDF）をOCRして証憑登録し、過去パターンに基づいて自動仕訳（未承認伝票）を作成する経理業務スキル
---

# Skill: 証憑登録と自動仕訳

受け取った請求書・領収書などの証憑（画像/PDF）からデータを読み取り、Fin-acc に証憑を登録した上で、過去の仕訳パターンに照合して未承認の仕訳伝票を作成します。

## 前提

- `describe_image`（OCR / Visionツール）: 画像/PDFのOCR
- `voucher-mcp`: 証憑登録・仕訳伝票の作成・参照
- `knowledge/wiki/accounting/仕訳パターン.md`: 学習済みの仕訳パターン

## 手順

### 1. OCRで証憑を読み取る

OCRツールを用いて、以下をJSON形式で抽出します:

```json
{
  "company": "株式会社〇〇",
  "issueDate": "2026-03-25",
  "amount": 10000,
  "tax": 1000,
  "taxRate": 10,
  "invoiceNo": "T1234567890123",
  "description": "サーバー利用料"
}
```
※ 不明な項目は `null`。金額の桁や会社名の誤読がないか確認します。

### 2. 取引先と伝票種別を特定する

- `get_companies` で会社名を照合して `companyId` を確定（部分一致可、一致しない場合は候補を複数挙げて人間に確認）。
- `get_voucher_classes` で伝票種別（請求書/領収書/仕入等）を選んで `voucherClassId` を確定。

### 3. 証憑を登録する

`create_voucher_with_file` で証憑登録＋ファイル添付を行います:

```json
{
  "voucherClassId": 1,
  "issueDate": "2026-03-25",
  "companyId": 12,
  "amount": 10000,
  "taxRuleId": 7,
  "filePath": "/path/to/invoice.pdf",
  "description": "サーバー利用料",
  "invoiceNo": "T1234567890123"
}
```

- `taxRuleId` は `get_tax_rules` で取得（省略時は税額0）。
- 登録結果の `voucher.id` を保持します。

### 4. 仕訳を決定する（自動仕訳）

`knowledge/wiki/accounting/仕訳パターン.md` を読み、証憑の「伝票種別 × 取引先」に合致するパターンを探します。

- **合致するパターンがある場合**: 借方/貸方科目をそのパターンに従って決定し、`create_cross_slip` で作成（未承認状態で保存）。
  - 証憑の方向: 伝票種別が `send=true` なら貸方側、`send=false` なら借方側に証憑IDを紐付けます。
  - 明細行: `debitAccount/debitSubAccount/debitAmount` / `creditAccount/creditSubAccount/creditAmount`、証憑IDは `debitVoucherId` または `creditVoucherId`。
- **パターンにない新規ケース**: 自動仕訳は行わず、借方/貸方の候補を人間に提示して判断を仰ぎます。
- 参考: 過去の類似仕訳は `get_journal` で確認可能です。

### 5. 承認待ちを確認・通知する

`list_cross_slips`（未承認一覧）で作成した伝票が承認待ちに入っていることを確認し、担当者に通知します。

## 注意事項

- 金額・日付・会社名の誤読は必ず人間が承認時に確認できるように、作成した伝票の摘要（`application1`）に「OCR: <取引内容>」を残します。
- 自動仕訳が誤っていた場合は、その結果を `journal-learning` でパターンに反映します。
