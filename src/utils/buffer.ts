export function uintToString(uintArray) {
    const encodedString = String.fromCharCode.apply(null, uintArray), decodedString = decodeURIComponent(escape(encodedString));
    return decodedString;
}

export function base64ToUint8Array(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    // @ts-ignore
    return new Uint8Array(Array.prototype.map.call(atob(str), (c) => c.charCodeAt(0)));
}
export function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        // @ts-ignore
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
export function bufferToBase64Url(buffer) {
    const x = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return x.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
}
export function uint8ArrayToBase64(a) {
    const base64string = btoa(String.fromCharCode(...a));
    return base64string.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
export function ConvertPubKeyToLoginFormat(publicKey) {
    return {
        ...publicKey,
        allowCredentials: [],
        challenge: new TextEncoder().encode(publicKey.challenge),
    };

    // publicKey.allowCredentials[0].id = publicKey.allowCredentials[0].id.replace('=', '');
    // publicKey.allowCredentials[0].id = base64ToUint8Array(publicKey.allowCredentials[0].id);
    // publicKey.challenge = new TextEncoder().encode(publicKey.challenge);
    // return publicKey;
}
export function ConvertPubKeyToRegisterFormat(publicKey) {
    publicKey.challenge = new TextEncoder().encode(publicKey.challenge);
    publicKey.user.id = new TextEncoder().encode(publicKey.user.id);
    return publicKey;
}
