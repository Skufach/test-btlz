import http from "http";
import * as cron from "node-cron";
import axios from "axios";

function getCurrentDateISO() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function startJob() {
    cron.schedule("*/3 * * * * *", async function () {
        try {
            const res = await axios.get(`https://common-api.wildberries.ru/api/v1/tariffs/box?date=${getCurrentDateISO()}`, {
                headers: {
                    Authorization: `${process.env.WB_KEY}`,
                },
            });

            const data = res.data.response.data;
            console.log("rees", data);
        } catch {
            throw new Error("Ошибка при обращении к WB");
        }
    });
}
