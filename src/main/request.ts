import { net } from "electron";
import { stringify } from "qs";

const request = (options: RequestOptions): Promise<any> => {
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
      let result = "";

      if (response.statusCode >= 200 && response.statusCode < 500) {
        response.on("data", (chunk) => {
          result += chunk;
        });
        response.on("end", () => {
          try {
            result = JSON.parse(result);
          } catch (e) {
            // empty
          }
          resolve(result);
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
};

export default request;
