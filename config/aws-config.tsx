export const awsConfig = {
  region: "eu-west-2",
  userPoolId: "eu-west-2_ah7atlDyG",
  userPoolWebClientId: "56g4hhoot2f4ga0chks0ajof3t",
  oauth: {
    domain: "plant-mate-auth-domain.auth.eu-west-2.amazoncognito.com",
    scope: ["email", "openid", "profile"],
    redirectSignIn: "myapp://",
    redirectSignOut: "myapp://",
    responseType: "code" as const,
  },
};
