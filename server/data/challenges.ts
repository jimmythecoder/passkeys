export type Challenge = {
    session_type: string;
    challenge: string;
};

export class Challenges {
    private challenges: Challenge[] = [];

    insert(challenge: Challenge) {
        this.challenges.push(challenge);
    }

    getByChallenge(challenge: string) {
        return this.challenges.find((c) => c.challenge === challenge);
    }
}