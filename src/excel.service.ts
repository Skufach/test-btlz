import * as cron from "node-cron";
import { google } from "googleapis";
import { getTarif } from "#wb.service.js";
import { TarifByDay, Warehouse } from "#type.js";

let authClient = null;
const listName = `${process.env.EXCEL_TARIF_LIST}`;

export async function getAuthClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: "OAuth.json",
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    authClient = await auth.getClient();

    if (!authClient) {
        throw new Error("Проблема с авторизацией");
    }
}

const spreadsheetId = `${process.env.TABLE_ID}`;
const range = "Sheet1!A1:D10";

async function setSheetData() {
    const service = google.sheets({ version: "v4", auth: authClient });
    const spreadsheetId = "1tSY0HGvFWndwvQBLyGF1LXYPF7KKu1bJl2uaNeCV9jg";

    const res = await service.spreadsheets.get({ spreadsheetId });
    const sheets = res.data.sheets;

    const isExistTarifList = checkTarifList(sheets);

    if (!isExistTarifList) {
        console.log("Создаём новый лист");
        await createTarifList(service);
    }

    const { warehouses, ...tarif } = await getTarif();

    await setHeader(service, spreadsheetId, tarif);

    await setBody(service, spreadsheetId, warehouses);
}

export function startExcelJob() {
    cron.schedule("*/10 * * * * *", async function () {
        try {
            await setSheetData();
        } catch (e) {
            throw new Error(e);
        }
    });
}

// проверка существования страницы с нужным названием
function checkTarifList(sheets) {
    for (const sheet of sheets) {
        if (sheet.properties.title === listName) {
            return true;
        }
    }

    return false;
}

// создание нового листа
async function createTarifList(service) {
    try {
        console.log("createTarifList START");

        const addSheet = {
            "addSheet": {
                properties: {
                    title: listName,
                },
            },
        };

        const res = await service.spreadsheets.batchUpdate({ spreadsheetId: `${process.env.TABLE_ID}`, resource: { requests: [addSheet] } });
        console.log("createTarifList SUCCESS", res.data);
    } catch (e) {
        console.error("createTarifList ERROR", e);
    }
}

async function setHeader(service, spreadsheetId: string, tarif: Omit<TarifByDay, "warehouseList">) {
    try {
        const header = [
            ["Текущая дата", tarif.date],
            ["Дата начала следующего тарифа", tarif.dtNextBox],
            ["Дата окончания последнего установленного тарифа", tarif.dtTillMax],
        ];

        const range = `${listName}!A1:B3`;

        await service.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: header,
            },
        });
        console.log("setHeader SUCCESS");
    } catch (err) {
        console.error("setHeader ERROR", err);
    }
}

async function setBody(service, spreadsheetId: string, warehouses: Warehouse[]) {
    try {
        const sortWarehouses = warehouses.sort((a, b) => Number(b.boxDeliveryAndStorageExpr) - Number(a.boxDeliveryAndStorageExpr));

        const body = [
            [
                "Название склада",
                "Доставка 1 литра",
                "Доставка каждого дополнительного литра",
                "Хранение 1 литра",
                "Хранение каждого дополнительного литра",
                "Коэффициент",
            ],
        ];

        for (const warehouse of sortWarehouses) {
            body.push([
                warehouse.warehouseName,
                warehouse.boxDeliveryBase,
                warehouse.boxDeliveryLiter,
                warehouse.boxStorageBase,
                warehouse.boxStorageLiter,
                warehouse.boxDeliveryAndStorageExpr,
            ]);
        }

        const limit = warehouses.length + 5;
        const range = `${listName}!A5:F${limit}`;

        await service.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: body,
            },
        });

        console.log("setBody SUCCESS");
    } catch (err) {
        console.error("setBody ERROR", err);
    }
}
