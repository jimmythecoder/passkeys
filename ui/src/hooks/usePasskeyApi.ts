import { useApi } from "./useApi";
import { Api as ApiConfig } from "@passkeys/config";
import type { Api } from "@passkeys/types";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/types";

export const usePasskeyApi = () => {
    const api = useApi(ApiConfig.API_PREFIX, "POST");

    async function getRegistrationCredentials(displayName: string, userName: string, signal?: AbortSignal) {
        return await api<Api.Auth.Register.GetCredentials.Response, Api.Auth.Register.GetCredentials.Request>(
            ApiConfig.API_ENDPOINTS.auth.register.getCredentials,
            {
                displayName,
                userName,
            },
            { signal },
        );
    }

    async function verifyRegistration(attResp: RegistrationResponseJSON, authenticatorName: string, signal?: AbortSignal) {
        return await api<Api.Auth.Register.Verify.Response, Api.Auth.Register.Verify.Request>(
            ApiConfig.API_ENDPOINTS.auth.register.verify,
            {
                attResp,
                authenticatorName,
            },
            { signal },
        );
    }

    async function getSigninCredentials(userName: string, signal?: AbortSignal) {
        return await api<Api.Auth.Signin.GetCredentials.Response, Api.Auth.Signin.GetCredentials.Request>(
            ApiConfig.API_ENDPOINTS.auth.signin.getCredentials,
            {
                userName,
            },
            { signal },
        );
    }

    async function verifySignin(attResp: AuthenticationResponseJSON, signal?: AbortSignal) {
        return await api<Api.Auth.Signin.Verify.Response, Api.Auth.Signin.Verify.Request>(ApiConfig.API_ENDPOINTS.auth.signin.verify, attResp, {
            signal,
        });
    }

    async function conditionalUI(authenticators: string[], signal?: AbortSignal) {
        return await api<Api.Auth.Signin.GetCredentials.Response, Api.Auth.Signin.GetCredentials.ConditionalUIRequest>(
            ApiConfig.API_ENDPOINTS.auth.signin.getAllCredentails,
            { authenticators },
            { signal },
        );
    }

    async function signout() {
        return await api<Api.Auth.Signout.Response, Api.Auth.Signout.Request>(ApiConfig.API_ENDPOINTS.auth.signout);
    }

    return {
        getRegistrationCredentials,
        verifyRegistration,
        getSigninCredentials,
        verifySignin,
        conditionalUI,
        signout,
    };
};

export default usePasskeyApi;
