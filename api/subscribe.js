import { handleSubscribeRequest } from '../server/leads/handlers.js';

export default async function handler(req, res) {
  return handleSubscribeRequest(req, res);
}
