export type UserType = {
    id: string;
    name: string;
    displayName: string;
    username: string;
};

export class User implements UserType {
    constructor(public id: string, public name: string, public displayName: string, public username: string) {}

    encode() {
        return {
            id: new TextEncoder().encode(this.id),
            name: this.name,
            displayName: this.displayName,
            username: this.username,
        };
    }
}

export class Users {
    private users: User[] = [];

    insert(user: Omit<UserType, "id">): User {
        const id = crypto.randomUUID();
        const newUser = new User(id, user.name, user.displayName, user.username);
        this.users.push(newUser);

        return newUser;
    }

    getById(id: string) {
        return this.users.find((user) => user.id === id);
    }

    getByUsername(username: string) {
        return this.users.find((user) => user.username === username);
    }
}
