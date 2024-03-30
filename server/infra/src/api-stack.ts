import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export class ApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        this.tags.setTag("app", "@passkeys/api");
        this.tags.setTag("AppManagerCFNStackKey", this.stackName);

        const logGroup = new cdk.aws_logs.LogGroup(this, `passkeys-log-group`, {
            logGroupName: `/passkeys/api`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
        });

        const jwksPublicKeys = cdk.aws_ssm.StringParameter.fromSecureStringParameterAttributes(this, `jwk-public-keys-ssm`, {
            parameterName: process.env.JWKS_PUBLIC_KEYS!,
            version: 1,
        });

        const jwkPrivateKey = cdk.aws_ssm.StringParameter.fromSecureStringParameterAttributes(this, `jwk-private-key-ssm`, {
            parameterName: process.env.JWK_PRIVATE_KEY!,
            version: 1,
        });

        const zone = cdk.aws_route53.HostedZone.fromHostedZoneAttributes(this, `domain-zone`, {
            hostedZoneId: process.env.AWS_DOMAIN_HOSTED_ZONE_ID!,
            zoneName: process.env.ROOT_DOMAIN!,
        });

        const apiCertificate = new cdk.aws_certificatemanager.Certificate(this, "certificate", {
            domainName: process.env.ROOT_DOMAIN!,
            subjectAlternativeNames: [process.env.API_DOMAIN!],
            validation: cdk.aws_certificatemanager.CertificateValidation.fromDns(zone),
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
            entry: `../src/lambda.mts`,
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
            adotInstrumentation: {
                execWrapper: cdk.aws_lambda.AdotLambdaExecWrapper.REGULAR_HANDLER,
                layerVersion: cdk.aws_lambda.AdotLayerVersion.fromJavaScriptSdkLayerVersion(
                    cdk.aws_lambda.AdotLambdaLayerJavaScriptSdkVersion.LATEST,
                ),
            },
            bundling: {
                platform: "node",
                format: OutputFormat.ESM,
                target: "esnext",
                banner: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
                minify: true,
                externalModules: ["aws-sdk", "@aws-sdk/client-ssm"],
            },
            environment: {
                RP_ID: process.env.RP_ID!,
                RP_ORIGIN: process.env.RP_ORIGIN!,
                NODE_ENV: process.env.NODE_ENV!,
                JWKS_PUBLIC_KEYS: process.env.JWKS_PUBLIC_KEYS!,
                JWK_PRIVATE_KEY: process.env.JWK_PRIVATE_KEY!,
                JWT_AUDIENCE: process.env.JWT_AUDIENCE!,
                JWT_ISSUER: process.env.JWT_ISSUER!,
                SESSION_COOKIE_DOMAIN: process.env.SESSION_COOKIE_DOMAIN!,
                COOKIE_SECRET: process.env.COOKIE_SECRET!,
            },
        });

        jwksPublicKeys.grantRead(apiHandler);
        jwkPrivateKey.grantRead(apiHandler);

        const apiGateway = new cdk.aws_apigatewayv2.HttpApi(this, `passkeys-api-gateway`, {
            apiName: `passkeys-api`,
            createDefaultStage: false,
        });

        const apiDomainName = new cdk.aws_apigatewayv2.DomainName(this, `api-domain-name`, {
            domainName: process.env.API_DOMAIN!,
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
                traceId: "$context.traceId"
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

export default ApiStack;
