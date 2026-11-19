import { AwaitableMayvnResponse } from ".";
import type { MayvnClientInitOptions } from "./shared";

interface GetCurrentUserResponse {
    success: boolean,
    roblox: {
        id: bigint
    },
    discord: {
        id: bigint
    },
    access: {
        bot: boolean,
        extension: boolean,
        api: boolean,
        maxKeys: number
    },
    permissions: ("Manage Appeals" | "Manage Applications" | "Manage API Keys" | "Manage Access")[]
}

export class UserAPIs {
    protected api_key: string;
    protected mayvn_url: string;
    
    constructor ({ api_key, mayvn_url }: MayvnClientInitOptions) {
        this.api_key = api_key;
        this.mayvn_url = mayvn_url;
    }

    getCurrentUser(more_headers: Record<string, unknown>): AwaitableMayvnResponse<GetCurrentUserResponse> {
        return new AwaitableMayvnResponse<GetCurrentUserResponse>("GET", `${this.mayvn_url}/api/dashboard/user`, {}, {
            withCredentials: true,
            headers: more_headers as any
        }).errorOn((x) => x.body!["success"] === false)
        .postProcess(async (data) => {
            data.roblox.id = BigInt(data.roblox.id);
            data.discord.id = BigInt(data.discord.id);
            return data;
        });
    }
};
