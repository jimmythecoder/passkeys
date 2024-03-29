import awsLambdaFastify from "@fastify/aws-lambda";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { init } from "./index";

const app = await init();
const proxy = awsLambdaFastify(app);
await app.ready();
const handler = async (event: APIGatewayProxyEvent, context: Context) => await proxy(event, context);

export { handler };
export default handler;
