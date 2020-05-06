#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { KeycloakStack } from '../lib/keycloak-stack';

if (!process.env.domainName) {
    console.error("please define domainName envionment variable!! \nRUN:")
    console.error("domainName=mydomain.com cdk deploy \nOR \ndomainName=mydomain.com subDomainName=blog cdk deploy ")
    process.exit(1)
}

const app = new cdk.App();
new KeycloakStack(app, 'KeycloakStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    domainName: process.env.domainName!,
    subDomainName: process.env.subDomainName || 'keycloak'
});
