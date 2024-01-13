import awsLambdaFastify from "@fastify/aws-lambda";
import { init } from "./app";

const app = await init();
const proxy = awsLambdaFastify(app);
await app.ready();
const handler = async (event, context) => await proxy(event, context);

export { handler };
export default handler;
