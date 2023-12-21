export type PublicKey = {
    /**
     * UUID of the public key
     */
	id: string;
    pubkey: string;
	attestation_data: string;
    cose_alg: number;
    sign_counter: number;

    /**
     * Foreign key to the user
     */
    user_id: string;
};

export class PublicKeys {
    private keys: PublicKey[] = [];

    insert(key: PublicKey) {
        this.keys.push(key);
    }

    getById(id: string) {
        return this.keys.find((key) => key.id === id);
    }

    getAllByUserId(user_id: string) {
        return this.keys.filter((key) => key.id === user_id);
    }
}
