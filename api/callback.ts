import {handleCallbackRequest, type RequestLike, type ResponseLike} from '../lib/cmsOAuth.js';

export default async function handler(req: RequestLike, res: ResponseLike) {
  await handleCallbackRequest(req, res);
}
