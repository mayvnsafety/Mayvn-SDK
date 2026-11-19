export interface MayvnClientInitOptions {
    api_key: string,
    mayvn_url: string
}

export type AwaitedAwaitableMayvnResponse<T> = {
    body: T | undefined,
    headers: object,
    status: number,
    errorReason: "Unknown" | "Failed Validation" | ""
}