import { NextApiRequest, NextApiResponse } from "next";
import { withIronSessionApiRoute } from 'iron-session/next';
import { getExpiresAt, login } from "../../lib/directus/transport";
import { getLogger } from "../../lib/log";
import { sessionOptions } from "../../lib/session";

const logger = getLogger("api/login");

type Data = {
    message: string;
};

async function loginRoute(req: NextApiRequest, res: NextApiResponse<Data>) {
    const { username, password } = await req.body;
    logger.debug(`POST username=${username} password=${password}`);

    try {
        const loginResult = await login(username, password);
        logger.debug(`await login returns: ${JSON.stringify(loginResult)}`);
        if (!loginResult.ok) {
            res.status(401).json({ message: loginResult.msg });
            return;
        }

        req.session.loginInfo = {
            access_token: loginResult.access_token,
            refresh_token: loginResult.refresh_token,
            expires: getExpiresAt(loginResult.expires),
        };
        await req.session.save();
        res.json({ message: loginResult.msg });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
}

export default withIronSessionApiRoute(loginRoute, sessionOptions);
