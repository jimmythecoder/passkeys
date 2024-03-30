import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";

export const getSSMParameters = async (parameters: string[]) => {
    // Get SSM paramters from AWS
    const ssm = new SSMClient({ region: process.env.AWS_REGION });
    const cmd = new GetParametersCommand({
        Names: parameters,
        WithDecryption: true,
    });

    const data = await ssm.send(cmd);

    if (!data.Parameters) {
        throw new Error("No private key found");
    }

    return data.Parameters;
};

export default {
    getSSMParameters,
};
