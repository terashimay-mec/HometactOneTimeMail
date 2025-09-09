# OneTimeMail Amplifyデータスキーマ設計書

## 1. 概要

### 1.1 目的
OneTimeMailプロジェクトで使用するAmplify dataのスキーマ設計を定義する。

### 1.2 技術スタック
- **Amplify Gen2**: 最新バージョン
- **データベース**: DynamoDB
- **認証**: 不要（匿名利用）

## 2. データモデル設計

### 2.1 EmailAddress（メールアドレス管理）

#### 2.1.1 概要
一時メールアドレスの生成・管理を行うテーブル

#### 2.1.2 スキーマ定義
```typescript
EmailAddress: a
  .model({
    id: a.id().required(),                    // プライマリキー
    address: a.string().required(),           // メールアドレス（ユニーク）
    createdAt: a.timestamp().required(),      // 作成日時
    isActive: a.boolean().required(),         // アクティブ状態
  })
  .secondaryIndexes((index) => [
    index("address"),                         // ユニークインデックス
  ])
  .authorization((allow) => [
    allow.guest(),                            // 匿名アクセス許可
  ])
```

#### 2.1.3 フィールド詳細
| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| id | ID | ✓ | プライマリキー（UUID） |
| address | String | ✓ | メールアドレス（例：250908001@otm.mec.mejsh.com） |
| createdAt | AWSDateTime | ✓ | 作成日時 |
| isActive | Boolean | ✓ | アクティブ状態（true/false） |

#### 2.1.4 インデックス設計
- **Primary Key**: id
- **GSI1**: address（ユニーク）

## 3. GraphQLスキーマ定義

### 3.1 型定義
```graphql
type EmailAddress {
  id: ID!
  address: String!
  createdAt: AWSDateTime!
  isActive: Boolean!
}

input CreateEmailAddressInput {
  address: String!
}

input CheckEmailAddressInput {
  address: String!
}
```

### 3.2 クエリ（Query）

#### 3.2.1 getEmailAddress
```graphql
getEmailAddress(address: String!): EmailAddress
```

**説明**: メールアドレスに基づいてEmailAddressを取得

**引数**:
- `address`: メールアドレス（必須）

**戻り値**: EmailAddress型

**使用例**:
```graphql
query GetEmailAddress($address: String!) {
  getEmailAddress(address: $address) {
    id
    address
    createdAt
    isActive
  }
}
```

### 3.3 ミューテーション（Mutation）

#### 3.3.1 createEmailAddress
```graphql
createEmailAddress(input: CreateEmailAddressInput!): EmailAddress
```

**説明**: 新しいメールアドレスを生成

**引数**:
- `input`: CreateEmailAddressInput型（必須）

**戻り値**: EmailAddress型

**使用例**:
```graphql
mutation CreateEmailAddress($input: CreateEmailAddressInput!) {
  createEmailAddress(input: $input) {
    id
    address
    createdAt
    isActive
  }
}
```

## 4. カスタムハンドラー実装

### 4.1 getEmailAddressHandler.js
```javascript
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { address } = ctx.arguments;
  
  return {
    operation: 'Query',
    query: {
      expression: 'address = :address',
      expressionValues: {
        ':address': util.dynamodb.toDynamoDB(address)
      }
    },
    index: 'address-index'
  };
}

export function response(ctx) {
  if (ctx.result.items && ctx.result.items.length > 0) {
    return ctx.result.items[0];
  }
  return null;
}
```

## 5. Server Actions実装

### 5.1 createEmailAddress Server Action
```typescript
// app/actions/email-actions.ts
"use server";

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export async function createEmailAddress(): Promise<{
  success: boolean;
  data?: { id: string; address: string };
  error?: string;
}> {
  try {
    // ランダムメールアドレス生成
    const address = generateEmailAddress();
    
    // 重複チェック
    const exists = await checkEmailAddressExists(address);
    if (exists) {
      return {
        success: false,
        error: 'Email address already exists'
      };
    }

    // メールアドレス作成
    const { data, errors } = await client.models.EmailAddress.create({
      address,
      createdAt: Date.now(),
      isActive: true
    });

    if (errors) {
      return {
        success: false,
        error: 'Failed to create email address'
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        address: data.address
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}

async function checkEmailAddressExists(address: string): Promise<boolean> {
  try {
    const { data } = await client.models.EmailAddress.list({
      filter: {
        address: { eq: address }
      }
    });
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking email address:', error);
    return false;
  }
}

function generateEmailAddress(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${year}${month}${day}${sequence}@otm.mec.mejsh.com`;
}
```

## 6. メールアドレス生成ロジック

### 6.1 生成関数（Server Action内で使用）
```typescript
function generateEmailAddress(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // 西暦右2桁
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月
  const day = now.getDate().toString().padStart(2, '0'); // 日
  
  // 連番3桁（000-999）
  const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${year}${month}${day}${sequence}@otm.mec.mejsh.com`;
}
```

### 6.2 重複チェック関数（Server Action内で使用）
```typescript
async function checkEmailAddressExists(address: string): Promise<boolean> {
  try {
    const { data } = await client.models.EmailAddress.list({
      filter: {
        address: { eq: address }
      }
    });
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking email address:', error);
    return false;
  }
}
```

### 6.3 メールアドレス生成（重複チェック付き）
```typescript
export async function generateUniqueEmailAddress(): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const emailAddress = generateEmailAddress();
    const exists = await checkEmailAddressExists(emailAddress);
    
    if (!exists) {
      return {
        success: true,
        data: emailAddress
      };
    }
    
    attempts++;
  }
  
  return {
    success: false,
    error: 'Failed to generate unique email address after maximum attempts'
  };
}
```

## 7. 環境変数設定

### 7.1 必要な環境変数
```bash
# メールドメイン
EMAIL_DOMAIN=otm.mec.mejsh.com

# DynamoDBテーブル名
EMAIL_ADDRESS_TABLE=EmailAddress-xxxxx

# AWS設定
AWS_REGION=us-east-1
```

### 7.2 Amplify設定
```typescript
// amplify/backend.ts
import { defineBackend } from "@aws-amplify/backend";
import { data } from "./data/resource";

const backend = defineBackend({
  data,
});

// 環境変数設定
backend.data.resources.cfnResources.cfnGraphqlApi.addPropertyOverride(
  "EnvironmentVariables",
  {
    EMAIL_DOMAIN: process.env.EMAIL_DOMAIN || "otm.mec.mejsh.com",
    AWS_REGION: process.env.AWS_REGION || "us-east-1"
  }
);
```

## 8. セキュリティ設定

### 8.1 認証設定
```typescript
// 匿名アクセス許可
.authorization((allow) => [
  allow.guest(),
])
```

### 8.2 データ保護
- **暗号化**: DynamoDBの暗号化機能を使用
- **アクセス制御**: IAMロールによる適切な権限設定
- **監査ログ**: CloudTrailでアクセスログを記録

## 9. パフォーマンス最適化

### 9.1 インデックス設計
- **適切なインデックス**: クエリパターンに応じたインデックス設計
- **ユニーク制約**: addressフィールドのユニーク制約

### 9.2 クエリ最適化
- **フィルタリング**: 必要なデータのみ取得
- **エラーハンドリング**: 適切なエラー処理

## 10. テスト設計

### 10.1 単体テスト
```typescript
describe('EmailAddress API', () => {
  test('should create email address', async () => {
    const address = '250908001@otm.mec.mejsh.com';
    const result = await createEmailAddress({ address });
    expect(result.address).toBe(address);
  });
  
  test('should handle duplicate email address', async () => {
    const address = '250908001@otm.mec.mejsh.com';
    await createEmailAddress({ address });
    await expect(createEmailAddress({ address })).rejects.toThrow();
  });
});
```

### 10.2 統合テスト
```typescript
describe('EmailAddress Integration', () => {
  test('should generate unique email address', async () => {
    const address = await generateUniqueEmailAddress();
    expect(address).toMatch(/^\d{6}\d{3}@otm\.mec\.mejsh\.com$/);
  });
});
```

---

**作成日**: 2024年12月19日  
**バージョン**: 1.0  
**作成者**: AI Assistant
