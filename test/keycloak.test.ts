import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import Keycloak = require('../lib/keycloak-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Keycloak.KeycloakStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
