import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const bucket = new cdk.aws_s3.Bucket(this, "passkeys-s3-bucket", {
            bucketName: "passkeys.dev.jharris.nz",
            blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
            versioned: false,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
    }
}

export default CdkStack;
