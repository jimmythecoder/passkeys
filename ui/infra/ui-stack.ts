import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class UIStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        this.tags.setTag("app", "@passkeys/ui");
        this.tags.setTag("AppManagerCFNStackKey", this.stackName);

        const webS3Bucket = new cdk.aws_s3.Bucket(this, "passkey-s3-bucket", {
            bucketName: process.env.WEB_DOMAIN,
            blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
            autoDeleteObjects: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const passkeysOAI = new cdk.aws_cloudfront.OriginAccessIdentity(this, `oai`, {
            comment: `OAI ${process.env.WEB_DOMAIN}`,
        });

        webS3Bucket.grantRead(passkeysOAI);

        const zone = cdk.aws_route53.HostedZone.fromHostedZoneAttributes(this, `domain-zone`, {
            hostedZoneId: process.env.AWS_DOMAIN_HOSTED_ZONE_ID!,
            zoneName: process.env.ROOT_DOMAIN!,
        });

        const apiCertificate = new cdk.aws_certificatemanager.Certificate(this, "certificate", {
            domainName: process.env.ROOT_DOMAIN!,
            subjectAlternativeNames: [process.env.API_DOMAIN!],
            validation: cdk.aws_certificatemanager.CertificateValidation.fromDns(zone),
        });

        const certificate = cdk.aws_certificatemanager.Certificate.fromCertificateArn(this, `passkeys-certificate`, process.env.CERTIFICATE_ARN!);

        const passkeysCDN = new cdk.aws_cloudfront.Distribution(this, `cdn`, {
            comment: `CDN for ${process.env.WEB_DOMAIN}`,
            enableLogging: true,
            defaultBehavior: {
                origin: new cdk.aws_cloudfront_origins.S3Origin(webS3Bucket, {
                    originAccessIdentity: passkeysOAI,
                    originShieldEnabled: true,
                    originShieldRegion: process.env.AWS_REGION,
                }),
                functionAssociations: [
                    {
                        eventType: cdk.aws_cloudfront.FunctionEventType.VIEWER_REQUEST,
                        function: new cdk.aws_cloudfront.Function(this, `spa-rewrite`, {
                            code: cdk.aws_cloudfront.FunctionCode.fromFile({
                                filePath: "./lib/viewer-request.js",
                            }),
                        }),
                    },
                ],
                allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: new cdk.aws_cloudfront.CachePolicy(this, `passkeys-cache`, {
                    comment: `Web Cache policy ${process.env.WEB_DOMAIN}`,
                    cookieBehavior: cdk.aws_cloudfront.CacheCookieBehavior.none(),
                    headerBehavior: cdk.aws_cloudfront.CacheHeaderBehavior.none(),
                    queryStringBehavior: cdk.aws_cloudfront.CacheQueryStringBehavior.none(),
                    defaultTtl: cdk.Duration.minutes(1),
                    minTtl: cdk.Duration.minutes(0),
                    maxTtl: cdk.Duration.minutes(1),
                    enableAcceptEncodingBrotli: true,
                    enableAcceptEncodingGzip: true,
                }),
            },
            additionalBehaviors: {
                "/api/*": {
                    origin: new cdk.aws_cloudfront_origins.HttpOrigin(process.env.API_DOMAIN!),
                    allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
                    viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED,
                    originRequestPolicy: cdk.aws_cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                },
                "/assets/*": {
                    origin: new cdk.aws_cloudfront_origins.S3Origin(webS3Bucket, {
                        originAccessIdentity: passkeysOAI,
                        originShieldEnabled: true,
                        originShieldRegion: process.env.AWS_REGION,
                    }),
                    allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
                    viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: new cdk.aws_cloudfront.CachePolicy(this, `assets-cache`, {
                        cookieBehavior: cdk.aws_cloudfront.CacheCookieBehavior.none(),
                        headerBehavior: cdk.aws_cloudfront.CacheHeaderBehavior.none(),
                        queryStringBehavior: cdk.aws_cloudfront.CacheQueryStringBehavior.none(),
                        comment: `Assets Cache policy ${process.env.WEB_DOMAIN}`,
                        defaultTtl: cdk.Duration.days(30),
                        minTtl: cdk.Duration.days(1),
                        maxTtl: cdk.Duration.days(30),
                        enableAcceptEncodingBrotli: true,
                        enableAcceptEncodingGzip: true,
                    }),
                },
            },
            certificate,
            defaultRootObject: "index.html",
            minimumProtocolVersion: cdk.aws_cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            domainNames: [process.env.WEB_DOMAIN!],
            priceClass: cdk.aws_cloudfront.PriceClass.PRICE_CLASS_ALL,
            httpVersion: cdk.aws_cloudfront.HttpVersion.HTTP2_AND_3,
        });

        new cdk.aws_s3_deployment.BucketDeployment(this, `passkeys-bucket-deployment`, {
            sources: [cdk.aws_s3_deployment.Source.asset("../dist")],
            destinationBucket: webS3Bucket,
            distribution: passkeysCDN,
            distributionPaths: ["/*"],
            prune: true,
        });

        const cloudFrontTarget = new cdk.aws_route53_targets.CloudFrontTarget(passkeysCDN);

        new cdk.aws_route53.ARecord(this, `passkeys-domain`, {
            zone,
            target: cdk.aws_route53.RecordTarget.fromAlias(cloudFrontTarget),
            recordName: process.env.WEB_DOMAIN,
        });

        const lambdaRole = new cdk.aws_iam.Role(this, `passkeys-api-role`, {
            assumedBy: new cdk.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"),
                cdk.aws_iam.ManagedPolicy.fromManagedPolicyName(this, `lambda-dynamodb-policy`, "AWSLambdaDynamoDBRole"),
            ],
        });
    }
}

export default UIStack;
