# voucher-mcp — Fin-acc / Hieronymus 伝票入力 MCP Server

Fin-acc (Hieronymus) の会計データを操作するための MCP（Model Context Protocol）サーバです。
Claude Desktop, OpenCode, Antigravity, Cursor 等の AI エージェントから、HTTP API 経由で動作中の Fin-acc インスタンスに接続して伝票の作成・参照・税額プレビューを行います。

## 提供するツール

### 参照系（Read-only）
- `get_accounts`: 勘定科目・補助科目の一覧取得（税区分付き）
- `get_companies`: 取引先一覧の取得
- `get_voucher_classes`: 伝票種別（請求書/領収書/仕入等）一覧の取得
- `get_tax_rules`: 指定日時点で有効な消費税率ルールの取得
- `get_fiscal_year`: 指定年月の会計年度情報（term, 税込フラグ等）の取得
- `get_journal`: 仕訳日記帳（全仕訳伝票）の取得（パターン学習用）
- `get_cross_slip`: 指定年/月/号の仕訳伝票の取得
- `list_cross_slips`: 仕訳伝票一覧（未承認・承認待ち）の取得
- `list_vouchers`: 証憑一覧の取得（期間・取引先・金額等で絞り込み可）
- `compute_slip_taxes`: 仕訳明細の税額計算と仮払/仮受消費税行生成のプレビュー

### 更新系（Write）
- `create_cross_slip`: 仕訳伝票の作成（未承認状態で作成）
- `update_cross_slip`: 未承認伝票の更新
- `approve_cross_slip`: 仕訳伝票の承認（承認権限が必要）
- `disapprove_cross_slip`: 承認済み伝票の承認解除
- `delete_cross_slip`: 未承認伝票の削除
- `create_voucher`: 証憑（電子帳票データ）の登録
- `create_voucher_with_file`: 証憑登録＋画像/PDFファイルの添付
- `update_voucher`: 証憑の更新
- `delete_voucher`: 証憑の削除

## 環境変数

| 変数名 | 説明 | 既定値 |
|---|---|---|
| `FINACC_BASE_URL` (または `HIERONYMUS_BASE_URL`) | 接続先 Fin-acc サーバー URL | `http://localhost:3010` |
| `FINACC_LOGIN_USER` (または `HIERONYMUS_LOGIN_USER`) | ログインユーザー名 | (必須) |
| `FINACC_LOGIN_PASSWORD` (または `HIERONYMUS_LOGIN_PASSWORD`) | ログインパスワード | (必須) |
| `FINACC_TENANT_ID` (または `HIERONYMUS_TENANT_ID`) | 対象組織（Tenant）の ID | (任意 / 複数テナント所属時に指定) |
| `FINACC_READONLY` (または `HIERONYMUS_READONLY`) | `1` の場合、書き込みツールを無効化 | `0` |

## 使い方

```bash
# 依存パッケージのインストール
cd ai/mcp/voucher-mcp
npm install

# 動作確認（読み取り）
FINACC_LOGIN_USER=creator FINACC_LOGIN_PASSWORD=secret node test-client.mjs
```
