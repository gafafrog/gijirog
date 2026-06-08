#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { GijirogAppStack } from '../lib/gijirog-app-stack';
import { GijirogCicdStack } from '../lib/gijirog-cicd-stack';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new GijirogAppStack(app, 'GijirogAppStack', { env });
new GijirogCicdStack(app, 'GijirogCicdStack', { env });
