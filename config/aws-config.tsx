export const awsConfig = {
  region: process.env.EXPO_PUBLIC_AWS_REGION!,
  userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID!,
  userPoolWebClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID!,
  oauth: {
    domain: process.env.EXPO_PUBLIC_COGNITO_DOMAIN!,
    scope: ["email", "openid", "profile"],
    redirectSignIn: process.env.EXPO_PUBLIC_REDIRECT_URI!,
    redirectSignOut: process.env.EXPO_PUBLIC_REDIRECT_URI!,
    responseType: "code" as const,
  },
};
