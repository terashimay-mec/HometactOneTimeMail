import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';
import { auth } from './auth/resource';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Effect } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';

const backend = defineBackend({
  data,
  auth,
});

// 既存のS3バケットを使用する設定
const customBucketStack = backend.createStack('custom-bucket-stack');

// 既存のS3バケットをインポート
const customBucket = Bucket.fromBucketAttributes(customBucketStack, 'EmailStorageBucket', {
  bucketArn: 'arn:aws:s3:::otm-mec-mejsh-com-recieve',
  region: 'ap-northeast-1'
});

// ストレージ設定を追加
backend.addOutput({
  storage: {
    aws_region: customBucket.env.region,
    bucket_name: customBucket.bucketName,
    buckets: [
      {
        aws_region: customBucket.env.region,
        bucket_name: customBucket.bucketName,
        name: 'emailStorage',
        paths: {
          'email/*': {
            guest: ['get', 'list']
          }
        }
      }
    ]
  }
});

// ゲストユーザー用のIAMポリシーを定義
const unauthPolicy = new Policy(customBucketStack, 'customBucketUnauthPolicy', {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [`${customBucket.bucketArn}/email/*`],
    }),
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:ListBucket'],
      resources: [customBucket.bucketArn],
      conditions: {
        StringLike: {
          's3:prefix': ['email/', 'email/*'],
        },
      },
    }),
  ],
});

// ゲストユーザーロールにポリシーをアタッチ
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(unauthPolicy);
