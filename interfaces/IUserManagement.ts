interface IUserManagement {
    getUsername(userToken: string) : string | null;

    createAuthToken(username: string) : string;
}

export default IUserManagement;