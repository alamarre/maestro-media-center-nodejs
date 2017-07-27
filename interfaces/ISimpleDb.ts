interface ISimpleDb {
	get<T>(...path: string[]) : T | null;
	set<T>(value: T, ...path: string[]): void;
	list<T>(...prefix: string[]) : T[];
}

export default ISimpleDb;
