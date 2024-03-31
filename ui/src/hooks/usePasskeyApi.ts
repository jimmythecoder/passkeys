import { useApi } from "./useApi";
import { API_PREFIX, API_ENDPOINTS } from "@/config";
import type { Auth } from "@/types/api";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";

export const usePasskeyApi = () => {
    const api = useApi(API_PREFIX, "POST");

    const getCredentials = async function getCredentials(displayName: string, userName: string, authenticatorName: string) {
        return await api<Auth.Register.GetCredentials.Response, Auth.Register.GetCredentials.Request>(API_ENDPOINTS.auth.register.getCredentials, {
            displayName,
            userName,
            authenticatorName,
        });
    };

    const verify = async function verify(attResp: RegistrationResponseJSON) {
        return await api<Auth.Register.Verify.Response, Auth.Register.Verify.Request>(API_ENDPOINTS.auth.register.verify, attResp);
    };

    return {
        getCredentials,
        verify,
    };
};

export default usePasskeyApi;
