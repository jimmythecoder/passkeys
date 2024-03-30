#!/usr/bin/env node
import * as dotenv from "dotenv";
import * as cdk from "aws-cdk-lib";
import { CdkStack } from "../lib/cdk-stack";

dotenv.config({ paths: ["../../.env"]});

export const env = {
    AWS_REGION: process.env.AWS_REGION!,
    ROOT_DOMAIN: process.env.ROOT_DOMAIN!,
    WEB_DOMAIN: process.env.WEB_DOMAIN!,
    API_DOMAIN: process.env.API_DOMAIN!,
    AWS_DOMAIN_HOSTED_ZONE_ID: process.env.AWS_DOMAIN_HOSTED_ZONE_ID!,
    CERTIFICATE_ARN: process.env.CERTIFICATE_ARN!,
    NODE_ENV: process.env.NODE_ENV ?? "production",
} as const;

export type ENV = typeof env;

const app = new cdk.App();

export default new CdkStack(
    app,
    "passkeys-ui-stack",
    {
        /* If you don't specify 'env', this stack will be environment-agnostic.
         * Account/Region-dependent features and context lookups will not work,
         * but a single synthesized template can be deployed anywhere. */

        /* Uncomment the next line to specialize this stack for the AWS Account
         * and Region that are implied by the current CLI configuration. */
        // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

        /* Uncomment the next line if you know exactly what Account and Region you
         * want to deploy the stack to. */
        env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.AWS_REGION },

        /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
    },
    env,
);
