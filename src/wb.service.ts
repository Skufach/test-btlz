import * as cron from "node-cron";
import axios from "axios";
import { db } from "./config/knex/knexfile.js";
import { TarifByDay } from "#type.js";

function getCurrentDateISO() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function startWbJob() {
    cron.schedule("*/3 * * * * *", async function () {
        try {
            const currentDate = getCurrentDateISO();
            const res = await axios.get(`https://common-api.wildberries.ru/api/v1/tariffs/box?date=${currentDate}`, {
                headers: {
                    Authorization: `${process.env.WB_KEY}`,
                },
            });

            const data = res.data.response.data;
            await insertOrUpdate(data, currentDate);
        } catch {
            throw new Error("Ошибка при обращении к WB");
        }
    });
}

async function insertOrUpdate(record: TarifByDay, currentDate: string) {
    try {
        await db.transaction(async (trx) => {
            const { warehouseList, ...rest } = record;
            const tarif: Omit<TarifByDay, "warehouseList"> = rest;

            const res = await trx("tarifs")
                .insert({
                    date: currentDate,
                    dtNextBox: tarif.dtNextBox,
                    dtTillMax: tarif.dtTillMax,

                    updated_at: db.fn.now(),
                })
                .onConflict(["date"])
                .merge()
                .returning("id");

            const tarifId = res[0].id;
            await trx("warehouses").where({ tarifId }).delete();

            for (const warehouse of warehouseList) {
                await trx("warehouses").insert({
                    boxDeliveryAndStorageExpr: warehouse.boxDeliveryAndStorageExpr,
                    boxDeliveryBase: warehouse.boxDeliveryBase,
                    boxDeliveryLiter: warehouse.boxDeliveryLiter,
                    boxStorageBase: warehouse.boxStorageBase,
                    boxStorageLiter: warehouse.boxStorageLiter,
                    warehouseName: warehouse.warehouseName,
                    tarifId,
                });
            }
        });
    } catch (e) {
        console.error(e);
    }
}

export async function getTarif(): Promise<TarifByDay> {
    try {
        return await db("tarifs")
            .first("tarifs.date as date", "tarifs.dtNextBox as dtNextBox", "tarifs.dtTillMax as dtTillMax", db.raw("json_agg(warehouses) as warehouses"))
            .where({ date: getCurrentDateISO() })
            .leftJoin("warehouses", "tarifs.id", "warehouses.tarifId")
            .groupBy("tarifs.id");
    } catch (e) {
        console.error(e);
    }
}
