import IDatabase from "../database/IDatabase";
import SimpleValue from "../models/SimpleValue";

export default class CategoryRestriction {
    constructor(private userDb: IDatabase, private categoryDb: IDatabase) {}

    async getFilteredList(list: any, user, profile) : Promise<any> {
        const categories = await this.getProfileCategories(user, profile);
        if(categories.length === 0) {
            return list;
        }
        const whitelist : any = {};
        for(let category of categories) {
            const categoryWhitelist = await this.categoryDb.get("category_whitelist", category);
            Object.assign(whitelist, categoryWhitelist);
        }

        const result = {files:{}, 
            folders: {
                "Movies":{folders:{}, files:{}}, 
                "TV Shows": {folders:{}, files:{}},
                "Movie Collections": {folders: {}, files: []}
            }
        };
        for(let movieName of Object.keys(whitelist.folders["Movies"].files)) {
            result.folders["Movies"].files[movieName] = "";
        }

        for(let tvShow of Object.keys(whitelist.folders["TV Shows"].folders)) {
            result.folders["TV Shows"].folders[tvShow] = list.folders["TV Shows"].folders[tvShow];
        }
        return result;
    }

    async getProfileCategories(user: string, profile: string) : Promise<string[]> {
        const values = await this.userDb.list<SimpleValue>("user_data", user, profile, "profile_categories");
        return values.map(v => v.value);
    }
}