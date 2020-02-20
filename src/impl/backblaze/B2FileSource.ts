import IDatabase from '../../database/IDatabase';
import B2BucketInfo from '../../models/B2BucketInfo';

import fetch from "node-fetch";
import SimpleValue from '../../models/SimpleValue';

const baseAuthorizationUrl = 'https://api.backblazeb2.com/b2api/v2/b2_authorize_account';
const b2GetDownloadAuthApi = '/b2api/v2/b2_get_download_authorization';
const b2UploadPartApi = '/b2api/v1/b2_get_upload_part_url';
const b2UploadApi = '/b2api/v1/b2_get_upload_url';
const b2StartLargeFile = '/b2api/v2/b2_start_large_file';
const b2FinishLargeFile = '/b2api/v2/b2_finish_large_file';

const EXPIRATION_TIME = 7 * 24 * 60 * 60;

const BASE_B2_VIDEO_URL = process.env.BASE_B2_VIDEO_URL;

function toBase64(value: string) {
  return Buffer.from(value).toString("base64");
}

export default class B2FileSource {
  constructor(private db: IDatabase) {

  }

  async getSignedUrl(bucket: string, file: string, token: string): Promise<string> {
    return `${BASE_B2_VIDEO_URL}/${bucket}/${file}?access_token=${token}`;
  }

  async getBuckets(): Promise<any> {
    const bucketsInfo = await this.db.list<any>("file_hosts");
    return bucketsInfo.filter(b => b.type == "backblaze");
  }

  async getAuthorization(bucket: string): Promise<any> {
    const bucketInfo = await this.db.get<B2BucketInfo>("file_hosts", bucket);
    if (bucketInfo == null) {
      return null;
    }

    let authDetails: any = await this.db.get("b2_access_token", bucket);
    if (authDetails == null || authDetails.expires < Date.now()) {
      const headers = {
        Authorization: 'Basic ' + toBase64(`${bucketInfo.keyId}:${bucketInfo.applicationKey}`)
      };
      const result = await fetch(baseAuthorizationUrl, {
        headers
      });
      authDetails = await result.json();
      authDetails["expires"] = Math.floor(Date.now() / 1000) + EXPIRATION_TIME;
      await this.db.set(authDetails, "b2_access_token", bucket)
    }
    return { authDetails, bucketInfo };
  }

  async startBigFile(bucket: string, fileName: string): Promise<any> {
    const bucketInfo = await this.db.get<B2BucketInfo>("file_hosts", bucket);
    if (bucketInfo == null) {
      return null;
    }

    let authDetails: any = await this.db.get("b2_access_token", bucket);
    if (authDetails == null || authDetails.expires < Date.now()) {
      const headers = {
        Authorization: 'Basic ' + toBase64(`${bucketInfo.keyId}:${bucketInfo.applicationKey}`)
      };
      const result = await fetch(baseAuthorizationUrl, {
        headers
      });
      authDetails = await result.json();
      authDetails["expires"] = Math.floor(Date.now() / 1000) + EXPIRATION_TIME;
      await this.db.set(authDetails, "b2_access_token", bucket)
    }
    const { authorizationToken, apiUrl } = authDetails;

    const result = await fetch(`${apiUrl}${b2StartLargeFile}`, {
      method: "POST",
      headers: {
        Authorization: authorizationToken
      },
      body: JSON.stringify({
        'bucketId': bucketInfo.bucketId,
        fileName,
        contentType: "video/mp4"
      })
    });

    const response = await result.json();
    return Object.assign({ authorizationToken, apiUrl }, response);
  }

  async getUploadUrl(bucket: string): Promise<any> {

    const bucketInfo = await this.db.get<B2BucketInfo>("file_hosts", bucket);
    if (bucketInfo == null) {
      return null;
    }

    let authDetails: any = await this.db.get("b2_access_token", bucket);
    if (authDetails == null || authDetails.expires < Date.now()) {
      const headers = {
        Authorization: 'Basic ' + toBase64(`${bucketInfo.keyId}:${bucketInfo.applicationKey}`)
      };
      const result = await fetch(baseAuthorizationUrl, {
        headers
      });
      authDetails = await result.json();
      authDetails["expires"] = Math.floor(Date.now() / 1000) + EXPIRATION_TIME;
      await this.db.set(authDetails, "b2_access_token", bucket)
    }
    const { authorizationToken, apiUrl } = authDetails;

    const result = await fetch(`${apiUrl}${b2UploadApi}`, {
      method: "POST",
      headers: {
        Authorization: authorizationToken
      },
      body: JSON.stringify({
        bucketId: bucketInfo.bucketId
      })
    });

    const response = await result.json();
    return response;
  }

  async getUploadPart(apiUrl: string, authorizationToken: string, fileId: string): Promise<any> {

    const result = await fetch(`${apiUrl}${b2UploadPartApi}`, {
      method: "POST",
      headers: {
        Authorization: authorizationToken
      },
      body: JSON.stringify({
        fileId
      })
    });

    const response = await result.json();
    return response;
  }

  async finishUpload(apiUrl: string, authorizationToken: string, fileId: string, shas: string[]): Promise<any> {

    const result = await fetch(`${apiUrl}${b2FinishLargeFile}`, {
      method: "POST",
      headers: {
        Authorization: authorizationToken
      },
      body: JSON.stringify({
        fileId,
        partSha1Array: shas
      })
    });

    const response = await result.json();
    return response;
  }

  async getInfoForUrl(bucket: string, file: string): Promise<any> {
    const bucketInfo = await this.db.get<B2BucketInfo>("file_hosts", bucket);
    if (bucketInfo == null) {
      return null;
    }

    let authDetails: any = await this.db.get("b2_access_token", bucket);
    if (authDetails == null || authDetails.expires < Date.now()) {
      const headers = {
        Authorization: 'Basic ' + toBase64(`${bucketInfo.keyId}:${bucketInfo.applicationKey}`)
      };
      const result = await fetch(baseAuthorizationUrl, {
        headers
      });
      authDetails = await result.json();
      authDetails["expires"] = Math.floor(Date.now() / 1000) + EXPIRATION_TIME;
      await this.db.set(authDetails, "b2_access_token", bucket)
    }
    const { authorizationToken, apiUrl } = authDetails;
    let downloadDetails = await this.db.get("b2_download_token", bucket);
    if (downloadDetails == null || downloadDetails["expires"] < Date.now()) {
      const result = await fetch(`${apiUrl}${b2GetDownloadAuthApi}`, {
        method: "POST",
        headers: {
          Authorization: authorizationToken
        },
        body: JSON.stringify({
          'bucketId': bucketInfo.bucketId,
          'fileNamePrefix': "",
          'validDurationInSeconds': EXPIRATION_TIME
        })
      });
      downloadDetails = await result.json();
      downloadDetails["expires"] = Math.floor(Date.now() / 1000) + EXPIRATION_TIME;
      await this.db.set(downloadDetails, "b2_download_token", bucket)
    }
    const url = `${bucketInfo.downloadUrl}/${file}`;
    const downloadToken = downloadDetails["authorizationToken"];

    return { url, downloadToken };
  }
}
