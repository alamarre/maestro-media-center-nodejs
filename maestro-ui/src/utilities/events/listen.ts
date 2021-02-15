export function bindAttributeToEvent<T>(name: string, target: Object, propertyName: string) {
    document.addEventListener(name, (event) => {
        target[propertyName] = event["detail"];
    })
}