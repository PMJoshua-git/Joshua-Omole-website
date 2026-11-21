import { handleSaveContactRequest } from '../server/leads/handlers.js';

export default async function handler(req, res) {
  return handleSaveContactRequest(req, res);
}
