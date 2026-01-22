// config/aws-config.ts

export const awsConfig = {
  region: "eu-west-2",
  userPoolId: "eu-west-2_vBP9DclNB",
  userPoolWebClientId: "7duoltp4drj1c0200o807pt0u",
  oauth: {
    domain: "plant-mate-auth-domain.auth.eu-west-2.amazoncognito.com",
    scope: ["email", "openid", "profile"],
    redirectSignIn: "http://localhost:8081", // Changed for web
    redirectSignOut: "http://localhost:8081", // Changed for web
    responseType: "code" as const,
  },
};
