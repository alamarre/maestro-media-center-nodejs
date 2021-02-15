import "reflect-metadata";
import { container, InjectionToken } from "tsyringe";
import IQueryStringReader from "../utilities/http/IQueryStringReader";
import QueryStringReader from "../utilities/http/QueryStringReader";

import CookieSettingsManager from "../utilities/storage/cookies/CookiesSettingsManager";
import ICookieManager from "../utilities/storage/cookies/ICookieManager";

container.registerSingleton<ICookieManager>("ICookieManager", CookieSettingsManager);
container.registerSingleton<IQueryStringReader>("IQueryStringReader", QueryStringReader);

export function Inject(token: InjectionToken) {
    return (target: Object, propertyKey: string) => {
        target[propertyKey] = container.resolve(token);
    }
}

export function resolve<T> (token: InjectionToken) : T {
    return container.resolve<T>(token);
} 
