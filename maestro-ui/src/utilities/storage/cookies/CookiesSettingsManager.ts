import ICookieManager from "./ICookieManager";

export default class CookieSettingsManager implements ICookieManager {

  get(name: string): string {
    return this.getCookie(name);
  }

  set(name: string, value: string): void {
    this.setCookie(name, value, 1000);
  }

  getCookie(cname: string): string {
    if (localStorage) {
      const item = localStorage.getItem(`cookie-${cname}`);
      if (item) {
        try {
          const { value, expires, } = JSON.parse(item);
          if (expires && expires >= (new Date().getTime())) {
            return value;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    if (document.cookie === "") {
      const cookie = (localStorage && localStorage.getItem("cookie"));
      if (cookie) {
        document.cookie = cookie;
      }
    }
    var name = cname + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i].trim();
      if (c.indexOf(name) == 0) {
        var value = c.substring(name.length, c.length);
        if (value == "null") {
          return "";
        }
        return value;
      }
    }
    return "";
  }

  setCookie(cname: string, cvalue: string, exdays: number): void {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
    if (localStorage) {
      localStorage.setItem(`cookie-${cname}`, JSON.stringify({ expires: d.getTime(), value: cvalue, }));
    }
  }
}
