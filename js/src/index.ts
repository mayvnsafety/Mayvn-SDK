import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { type AwaitedAwaitableMayvnResponse, type MayvnClientInitOptions } from "./shared";
import { UserAPIs } from "./dashboard";

export class AwaitableMayvnResponse<T> {
    protected request: Promise<AxiosResponse>;
    protected errorOnList: ((x: AwaitedAwaitableMayvnResponse<T>) => boolean | Promise<boolean>)[];
    protected postProcessFn: (data?: any) => Promise<T | undefined>;
    
    constructor (req_type: "GET", url: string, data?: any, config?: AxiosRequestConfig) {
        this.request = axios({
            url: url,
            method: req_type,
            data: data,
            ...config
        });
        this.errorOnList = [];
        this.postProcessFn = async (data?: T) => data;
    }

    errorOn(fn: (x: AwaitedAwaitableMayvnResponse<T>) => boolean | Promise<boolean>): AwaitableMayvnResponse<T> {
        this.errorOnList.push(fn);
        return this;
    }

    postProcess(fn: typeof this.postProcessFn): AwaitableMayvnResponse<T> {
        this.postProcessFn = fn;
        return this;
    }

    then(resolve: (data: AwaitedAwaitableMayvnResponse<T>) => void, reject: (err: AwaitedAwaitableMayvnResponse<T>) => void) {
        return this.request.then(async (value) => {
            for (const validationFn of this.errorOnList) {
                let p = validationFn({
                    body: value.data,
                    headers: value.headers,
                    status: value.status,
                    errorReason: ""
                });
                if (p != null && typeof p === "object" && typeof p.then === "function") {
                    p = await p;
                }
                let has_failed: boolean = p as boolean;
                if (has_failed) {
                    reject({
                        body: value.data,
                        status: value.status,
                        headers: value.headers,
                        errorReason: "Failed Validation"
                    });
                    return;
                }
            }

            const new_data = await this.postProcessFn(value.data);

            resolve({
                body: new_data,
                headers: value.headers,
                status: value.status,
                errorReason: ""
            });

        }).catch((reason: AxiosError) => {
            console.error(reason);
            reject({
                body: reason.response?.data,
                status: reason.response?.status,
                headers: reason.response?.headers,
                errorReason: "Unknown"
            } as AwaitedAwaitableMayvnResponse<T>);
        });
    }
}

export const RobloxGroupReason = {
    Condo_ERP: "Condro/ERP",
    SexualClothing_SexualUGC: "Sexual Clothing/UGC",
    Fetish: "Fetish",
    Ageplay: "Ageplay"
} as const;

export interface RobloxGroupsQueryRequest<getDates extends boolean> {
    getDates: getDates,
    user_id: string
}

export interface RobloxGroupsQueryResponse<getDates extends boolean> {
    success: boolean,
    id: string,
    groups: ({
        groupId: string,
        leftGroup: boolean,
        reasons: (typeof RobloxGroupReason[keyof typeof RobloxGroupReason])[],
    } & (getDates extends true ? { firstSeen: string, lastSeen: string } : {}))[]
}

class RobloxAPIs {
    protected api_key: string;
    protected mayvn_url: string;
    
    constructor ({ api_key, mayvn_url }: MayvnClientInitOptions) {
        this.api_key = api_key;
        this.mayvn_url = mayvn_url;
    }

    getGroups<getDates extends boolean = true>(query: RobloxGroupsQueryRequest<getDates>): AwaitableMayvnResponse<RobloxGroupsQueryResponse<getDates>> {
        return new AwaitableMayvnResponse<RobloxGroupsQueryResponse<getDates>>("GET", `${this.mayvn_url}/api/v1/roblox/user/${query.user_id}/groups?getDates=${query.getDates}`, {}, {
            headers: {
                "api-key": this.api_key
            }
        }).errorOn((x) => x.body!["success"] === false)
        .postProcess(async (data) => {
            if (!data) return data;

            for (let i = 0; i < data.groups.length; i++) {
                const group = data.groups[i];

                if (!group)
                    break;

                for (let reason_i = 0; reason_i < group.reasons.length; reason_i++) {
                    const reason = group.reasons[reason_i];

                    switch (reason) {
                        case 1:
                            group.reasons[reason_i] = RobloxGroupReason.Condo_ERP;
                            break;
                        case 2:
                            group.reasons[reason_i] = RobloxGroupReason.SexualClothing_SexualUGC;
                            break;
                        case 3:
                            group.reasons[reason_i] = RobloxGroupReason.Fetish;
                            break;
                        case 4:
                            group.reasons[reason_i] = RobloxGroupReason.Ageplay;
                            break;
                    }
                }

                data.groups[i] = group;
            }

            return data;
        });
    }
}

class DashboardAPIs {
    protected api_key: string;
    protected mayvn_url: string;
    public user: UserAPIs;

    constructor ({ api_key, mayvn_url }: MayvnClientInitOptions) {
        this.api_key = api_key;
        this.mayvn_url = mayvn_url;
        this.user = new UserAPIs({ api_key, mayvn_url });
    }
}

export class MayvnClient {
    protected api_key: string;
    protected mayvn_url: string;
    public roblox: RobloxAPIs;
    public dashboard: DashboardAPIs;

    constructor ({ api_key, mayvn_url }: MayvnClientInitOptions) {
        this.api_key = api_key;
        this.mayvn_url = mayvn_url;

        this.roblox = new RobloxAPIs({ api_key, mayvn_url });
        this.dashboard = new DashboardAPIs({ api_key, mayvn_url });
    }
}
