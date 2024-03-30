#!/usr/bin/env node
import * as dotenv from "dotenv";
import * as cdk from "aws-cdk-lib";
import { UIStack } from "./ui-stack";

dotenv.config( { path: [".env.local", ".env"] });

const app = new cdk.App();

export default new UIStack(
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
);
