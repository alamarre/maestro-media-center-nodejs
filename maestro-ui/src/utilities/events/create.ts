export function fireEvent<T>(name: string, detail: T) {

    const event = new CustomEvent(name, { detail });
    document.dispatchEvent(event);
}