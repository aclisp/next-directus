import type {
    GetServerSidePropsContext,
    GetServerSidePropsResult,
} from "next";
import { getIronSession, IronSession, IronSessionOptions } from 'iron-session';
import { getAccessToken, LoginInfo, NeedLoginError } from './directus/transport';
import { IncomingMessage, ServerResponse } from "http";

export const sessionOptions: IronSessionOptions = {
    password: process.env.SECRET_COOKIE_PASSWORD as string,
    cookieName: '_session',
    // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
    },
};

// This is where we specify the typings of req.session.*
declare module 'iron-session' {
    interface IronSessionData {
        loginInfo?: LoginInfo;
    }
}

// Argument type based on the SSR context
type GetIronSessionSSROptions = (
    request: IncomingMessage,
    response: ServerResponse,
) => Promise<IronSessionOptions> | IronSessionOptions;

function getPropertyDescriptorForReqSession(
    session: IronSession,
): PropertyDescriptor {
    return {
        enumerable: true,
        get() {
            return session;
        },
        set(value) {
            const keys = Object.keys(value);
            const currentKeys = Object.keys(session);

            currentKeys.forEach((key) => {
                if (!keys.includes(key)) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore See comment in IronSessionData interface
                    delete session[key];
                }
            });

            keys.forEach((key) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore See comment in IronSessionData interface
                session[key] = value[key];
            });
        },
    };
}

/**
 * Refresh token automatically, redirect to `login` on error.
 */
export function withIronSessionSsr<
    P extends { [key: string]: unknown; } = { [key: string]: unknown; },
>(
    handler: (
        context: GetServerSidePropsContext,
    ) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>,
    options: IronSessionOptions | GetIronSessionSSROptions,
) {
    return async function nextGetServerSidePropsHandlerWrappedWithIronSession(
        context: GetServerSidePropsContext,
    ) {
        let sessionOptions: IronSessionOptions;

        // If options is a function, call it and assign the results back.
        if (options instanceof Function) {
            sessionOptions = await options(context.req, context.res);
        } else {
            sessionOptions = options;
        }

        const session = await getIronSession(
            context.req,
            context.res,
            sessionOptions,
        );

        try {
            await getAccessToken(session, () => {
                session.save();
            });
        } catch (error) {
            if (error instanceof NeedLoginError) {
                return redirectToLogin<P>(context.req);
            } else {
                throw error;
            }
        }

        Object.defineProperty(
            context.req,
            "session",
            getPropertyDescriptorForReqSession(session),
        );
        return handler(context);
    };
}

function redirectToLogin<P>(req: IncomingMessage): GetServerSidePropsResult<P> {
    let location = "/login";
    if (req.url) {
        location += "?redirect=" + encodeURIComponent(req.url);
    }
    return {
        redirect: {
            destination: location,
            permanent: false,
        }
    };
}
