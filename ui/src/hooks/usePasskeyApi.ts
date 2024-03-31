import { useApi } from "./useApi";
import { Api as ApiConfig } from "@passkeys/config";
import type { Api } from "@passkeys/types";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/types";

export const usePasskeyApi = () => {
    const api = useApi(ApiConfig.API_PREFIX, "POST");

    const getRegistrationCredentials = async function getRegistrationCredentials(displayName: string, userName: string) {
        return await api<Api.Auth.Register.GetCredentials.Response, Api.Auth.Register.GetCredentials.Request>(
            ApiConfig.API_ENDPOINTS.auth.register.getCredentials,
            {
                displayName,
                userName,
            },
        );
    };

    const verifyRegistration = async function verifyRegistration(attResp: RegistrationResponseJSON, authenticatorName: string) {
        return await api<Api.Auth.Register.Verify.Response, Api.Auth.Register.Verify.Request>(ApiConfig.API_ENDPOINTS.auth.register.verify, {
            attResp,
            authenticatorName,
        });
    };

    const getSigninCredentials = async function getSigninCredentials(userName: string) {
        return await api<Api.Auth.Signin.GetCredentials.Response, Api.Auth.Signin.GetCredentials.Request>(
            ApiConfig.API_ENDPOINTS.auth.register.getCredentials,
            {
                userName,
            },
        );
    };

    const verifySignin = async function verifySignin(attResp: AuthenticationResponseJSON) {
        return await api<Api.Auth.Signin.Verify.Response, Api.Auth.Signin.Verify.Request>(ApiConfig.API_ENDPOINTS.auth.signin.verify, attResp);
    };

    const signout = async function signout() {
        return await api<Api.Auth.Signout.Response, Api.Auth.Signout.Request>(ApiConfig.API_ENDPOINTS.auth.signout);
    };

    return {
        getRegistrationCredentials,
        verifyRegistration,
        getSigninCredentials,
        verifySignin,
        signout,
    };
};

export default usePasskeyApi;
