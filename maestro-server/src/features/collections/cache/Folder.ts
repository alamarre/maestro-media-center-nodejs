export default class Folder {
  files: { [key: string]: string };
  folders: { [key: string]: Folder };
}
