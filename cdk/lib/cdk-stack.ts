import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { ENV } from "../types";

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StackProps, config: ENV) {
        super(scope, id, props);

        this.tags.setTag("app", "passkeys");
        this.tags.setTag("AppManagerCFNStackKey", this.stackName);

        const logGroup = new cdk.aws_logs.LogGroup(this, `passkeys-log-group`, {
            logGroupName: `/passkeys`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
        });

        const webS3Bucket = new cdk.aws_s3.Bucket(this, "passkey-s3-bucket", {
            bucketName: config.WEB_DOMAIN,
            blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
            autoDeleteObjects: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const passkeysOAI = new cdk.aws_cloudfront.OriginAccessIdentity(this, `oai`, {
            comment: `OAI ${config.WEB_DOMAIN}`,
        });

        webS3Bucket.grantRead(passkeysOAI);

        const zone = cdk.aws_route53.HostedZone.fromHostedZoneAttributes(this, `domain-zone`, {
            hostedZoneId: config.AWS_DOMAIN_HOSTED_ZONE_ID,
            zoneName: config.ROOT_DOMAIN,
        });

        const apiCertificate = new cdk.aws_certificatemanager.Certificate(this, "certificate", {
            domainName: config.ROOT_DOMAIN,
            subjectAlternativeNames: [config.API_DOMAIN],
            validation: cdk.aws_certificatemanager.CertificateValidation.fromDns(zone),
        });

        const certificate = cdk.aws_certificatemanager.Certificate.fromCertificateArn(this, `passkeys-certificate`, config.CERTIFICATE_ARN);

        const passkeysCDN = new cdk.aws_cloudfront.Distribution(this, `cdn`, {
            comment: `CDN for ${config.WEB_DOMAIN}`,
            enableLogging: true,
            defaultBehavior: {
                origin: new cdk.aws_cloudfront_origins.S3Origin(webS3Bucket, {
                    originAccessIdentity: passkeysOAI,
                    originShieldEnabled: true,
                    originShieldRegion: config.AWS_REGION,
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
                    comment: `Web Cache policy ${config.WEB_DOMAIN}`,
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
                    origin: new cdk.aws_cloudfront_origins.HttpOrigin(config.API_DOMAIN),
                    allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
                    viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED,
                    originRequestPolicy: cdk.aws_cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                },
                "/assets/*": {
                    origin: new cdk.aws_cloudfront_origins.S3Origin(webS3Bucket, {
                        originAccessIdentity: passkeysOAI,
                        originShieldEnabled: true,
                        originShieldRegion: config.AWS_REGION,
                    }),
                    allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
                    viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: new cdk.aws_cloudfront.CachePolicy(this, `assets-cache`, {
                        cookieBehavior: cdk.aws_cloudfront.CacheCookieBehavior.none(),
                        headerBehavior: cdk.aws_cloudfront.CacheHeaderBehavior.none(),
                        queryStringBehavior: cdk.aws_cloudfront.CacheQueryStringBehavior.none(),
                        comment: `Assets Cache policy ${config.WEB_DOMAIN}`,
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
            domainNames: [config.WEB_DOMAIN],
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
            recordName: config.WEB_DOMAIN,
        });

        const lambdaRole = new cdk.aws_iam.Role(this, `passkeys-api-role`, {
            assumedBy: new cdk.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"),
                cdk.aws_iam.ManagedPolicy.fromManagedPolicyName(this, `lambda-dynamodb-policy`, "AWSLambdaDynamoDBRole"),
            ],
        });

        const apiHandler = new cdk.aws_lambda_nodejs.NodejsFunction(this, `passkeys-api`, {
            entry: `../server/src/index.mts`,
            functionName: `passkeys-api`,
            description: `Passkeys API`,
            logGroup,
            tracing: cdk.aws_lambda.Tracing.ACTIVE,
            memorySize: 512,
            timeout: cdk.Duration.seconds(15),
            role: lambdaRole,
            runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
            architecture: cdk.aws_lambda.Architecture.ARM_64,
            handler: "handler",
            bundling: {
                platform: "node",
                format: OutputFormat.ESM,
                target: "esnext",
                nodeModules: ["sodium-native"],
                banner: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
                minify: true,
                externalModules: ["aws-sdk", "sodium-native"],
            },
            environment: {
                RP_ID: config.RP_ID,
                RP_ORIGIN: config.RP_ORIGIN,
                SESSION_HEX_KEY: config.SESSION_HEX_KEY,
                NODE_ENV: config.NODE_ENV,
            },
        });

        const apiGateway = new cdk.aws_apigatewayv2.HttpApi(this, `passkeys-api-gateway`, {
            apiName: `passkeys-api`,
            createDefaultStage: false,
        });

        const apiDomainName = new cdk.aws_apigatewayv2.DomainName(this, `api-domain-name`, {
            domainName: config.API_DOMAIN,
            certificate: apiCertificate,
        });

        const stage = apiGateway.addStage("default", {
            autoDeploy: true,
            domainMapping: {
                domainName: apiDomainName,
            },
            throttle: {
                rateLimit: 10,
                burstLimit: 100,
            },
        });

        const defaultStage = stage?.node.defaultChild as cdk.aws_apigatewayv2.CfnStage;

        defaultStage.accessLogSettings = {
            destinationArn: logGroup.logGroupArn,
            format: JSON.stringify({
                requestId: "$context.requestId",
                ip: "$context.identity.sourceIp",
                caller: "$context.identity.caller",
                user: "$context.identity.user",
                requestTime: "$context.requestTime",
                httpMethod: "$context.httpMethod",
                routeKey: "$context.routeKey",
                status: "$context.status",
                protocol: "$context.protocol",
                responseLength: "$context.responseLength",
            }),
        };

        apiGateway.addRoutes({
            path: "/{proxy+}",
            methods: [cdk.aws_apigatewayv2.HttpMethod.ANY],
            integration: new cdk.aws_apigatewayv2_integrations.HttpLambdaIntegration("api-integration", apiHandler),
        });

        new cdk.aws_route53.ARecord(this, `api-domain-record`, {
            zone,
            target: cdk.aws_route53.RecordTarget.fromAlias(
                new cdk.aws_route53_targets.ApiGatewayv2DomainProperties(apiDomainName.regionalDomainName, apiDomainName.regionalHostedZoneId),
            ),
            recordName: "passkeys-api",
        });
    }
}

export default CdkStack;
