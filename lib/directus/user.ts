import { IronSessionData } from "iron-session";
import { httpGet } from "./transport";

export interface UserInfo {
    first_name: string;
    last_name: string;
    avatar: string;
}

export async function getCurrentUserInfo(
    session: IronSessionData,
): Promise<UserInfo> {
    const params = new URLSearchParams();
    params.append("fields[]", "first_name");
    params.append("fields[]", "last_name");
    params.append("fields[]", "avatar");
    return await httpGet<UserInfo>("/users/me", { params, session });
}
