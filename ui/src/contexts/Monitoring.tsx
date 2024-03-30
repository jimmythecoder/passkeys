import React, { createContext, useContext } from "react";
import { AwsRum, AwsRumConfig } from "aws-rum-web";

export type MonitoringContextType = {
    AWS_APPLICATION_ID: string;
    AWS_APPLICATION_VERSION: string;
    AWS_APPLICATION_REGION: string;
    config: AwsRumConfig;
    awsRum?: AwsRum;
};

export const MonitoringContext = createContext<MonitoringContextType>({
    AWS_APPLICATION_ID: import.meta.env.VITE_AWS_RUM_APPLICATION_ID!,
    AWS_APPLICATION_VERSION: "1.0.0",
    AWS_APPLICATION_REGION: "ap-southeast-2",
    config: {
        sessionSampleRate: 1,
        guestRoleArn: import.meta.env.VITE_AWS_RUM_GUEST_ROLE_ARN,
        identityPoolId: import.meta.env.VITE_AWS_RUM_IDENTITY_POOL_ID,
        endpoint: "https://dataplane.rum.ap-southeast-2.amazonaws.com",
        telemetries: ["performance", "errors", "http"],
        allowCookies: true,
        enableXRay: true,
    },
});

export const MonitoringProvider: React.FC<React.PropsWithChildren> = (props) => {
    const context = useContext(MonitoringContext);

    try {
        context.awsRum = new AwsRum(context.AWS_APPLICATION_ID, context.AWS_APPLICATION_VERSION, context.AWS_APPLICATION_REGION, context.config);
    } catch (error) {
        console.error("Error initializing AWS RUM", error);
    }

    return <MonitoringContext.Provider value={context}>{props.children}</MonitoringContext.Provider>;
};

export default MonitoringProvider;
