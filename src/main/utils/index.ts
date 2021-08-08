const { createHmac } = await import("crypto");

const args = "app_id=123&access_token=abc";
const app_secret = "123456";
const sign = createHmac("sha1", app_secret)
  .update(args)
  .digest()
  .toString("base64");
console.log(sign);

function test(method: string, path: string, host: string, contentType: string) {
  let signingStr = `${method} ${path}`;
  signingStr += `\nHost: ${host}\nContent-Type: ${contentType}`;
}
