import { MayvnClient } from "./src";

const client = new MayvnClient({ api_key: "d", mayvn_url: "http://localhost:3000" });

const groups = await client.roblox.getGroups({ getDates: true, user_id: "1" });

console.log(groups.body);
