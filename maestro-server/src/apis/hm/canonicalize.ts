import { URL } from "url";

const canonicalRoot = process.env.API_ROOT || "http://localhost:8777";
export default (url: string): string => {
  return new URL(url, canonicalRoot).href;
}
