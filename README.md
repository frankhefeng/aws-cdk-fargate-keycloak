# Deploy Keycloak on Fargate with CDK

## How to use
1. Configure AWS CLI as per instruction [Installing the AWS CLI version 2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
2. Configure AWS CDK  **TypeScript** environment as per instruction [Getting Started With the AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html)
3. Configure AWS CodeCommit  **Credentials**  as per instruction [Configure Credentials on Linux, macOS, or Unix](https://docs.aws.amazon.com/zh_cn/codecommit/latest/userguide/setting-up-ssh-unixes.html#setting-up-ssh-unixes-keys)
4. Run `npm run build` to compile the scripts, then run `domainName=mydomain.com cdk deploy`. `mydomain.com` is a domain hosted in Route53.
