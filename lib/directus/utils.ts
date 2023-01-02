import { DIRECTUS_HOST } from "./transport";

export function getFileLink(fileId: string, accessToken?: string) {
    let link = DIRECTUS_HOST + "/assets/" + fileId;
    if (accessToken) {
        link += "?access_token=" + accessToken;
    }
    return link;
}
