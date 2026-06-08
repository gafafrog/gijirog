import * as cdk from 'aws-cdk-lib/core';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

// Trust + permissions for GitHub Actions to deploy gijirog. Foundational and
// account-scoped (the OIDC provider is a singleton) — deployed by a human, kept
// apart from the app stack that this role deploys (no chicken-and-egg).
export class GijirogCicdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const provider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    const ciRole = new iam.Role(this, 'CiRole', {
      roleName: 'gijirog-ci',
      description: 'Assumed by GitHub Actions (main) to push images and deploy ECS',
      assumedBy: new iam.OpenIdConnectPrincipal(provider, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub':
            'repo:gafafrog/gijirog:ref:refs/heads/main',
        },
      }),
    });

    // Push built images to the app's ECR repo (weak by-name reference keeps this
    // stack decoupled from the app stack). grantPush also adds GetAuthorizationToken.
    ecr.Repository.fromRepositoryName(this, 'AppRepository', 'gijirog').grantPush(ciRole);

    // Register a new task-def revision pinning the freshly-pushed image SHA.
    // These actions do not support resource-level permissions.
    ciRole.addToPolicy(new iam.PolicyStatement({
      sid: 'RegisterTaskDefinition',
      actions: ['ecs:RegisterTaskDefinition', 'ecs:DescribeTaskDefinition'],
      resources: ['*'],
    }));

    // Point the service at the new revision (scoped to the gijirog service).
    ciRole.addToPolicy(new iam.PolicyStatement({
      sid: 'DeployService',
      actions: ['ecs:UpdateService', 'ecs:DescribeServices'],
      resources: [
        cdk.Arn.format({ service: 'ecs', resource: 'service', resourceName: 'gijirog/gijirog' }, this),
      ],
    }));

    // RegisterTaskDefinition passes the task's execution/task roles to ECS.
    ciRole.addToPolicy(new iam.PolicyStatement({
      sid: 'PassTaskRoles',
      actions: ['iam:PassRole'],
      resources: ['*'],
      conditions: { StringEquals: { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' } },
    }));

    new cdk.CfnOutput(this, 'CiRoleArn', { value: ciRole.roleArn });
  }
}
