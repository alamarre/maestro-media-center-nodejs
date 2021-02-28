export default interface IQueryStringReader {
  getParameter(name: string): string;
  getParameterFromUrl(url: string, name: string): string;
}
