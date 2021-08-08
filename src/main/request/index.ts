import { net } from "electron";

const request = (
  url: string,
  headers: Record<string, string>
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const request = await net.request(url);
    Object.keys(headers).forEach((header) =>
      request.setHeader(header, headers[header])
    );
    request.on("response", (response) => {
      let data: string;
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        let result: string;
        try {
          result = JSON.stringify(data);
        } catch (e) {
          result = data;
        }
        resolve(result);
      });
    });
    request.on("error", (err) => {
      reject(err);
    });
    request.end();
  });
};

export default request;
