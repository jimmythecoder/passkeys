import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export class ApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        this.tags.setTag("app", id);
        this.tags.setTag("AppManagerCFNStackKey", this.stackName);

        const logGroup = new cdk.aws_logs.LogGroup(this, `${id}-log-group`, {
            logGroupName: `/${id}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
        });

        const jwksPublicKeys = cdk.aws_ssm.StringParameter.fromSecureStringParameterAttributes(this, `${id}-jwk-public-keys-ssm`, {
            parameterName: process.env.JWKS_PUBLIC_KEYS!,
            version: 1,
        });

        const jwkPrivateKey = cdk.aws_ssm.StringParameter.fromSecureStringParameterAttributes(this, `${id}-jwk-private-key-ssm`, {
            parameterName: process.env.JWK_PRIVATE_KEY!,
            version: 1,
        });

        const zone = cdk.aws_route53.HostedZone.fromHostedZoneAttributes(this, `${id}-domain-zone`, {
            hostedZoneId: process.env.AWS_DOMAIN_HOSTED_ZONE_ID!,
            zoneName: process.env.ROOT_DOMAIN!,
        });

        const apiCertificate = new cdk.aws_certificatemanager.Certificate(this, `${id}-certificate`, {
            domainName: process.env.ROOT_DOMAIN!,
            subjectAlternativeNames: [process.env.API_DOMAIN!],
            validation: cdk.aws_certificatemanager.CertificateValidation.fromDns(zone),
        });

        const lambdaRole = new cdk.aws_iam.Role(this, `${id}-lambda-role`, {
            assumedBy: new cdk.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"),
                cdk.aws_iam.ManagedPolicy.fromManagedPolicyName(this, `${id}-lambda-dynamodb-policy`, "AWSLambdaDynamoDBRole"),
            ],
        });

        const apiHandler = new cdk.aws_lambda_nodejs.NodejsFunction(this, `${id}-lambda`, {
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
                RP_ID: "passkeys.jharris.nz",
                RP_ORIGIN: "https://passkeys.jharris.nz",
                USE_METADATA_SERVICE: "false",
                NODE_ENV: "production",
                JWKS_PUBLIC_KEYS: process.env.JWKS_PUBLIC_KEYS!,
                JWK_PRIVATE_KEY: process.env.JWK_PRIVATE_KEY!,
                JWT_AUDIENCE: "https://passkeys.jharris.nz",
                JWT_ISSUER: "passkeys.jharris.nz",
                SESSION_COOKIE_NAME: "auth.session",
                SESSION_COOKIE_DOMAIN: "passkeys.jharris.nz",
                SESSION_COOKIE_SECRET: process.env.SESSION_COOKIE_SECRET!,
            },
        });

        jwksPublicKeys.grantRead(apiHandler);
        jwkPrivateKey.grantRead(apiHandler);

        const apiGateway = new cdk.aws_apigatewayv2.HttpApi(this, `${id}-http-api-gateway`, {
            apiName: id,
            createDefaultStage: false,
        });

        const apiDomainName = new cdk.aws_apigatewayv2.DomainName(this, `${id}-domain-name`, {
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
            }),
        };

        apiGateway.addRoutes({
            path: "/{proxy+}",
            methods: [cdk.aws_apigatewayv2.HttpMethod.ANY],
            integration: new cdk.aws_apigatewayv2_integrations.HttpLambdaIntegration(`${id}-http-lambda-integration`, apiHandler),
        });

        new cdk.aws_route53.ARecord(this, `${id}-route53-arecord`, {
            zone,
            target: cdk.aws_route53.RecordTarget.fromAlias(
                new cdk.aws_route53_targets.ApiGatewayv2DomainProperties(apiDomainName.regionalDomainName, apiDomainName.regionalHostedZoneId),
            ),
            recordName: process.env.API_SUBDOMAIN!,
        });
    }
}

export default ApiStack;
