import { IronSessionData } from "iron-session";
import { getLogger } from "../log";

const logger = getLogger("directus/transport");
export const DIRECTUS_HOST = "http://127.0.0.1:8055";

export interface LoginInfo {
    access_token: string;
    expires: number;
    refresh_token: string;
}

export interface Result {
    ok: boolean;
    msg: string;
}

export interface TransportOptions {
    noAuthorizationHeader?: boolean;
    /** Skip refreshing the access token if it is null. */
    accessToken?: string | null;
    /** Global query parameters */
    params?: URLSearchParams;
    session?: IronSessionData;
}

export type LoginResult = LoginInfo & Result;

export async function httpPost<T>(
    path: string,
    data: Record<string, unknown>,
    options: TransportOptions = {},
): Promise<T & Result> {
    const {
        noAuthorizationHeader = false,
        params,
        session,
    } = options;
    let { accessToken } = options;
    logger.debug(`POST ${path}`);

    if (accessToken === undefined && session) {
        accessToken = await getAccessToken(session);
    }
    const headers = new Headers({
        "Content-Type": "application/json",
    });
    if (!noAuthorizationHeader) {
        if (!accessToken) {
            throw new Error(`missing access token: ${accessToken}`);
        }
        headers.set("Authorization", `Bearer ${accessToken}`);
    }
    let url = DIRECTUS_HOST + path;
    if (params) {
        url += "?" + params;
    }
    const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        return failure<T>(res);
    }
    return success<T>(res);
}

function failure<T>(res: Response): T & Result {
    return {
        ok: false,
        msg: `${res.status} ${res.statusText}`,
    } as T & Result;
}

async function success<T>(res: Response): Promise<T & Result> {
    const json = await res.json();
    return {
        ok: true,
        msg: `${res.status} ${res.statusText}`,
        ...json.data,
    };
}

export async function httpGet<T>(
    path: string,
    options: TransportOptions = {},
): Promise<T & Result> {
    const {
        noAuthorizationHeader = false,
        params,
        session,
    } = options;
    let { accessToken } = options;
    logger.debug(`GET ${path}`);

    if (accessToken === undefined && session) {
        accessToken = await getAccessToken(session);
    }
    const headers = new Headers();
    if (!noAuthorizationHeader) {
        if (!accessToken) {
            throw new Error(`missing access token: ${accessToken}`);
        }
        headers.set("Authorization", `Bearer ${accessToken}`);
    }
    let url = DIRECTUS_HOST + path;
    if (params) {
        url += "?" + params;
    }
    const res = await fetch(url, {
        method: "GET",
        headers,
    });
    if (!res.ok) {
        return failure<T>(res);
    }
    return success<T>(res);
}

export class NeedLoginError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NeedLoginError";
    }
}

export async function getAccessToken(
    session: IronSessionData,
    onRefresh?: (loginInfo: LoginInfo) => void,
): Promise<string> {
    const loginInfo = session.loginInfo;
    if (!loginInfo) {
        throw new NeedLoginError("never login");
    }
    const expiresAt = loginInfo.expires;
    if (+expiresAt < Date.now() + 30000) {
        const refreshToken = loginInfo.refresh_token;
        const loginResult = await refresh(refreshToken);
        if (loginResult.ok) {
            loginInfo.access_token = loginResult.access_token;
            loginInfo.expires = getExpiresAt(loginResult.expires);
            loginInfo.refresh_token = loginResult.refresh_token;
            if (onRefresh) {
                onRefresh(loginInfo);
            }
        } else {
            throw new NeedLoginError("refresh failure");
        }
    }
    return loginInfo.access_token;
}

export function getExpiresAt(expires: number) {
    return Date.now() + expires;
}

async function refresh(refreshToken: string): Promise<LoginResult> {
    return await httpPost<LoginResult>("/auth/refresh", {
        refresh_token: refreshToken,
        mode: "json",
    }, {
        noAuthorizationHeader: true,
        accessToken: null,
    });
}

export async function login(
    email: string,
    password: string,
): Promise<LoginResult> {
    return await httpPost<LoginResult>("/auth/login", {
        email: email,
        password: password,
    }, {
        noAuthorizationHeader: true,
        accessToken: null,
    });
}
