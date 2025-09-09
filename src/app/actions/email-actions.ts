"use server";

import { Amplify } from 'aws-amplify';
import { list, getUrl } from 'aws-amplify/storage';
import { Email, ApiResponse, EmailAddress } from '@/types';
import { generatePublicClient } from '@/utils/amplify-utils';
import outputs from '../../../amplify_outputs.json';
import { simpleParser } from 'mailparser';

// Amplifyの設定
Amplify.configure(outputs);

// 匿名アクセス用のクライアントを生成
const client = generatePublicClient();

export async function createEmailAddress(): Promise<ApiResponse<EmailAddress>> {
  try {
    console.log('Starting createEmailAddress...');
    
    // ランダムメールアドレス生成
    const address = generateEmailAddress();
    console.log('Generated address:', address);
    
    // 重複チェック
    console.log('Checking for duplicates...');
    const exists = await checkEmailAddressExists(address);
    if (exists) {
      console.log('Address already exists');
      return {
        success: false,
        error: 'Email address already exists'
      };
    }

    // メールアドレス作成
    console.log('Creating email address in database...');
    const { data, errors } = await client.models.EmailAddress.create({
      address,
      createdAt: new Date().toISOString(),
      isActive: true
    });

    if (errors) {
      console.error('Database errors:', errors);
      return {
        success: false,
        error: `Failed to create email address: ${JSON.stringify(errors)}`
      };
    }

    console.log('Successfully created email address:', data);
    return {
      success: true,
      data: {
        id: data!.id,
        address: data!.address,
        createdAt: data!.createdAt,
        isActive: data!.isActive
      }
    };
  } catch (error) {
    console.error('Error creating email address:', error);
    return {
      success: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}


// ヘルパー関数
async function checkEmailAddressExists(address: string): Promise<boolean> {
  try {
    console.log('Checking if address exists:', address);
    const { data, errors } = await client.models.EmailAddress.list({
      filter: {
        address: { eq: address }
      }
    });
    
    if (errors) {
      console.error('Error in list query:', errors);
      return false;
    }
    
    const exists = data && data.length > 0;
    console.log('Address exists:', exists);
    return exists;
  } catch (error) {
    console.error('Error checking email address:', error);
    return false;
  }
}

export async function checkS3Emails(emailAddress: string): Promise<Email[]> {
  try {
    // S3バケットからメールファイルをリスト
    const listResult = await list({
      path: 'email/',
      options: {
        listAll: true,
      }
    });
    
    const emails: Email[] = [];
    
    if (listResult.items) {
      for (const item of listResult.items) {
        if (item.path) {
          try {
            // メールファイルのURLを取得
            const url = await getUrl({
              path: item.path
            });
            
            // メールファイルを取得
            const response = await fetch(url.url);
            const emailContent = await response.text();
            if (isEmailForAddress(emailContent, emailAddress)) {
              const email = await parseEmailContent(emailContent, item.path);
              emails.push(email);
            }
          } catch (error) {
            console.error(`Error processing email file ${item.path}:`, error);
          }
        }
      }
    }
    
    return emails.sort((a, b) => 
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  } catch (error) {
    console.error('Error checking S3 emails:', error);
    return [];
  }
}

// ヘルパー関数
function isEmailForAddress(emailContent: string, emailAddress: string): boolean {
  return emailContent.includes(`To: ${emailAddress}`) || 
         emailContent.includes(`<${emailAddress}>`);
}

async function parseEmailContent(emailContent: string, s3Key: string): Promise<Email> {
  try {
    // mailparserを使用してメールを解析
    const parsed = await simpleParser(emailContent);
    
    // 送信者を抽出
    const from = parsed.from?.text || parsed.from?.value?.[0]?.address || 'Unknown';
    
    // 件名を抽出（mailparserが自動的にデコード）
    const subject = parsed.subject || undefined;
    
    // 受信日時を抽出
    const receivedAt = parsed.date ? parsed.date.toISOString() : new Date().toISOString();
    
    // 本文を抽出
    let body = '';
    if (parsed.text) {
      body = parsed.text;
    } else if (parsed.html) {
      // HTMLメールの場合はテキストに変換（簡易版）
      body = parsed.html.replace(/<[^>]*>/g, '').trim();
    }
    
    return {
      id: generateId(),
      from: from,
      subject: subject,
      body: body,
      receivedAt: receivedAt,
      s3Key: s3Key
    };
  } catch (error) {
    console.error('Failed to parse email with mailparser:', error);
    
    // フォールバック: 元の手動解析を使用
    return parseEmailContentFallback(emailContent, s3Key);
  }
}

function parseEmailContentFallback(emailContent: string, s3Key: string): Email {
  // 送信者を抽出（最初のFrom:行を取得）
  const fromMatch = emailContent.match(/^From:\s*(.+)$/m);
  const from = fromMatch ? fromMatch[1].trim() : 'Unknown';
  
  // 件名を抽出・デコード（複数行対応）
  const subjectMatch = emailContent.match(/^Subject:\s*([\s\S]*?)(?=\r?\n[A-Za-z-]+:\s|\r?\n\r?\n|$)/m);
  let subject = subjectMatch ? subjectMatch[1] : undefined;
  
  // 複数行のSubjectを結合（改行とスペースを除去）
  if (subject) {
    subject = subject.replace(/\r?\n\s*/g, '');
  }
  
  if (subject && subject.startsWith('=?')) {
    // マルチバイト文字のデコード
    const parts = subject.split('?');
    if (parts.length >= 4 && parts[2] === 'B') {
      try {
        const decoded = Buffer.from(parts[3], 'base64').toString('utf-8');
        subject = decoded;
      } catch (error) {
        console.error('Failed to decode subject:', error);
      }
    }
  }
  
  // 受信日時を抽出（Date:行から）
  const dateMatch = emailContent.match(/^Date:\s*(.+)$/m);
  let receivedAt = new Date().toISOString();
  if (dateMatch) {
    try {
      const dateStr = dateMatch[1].trim();
      receivedAt = new Date(dateStr).toISOString();
    } catch (error) {
      console.error('Failed to parse date:', error);
    }
  }
  
  // Content-Transfer-Encodingをチェック
  const transferEncodingMatch = emailContent.match(/^Content-Transfer-Encoding:\s*(.+)$/m);
  const isBase64Encoded = transferEncodingMatch && transferEncodingMatch[1].trim().toLowerCase() === 'base64';
  
  // ヘッダーと本文の境界を見つける（最後の空行の後）
  const headerEndMatch = emailContent.match(/\r?\n\r?\n([\s\S]+?)\r?\n*$/);
  let body = '';
  
  if (headerEndMatch) {
    const bodyContent = headerEndMatch[1].trim();
    const lines = bodyContent.split('\n');
    const firstLine = lines[0].trim();
    
    if (isBase64Encoded) {
      try {
        body = Buffer.from(firstLine, 'base64').toString('utf-8');
      } catch (error) {
        body = firstLine;
      }
    } else {
      body = firstLine;
    }
  } else {
    body = emailContent;
  }
  
  return {
    id: generateId(),
    from: from,
    subject: subject,
    body: body,
    receivedAt: receivedAt,
    s3Key: s3Key
  };
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function generateEmailAddress(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${year}${month}${day}${sequence}@otm.mec.mejsh.com`;
}

