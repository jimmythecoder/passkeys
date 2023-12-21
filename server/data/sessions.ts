export type Session = {
    id: string;
    user_id: string;
};

export class Sessions {
    private sessions: Session[] = [];

    insert(session: Session) {
        this.sessions.push(session);
    }

    getById(id: string) {
        return this.sessions.find((session) => session.id === id);
    }

    deleteById(id: string) {
        const index = this.sessions.findIndex((session) => session.id === id);
        this.sessions.splice(index, 1);
    }

    getByUserId(user_id: string) {
        return this.sessions.find((session) => session.user_id === user_id);
    }
}