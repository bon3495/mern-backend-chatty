import Joi, { ObjectSchema } from 'joi';

const loginSchema: ObjectSchema = Joi.object().keys({
  username: Joi.string().required().min(4).max(8).messages({
    'string.base': 'Username must be of type string',
    'string.min': 'Invalid username',
    'string.max': 'Invalid username',
    'string.empty': 'Username is a required field',
  }),
  password: Joi.string().required().min(4).max(8).messages({
    'string.base': 'Password must be of type string',
    'string.min': 'Invalid password',
    'string.max': 'Invalid password',
    'string.empty': 'Password is a required field',
  }),
});

export { loginSchema };
// {"threads":[{"position":311,"start":0,"end":310,"connection":"closed"},{"position":311,"start":311,"end":620,"connection":"open"}],"url":"https://att-c.udemycdn.com/2022-09-02_20-01-25-85f3166a15ce018e4fb46e1ff09381d9/original.ts?response-content-disposition=attachment%3B+filename%3Dsignin.ts&Expires=1662719847&Signature=E~RDnv4VrV7bGj9jwgnjbKii~L68T4eOz8a9Ze2F6nb1XsWDgk3N6~ApL8fagOC7wV8F8HOljyUotrqtiqjtWYiqng4NSR9guNGCwZvhRE0pky9aRs5GQVZjAIk8PemM672ropuN2NpV2UiVRCQnB9zMXBBvz2N2aT8OphKO5-tOlMlMGqMP5Vw8Y4rAwMOpHJSQJ-0asxdDuc6Gx8gJZcUSFS0oMKQ97mJvt2O4an2MBHazquD1KxbpiROjuMeASSlGhTw-LfqRSAk4BRw9C8pzmgE8P3P56TeS6xjBtQWz4Vrxpw8Mjnyu6-Q8Q-Li~K4dXzlkFeibbgdLSWLoYg__&Key-Pair-Id=APKAITJV77WS5ZT7262A","method":"GET","port":443,"downloadSize":620,"headers":{"content-type":"binary/octet-stream","content-length":"620","connection":"close","date":"Fri, 09 Sep 2022 06:08:15 GMT","last-modified":"Fri, 02 Sep 2022 20:01:26 GMT","etag":"\"39fb1daf91e85e26035f2a964902dc79\"","x-amz-server-side-encryption":"AES256","x-amz-meta-qqfilename":"signin.ts","x-amz-version-id":"72PD2jjfxkjim24VdEuyKetNSl_D1eQC","content-disposition":"attachment; filename=signin.ts","accept-ranges":"bytes","server":"AmazonS3","x-cache":"Miss from cloudfront","via":"1.1 b75b06741e5146585057681bd60737b2.cloudfront.net (CloudFront)","x-amz-cf-pop":"AMS1-C1","x-amz-cf-id":"-psra5ORPqHquNa6poLyVe08LMXpkYhRI5AwRC7T-z2LtXnn-rBI8w=="}}
