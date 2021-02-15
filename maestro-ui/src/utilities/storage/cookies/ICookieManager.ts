export default interface ICookieManager {
  getCookie(cname: string): string;
  setCookie(cname: string, cvalue: string, exdays: number): void;
}
