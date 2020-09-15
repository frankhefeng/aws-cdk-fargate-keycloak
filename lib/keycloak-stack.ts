import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');
import iam = require('@aws-cdk/aws-iam')
import rds = require('@aws-cdk/aws-rds');
import s3 = require('@aws-cdk/aws-s3');
import * as logs from '@aws-cdk/aws-logs';
import secretsmanager = require('@aws-cdk/aws-secretsmanager');
import ecs_patterns = require('@aws-cdk/aws-ecs-patterns');
import route53 = require('@aws-cdk/aws-route53');
import elbv2 = require("@aws-cdk/aws-elasticloadbalancingv2");
import acm = require('@aws-cdk/aws-certificatemanager');

export interface KeycloakStackProps extends cdk.StackProps {
  domainName: string,
  subDomainName: string,
}

export class KeycloakStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: KeycloakStackProps) {

    super(scope, id, props);

    var vpc = new ec2.Vpc(this, 'vpc', {
      cidr: '10.254.0.0/16',
      maxAzs: 3,
    })

    const cluster = new ecs.Cluster(this, 'cluster', {
      vpc: vpc
    })

    const fargateLogGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: 'KeycloakFargate',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const taskRole = new iam.Role(this, 'KeycloakFargateTaskRole', {
      roleName: 'KeycloakFargateTaskRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    });

    const dbSecret = new secretsmanager.Secret(this, 'KeycloakDBSecret', {
      secretName: "KeycloakDBPassword",
      generateSecretString: {
        excludePunctuation: true
      }
    });
    const keycloakUser = 'admin'
    const keycloakSecret = new secretsmanager.Secret(this, 'KeycloakAdminSecret', {
      secretName: "KeycloakAdminPassword",
      generateSecretString: {
        excludePunctuation: true
      }
    });
    const db = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.AURORA,
      defaultDatabaseName: 'keycloak',
      masterUser: {
        username: 'keycloak',
        password: dbSecret.secretValue
      },
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.SMALL),
        vpc: vpc
      }
    });

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: props.domainName
    });

    const cert = new acm.DnsValidatedCertificate(this, 'KeycloakCert', {
      hostedZone,
      domainName: props.subDomainName + '.' + props.domainName,
    });

    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "KeycloakService", {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('jboss/keycloak:11.0.2'),
        enableLogging: true,
        logDriver: new ecs.AwsLogDriver({
          streamPrefix: 'keycloak',
          logGroup: fargateLogGroup,
        }),
        taskRole: taskRole,
        secrets: {
          'DB_PASSWORD': ecs.Secret.fromSecretsManager(dbSecret),
          'KEYCLOAK_PASSWORD': ecs.Secret.fromSecretsManager(keycloakSecret)
        },
        environment: {
          'DB_VENDOR': 'mysql',
          'DB_USER': 'keycloak',
          'DB_ADDR': db.clusterEndpoint.hostname,
          'DB_DATABASE': 'keycloak',
          'KEYCLOAK_USER': 'admin',
          'PROXY_ADDRESS_FORWARDING': 'true',
          'JDBC_PARAMS': 'useSSL=false',
          // 'KEYCLOAK_LOGLEVEL': 'DEBUG',
          // 'ROOT_LOGLEVEL': 'DEBUG',
        },
        containerPort: 8080,
      },
      memoryLimitMiB: 1024,
      cpu: 256,
      desiredCount: 1,
      publicLoadBalancer: true,
      domainName: props.subDomainName + '.' + props.domainName,
      domainZone: hostedZone,
      protocol: elbv2.ApplicationProtocol.HTTPS,
    });

    fargateService.targetGroup.enableCookieStickiness(cdk.Duration.seconds(24 * 60 * 60))
    fargateService.targetGroup.configureHealthCheck({
      port: '8080',
      path: '/auth/realms/master/.well-known/openid-configuration',
      timeout: cdk.Duration.seconds(20),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 10,
      interval: cdk.Duration.seconds(30),
    });
    fargateService.listener.addCertificateArns('acm', [cert.certificateArn])
    db.connections.allowDefaultPortFrom(fargateService.service, 'From Fargate');

    new cdk.CfnOutput(this, 'Keycloak ADMIN username', { value: `${keycloakUser}` })
    new cdk.CfnOutput(this, 'Keycloak ADMIN password', {
      value: `Please retrive it from AWS Secrets Manager > Secrets > KeycloakAdminPassword`
    })
  }
}
