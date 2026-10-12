import {handleAuthRequest, type RequestLike, type ResponseLike} from '../lib/cmsOAuth.js';

export default function handler(req: RequestLike, res: ResponseLike) {
  handleAuthRequest(req, res);
}
