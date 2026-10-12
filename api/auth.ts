import {handleAuthRequest, type RequestLike, type ResponseLike} from '../lib/cmsOAuth';

export default function handler(req: RequestLike, res: ResponseLike) {
  handleAuthRequest(req, res);
}
