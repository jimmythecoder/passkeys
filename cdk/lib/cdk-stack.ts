import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ENV } from "../types";

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StackProps, config: ENV) {
        super(scope, id, props);

        console.debug("config", config);

        const webS3Bucket = new cdk.aws_s3.Bucket(this, "passkey-s3-bucket", {
            bucketName: config.ROOT_DOMAIN,
            blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
            autoDeleteObjects: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const passkeysOAI = new cdk.aws_cloudfront.OriginAccessIdentity(this, `oai`, {
            comment: `OAI ${config.ROOT_DOMAIN}`,
        });

        webS3Bucket.grantRead(passkeysOAI);

        const zone = cdk.aws_route53.HostedZone.fromHostedZoneAttributes(this, `domain-zone`, {
            hostedZoneId: config.AWS_DOMAIN_HOSTED_ZONE_ID,
            zoneName: config.ROOT_DOMAIN,
        });

        const certificate = new cdk.aws_certificatemanager.Certificate(this, "certificate", {
            domainName: config.ROOT_DOMAIN,
            subjectAlternativeNames: [config.API_DOMAIN],
            validation: cdk.aws_certificatemanager.CertificateValidation.fromDns(zone),
        });

        const passkeysCDN = new cdk.aws_cloudfront.Distribution(this, `cdn`, {
            comment: `CDN for ${config.ROOT_DOMAIN}`,
            defaultBehavior: {
                origin: new cdk.aws_cloudfront_origins.S3Origin(webS3Bucket, {
                    originAccessIdentity: passkeysOAI,
                }),
                allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: new cdk.aws_cloudfront.CachePolicy(this, `passkeys-cache`, {
                    comment: `Web Cache policy ${config.ROOT_DOMAIN}`,
                    defaultTtl: cdk.Duration.minutes(2),
                    minTtl: cdk.Duration.minutes(0),
                    maxTtl: cdk.Duration.minutes(2),
                    enableAcceptEncodingBrotli: true,
                    enableAcceptEncodingGzip: true,
                }),
            },
            additionalBehaviors: {
                "/api/*": {
                    origin: new cdk.aws_cloudfront_origins.HttpOrigin(config.API_DOMAIN),
                    allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
                    viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED,
                },
                "/assets/*": {
                    origin: new cdk.aws_cloudfront_origins.S3Origin(webS3Bucket, {
                        originAccessIdentity: passkeysOAI,
                    }),
                    allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
                    viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: new cdk.aws_cloudfront.CachePolicy(this, `assets-cache`, {
                        comment: `Assets Cache policy ${config.ROOT_DOMAIN}`,
                        defaultTtl: cdk.Duration.days(30),
                        minTtl: cdk.Duration.days(1),
                        maxTtl: cdk.Duration.days(30),
                        enableAcceptEncodingBrotli: true,
                        enableAcceptEncodingGzip: true,
                    }),
                },
            },
            errorResponses: [
                {
                    httpStatus: 404,
                    responsePagePath: "/index.html",
                    responseHttpStatus: 200,
                },
                {
                    httpStatus: 403,
                    responsePagePath: "/index.html",
                    responseHttpStatus: 200,
                },
            ],
            // certificate,
            defaultRootObject: "index.html",
            minimumProtocolVersion: cdk.aws_cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            // domainNames: [config.domain, config.api_domain],
            priceClass: cdk.aws_cloudfront.PriceClass.PRICE_CLASS_ALL,
            httpVersion: cdk.aws_cloudfront.HttpVersion.HTTP2_AND_3,
        });

        const bucketDeployment = new cdk.aws_s3_deployment.BucketDeployment(this, `passkeys-bucket-deployment`, {
            sources: [cdk.aws_s3_deployment.Source.asset("../dist")],
            destinationBucket: webS3Bucket,
            // cacheControl: [cdk.aws_s3_deployment.CacheControl.setPublic(), cdk.aws_s3_deployment.CacheControl.maxAge(cdk.Duration.days(30))],
            distribution: passkeysCDN,
            distributionPaths: ["/*"],
        });
    }
}

export default CdkStack;
