import awsLambdaFastify from "@fastify/aws-lambda";
import { init } from "./app";

const app = init();

const proxy = awsLambdaFastify(app);

export const handler = proxy;

await app.ready();

export default proxy;
