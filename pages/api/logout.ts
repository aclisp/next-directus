import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

type Data = Record<string, never>;

function logoutRoute(req: NextApiRequest, res: NextApiResponse<Data>) {
    req.session.destroy();
    res.json({});
}

export default withIronSessionApiRoute(logoutRoute, sessionOptions);
