# OneTimeMail

IoTデバイス設定代行サービス向けの一時メールアドレス発行・受信サービス

## 概要

OneTimeMailは、IoTデバイスの設定時に必要なメールアドレスを一時的に発行し、OTPを受信・参照できるサービスです。代行サービスで多数のメールアドレスを用意する必要がある場合に、簡単に一時的なメールアドレスを発行できます。

## 機能

- **一時メールアドレス生成**: 画面を開いた時点で自動生成
- **重複チェック**: DynamoDBで重複をチェック
- **メール受信・表示**: S3に保存されたメールを30秒間隔でチェック
- **メール一覧・詳細表示**: 受信したメールの一覧と詳細を表示
- **コピー機能**: 生成されたメールアドレスをクリップボードにコピー

## 技術スタック

- **フレームワーク**: Next.js 14 + Amplify Gen2
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: DynamoDB（Amplify data）
- **ストレージ**: S3（Amplify Storage）
- **バックエンド**: Next.js Server Actions
- **認証**: 不要（匿名利用）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Amplifyの設定

```bash
# Amplifyの初期化
npx ampx sandbox

# または本番環境にデプロイ
npx ampx deploy
```

### 3. 環境変数の設定

`amplify_outputs.json`ファイルが正しく設定されていることを確認してください。

### 4. 開発サーバーの起動

```bash
npm run dev
```

## プロジェクト構造

```
src/
├── app/
│   ├── actions/
│   │   └── email-actions.ts      # Server Actions
│   ├── globals.css               # グローバルスタイル
│   ├── layout.tsx                # レイアウト
│   └── page.tsx                  # メインページ
├── components/
│   ├── CopyButton.tsx            # コピーボタン
│   ├── EmailGenerator.tsx        # メールアドレス生成
│   ├── EmailList.tsx             # メール一覧
│   ├── EmailViewer.tsx           # メール詳細
│   ├── ErrorMessage.tsx          # エラーメッセージ
│   └── LoadingSpinner.tsx        # ローディングスピナー
├── hooks/
│   ├── useEmailAddress.ts        # メールアドレス管理
│   ├── useEmailList.ts           # メール一覧管理
│   └── useS3Checker.ts           # S3メールチェック
├── types/
│   └── index.ts                  # 型定義
└── utils/
    └── amplify-utils.ts          # Amplify設定
```

## 使用方法

1. アプリケーションを開く
2. 自動生成されたメールアドレスをコピー
3. IoTデバイスの設定でメールアドレスを使用
4. 受信したメールが30秒間隔で自動更新される
5. メールをタップして詳細を確認

## メールアドレス形式

- **形式**: `{西暦右2桁}{月}{日}{連番3桁}@otm.mec.mejsh.com`
- **例**: `250908001@otm.mec.mejsh.com`

## 注意事項

- メールアドレスは画面を開いている間のみ有効
- 画面を閉じると1日後に削除される
- スマートフォンでの利用を想定
- 認証は不要（匿名利用）

## 開発

### ビルド

```bash
npm run build
```

### 型チェック

```bash
npm run type-check
```

### リント

```bash
npm run lint
```

## ライセンス

MIT License
