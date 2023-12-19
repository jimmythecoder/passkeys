import { bufferToBase64Url, ConvertPubKeyToLoginFormat, ConvertPubKeyToRegisterFormat } from "./buffer";

export async function fido2Get(key, username) {

    const publicKey = ConvertPubKeyToLoginFormat(key);
    const credential = await navigator.credentials.get({ publicKey });
    const { authenticatorData, clientDataJSON, signature } = credential.response;
    return {
        username,
        data: {
            rawId: bufferToBase64Url(credential.rawId),
            type: credential.type,
            id: credential.id,
            response: {
                signature: bufferToBase64Url(signature),
                authenticatorData: bufferToBase64Url(authenticatorData),
                clientDataJSON: bufferToBase64Url(clientDataJSON)
            }
        },
    };
}

export async function fido2Create(key, username) {

    const publicKey = ConvertPubKeyToRegisterFormat(key);
    const credential = await navigator.credentials.create({ publicKey });
    const { attestationObject, clientDataJSON } = credential.response;
    return {
        username,
        data: {
            rawId: bufferToBase64Url(credential.rawId),
            type: credential.type,
            id: credential.id,
            response: {
                attestationObject: bufferToBase64Url(attestationObject),
                clientDataJSON: bufferToBase64Url(clientDataJSON)
            }
        }
    };
}
