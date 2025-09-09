import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  EmailAddress: a
    .model({
      id: a.id().required(),
      address: a.string().required(),
      createdAt: a.datetime().required(),
      isActive: a.boolean().required(),
    })
    .secondaryIndexes((index) => [
      index('address'),
    ])
    .authorization((allow) => [
      allow.guest(),
      allow.authenticated(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'iam'
  },
});
