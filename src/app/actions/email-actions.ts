"use server";

import { list, getUrl } from 'aws-amplify/storage';
import { Email, ApiResponse, EmailAddress } from '@/types';
import { generatePublicClient } from '@/utils/amplify-utils';

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

function generateEmailAddress(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${year}${month}${day}${sequence}@otm.mec.mejsh.com`;
}

