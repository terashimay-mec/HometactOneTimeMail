// utils/amplify-utils.ts
import { cookies } from "next/headers";
import { Amplify } from "aws-amplify";

import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import { getCurrentUser, fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth/server";

import { generateClient } from "aws-amplify/data";

import { type Schema } from "../../amplify/data/resource";
import outputs from "../../amplify_outputs.json";

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});

let idTokenClient: any;
let publicClient: any;

export function generateIdTokenClient() {
  Amplify.configure(outputs);
  idTokenClient = generateClient<Schema>({
    headers: async (requestOptions) => {
      const session = await fetchAuthSessionServer();
      const idToken = session?.tokens?.idToken?.toString();
      return {
        Authorization: idToken || "",
      };
    },
  });
  return idTokenClient;
}

export function generatePublicClient() {
  Amplify.configure(outputs);
  publicClient = generateClient<Schema>();
  return publicClient;
}

export async function getCurrentUserServer() {
  try {
    const currentUser = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => getCurrentUser(contextSpec),
    });
    return currentUser;
  } catch (error) {
    console.error(error);
  }
}

export async function fetchAuthSessionServer(
  options?:
    | {
        forceRefresh: boolean | undefined;
      }
    | undefined
) {
  try {
    const authSession = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec, options),
    });
    return authSession;
  } catch (error) {
    console.error(error);
  }
}
