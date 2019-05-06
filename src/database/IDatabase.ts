export default interface IDatabase {
    get<T>(...params: string[]): Promise<T>;
    set<T>(value: T, ...params: string[]): Promise<void>;
    delete(...params: string[]) : Promise<void>;
    list<T>(...prefix: string[]) : Promise<T[]>;
    addToStringSet(values : string[], column: string, ...pathParams: string[]) : Promise<void>;
    removeStringFromSet(values : string[], column: string, ...pathParams: string[]) : Promise<void>;
}