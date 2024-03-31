import { useApi } from "./useApi";
import { API_PREFIX, API_ENDPOINTS } from "@/config";
import type { Api } from "@passkeys/types";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/types";

export const usePasskeyApi = () => {
    const api = useApi(API_PREFIX, "POST");

    const getRegistrationCredentials = async function getRegistrationCredentials(displayName: string, userName: string, authenticatorName: string) {
        return await api<Api.Auth.Register.GetCredentials.Response, Api.Auth.Register.GetCredentials.Request>(
            API_ENDPOINTS.auth.register.getCredentials,
            {
                displayName,
                userName,
                authenticatorName,
            },
        );
    };

    const verifyRegistration = async function verifyRegistration(attResp: RegistrationResponseJSON) {
        return await api<Api.Auth.Register.Verify.Response, Api.Auth.Register.Verify.Request>(API_ENDPOINTS.auth.register.verify, attResp);
    };

    const getSigninCredentials = async function getSigninCredentials(userName: string) {
        return await api<Api.Auth.Signin.GetCredentials.Response, Api.Auth.Signin.GetCredentials.Request>(
            API_ENDPOINTS.auth.register.getCredentials,
            {
                userName,
            },
        );
    };

    const verifySignin = async function verifySignin(attResp: AuthenticationResponseJSON) {
        return await api<Api.Auth.Signin.Verify.Response, Api.Auth.Signin.Verify.Request>(API_ENDPOINTS.auth.signin.verify, attResp);
    };

    const signout = async function signout() {
        return await api<Api.Auth.Signout.Response, Api.Auth.Signout.Request>(API_ENDPOINTS.auth.signout);
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
