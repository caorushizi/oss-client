import { net } from "electron";
import { stringify } from "qs";

function request<T>(options: RequestOptions): Promise<RequestResponse<T>> {
  const { url, data, headers = {} } = options;

  return new Promise((resolve, reject) => {
    const request = net.request({
      url,
    });

    Object.entries(headers).forEach(([key, value]) => {
      request.setHeader(key, value);
    });

    if (data) {
      request.write(stringify(data));
    }

    request.on("response", (response) => {
      const resp: RequestResponse<T> = {
        statusCode: response.statusCode,
        headers: response.headers,
        data: {} as T,
      };

      resp.statusCode = response.statusCode;
      resp.headers = response.headers;

      let data = "";
      if (response.statusCode >= 200 && response.statusCode < 500) {
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          try {
            data = JSON.parse(data);
          } catch (e) {
            // empty
          }
          resp.data = data as any;
          resolve(resp);
        });
      } else {
        reject(new Error(`error code: ${response.statusCode}`));
      }
    });

    request.on("error", (err) => {
      reject(err);
    });

    request.end();
  });
}

export default request;
