#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { StaticSiteStack } from '../lib/static-site-stack';
import { environment } from '../environments/environment';

const app = new cdk.App();
new StaticSiteStack(app, 'StaticSiteStack', { env: { account: environment.awsAccount, region: environment.awsRegion } });
