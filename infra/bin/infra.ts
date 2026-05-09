#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { GijirogAppStack } from '../lib/gijirog-app-stack';

const app = new cdk.App();
new GijirogAppStack(app, 'GijirogAppStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
