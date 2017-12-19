// 外から提供される
declare module "config" {
    interface Firebase {
        apiKey: string,
        authDomain: string,
        databaseURL: string,
        projectId: string,
        storageBucket: string,
        messagingSenderId: string
    }


    export const firebase: Firebase;
}
