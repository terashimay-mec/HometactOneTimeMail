import { list, getUrl } from 'aws-amplify/storage';
import { Email } from '@/types';

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
              const email = parseEmailContent(emailContent, item.path);
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

function parseEmailContent(emailContent: string, s3Key: string): Email {
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
