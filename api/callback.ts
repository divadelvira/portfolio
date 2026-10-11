import {handleCallbackRequest, type RequestLike, type ResponseLike} from '../lib/cmsOAuth';

export default async function handler(req: RequestLike, res: ResponseLike) {
  await handleCallbackRequest(req, res);
}
