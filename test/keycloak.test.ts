import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import Keycloak = require('../lib/keycloak-stack');

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Keycloak.KeycloakStack(app, 'MyTestStack', {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    domainName: process.env.domainName!,
    subDomainName: process.env.subDomainName || 'keycloak'
  });
  // THEN
  expectCDK(stack).to(matchTemplate({
    "Resources": {}
  }, MatchStyle.EXACT))
});
