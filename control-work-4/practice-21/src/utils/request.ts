import type { AuthRequest } from '../middlewares/index.js';

export const getIdFromReq = (req: AuthRequest) =>
    typeof req.params.id === 'object' ? req.params.id[0] : req.params.id;
