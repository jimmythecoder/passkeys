export type UserModel = {
    id: string;
    userName: string;
    displayName: string;
    currentChallenge?: string;
    isVerified?: boolean;
};

export const users = [] as UserModel[];