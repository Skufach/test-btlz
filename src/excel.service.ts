import * as cron from "node-cron";
import { google, sheets_v4 } from "googleapis";
import { getTarif } from "#wb.service.js";
import { TarifByDay, Warehouse } from "#type.js";
import { OAuth2Client } from "google-auth-library";
import Sheets = sheets_v4.Sheets;

let authClient: OAuth2Client;
const listName = `${process.env.EXCEL_TARIF_LIST}`;
const spreadsheetIds = JSON.parse(`${process.env.SPREADSHEET_IDS}`);

export async function getAuthClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: "OAuth.json",
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    authClient = (await auth.getClient()) as OAuth2Client;

    if (!authClient) {
        throw new Error("Проблема с авторизацией");
    }
}

export function startExcelJob() {
    cron.schedule("*/40 * * * * *", async function () {
        try {
            await excelJob();
        } catch (e) {
            console.error(e);
        }
    });
}

async function excelJob() {
    const tarifWithWarehouses = await getTarif();
    if (!tarifWithWarehouses) {
        console.error("Нет подходящего тарифа");
        return;
    }

    const { warehouseList, ...tarif } = tarifWithWarehouses;
    const sortWarehouses = warehouseList.sort((a, b) => Number(a.boxDeliveryAndStorageExpr) - Number(b.boxDeliveryAndStorageExpr));

    for (const spreadsheetId of spreadsheetIds) {
        await setSheetData(spreadsheetId, tarif, sortWarehouses);
    }
}

async function setSheetData(spreadsheetId: string, tarif: Omit<TarifByDay, "warehouseList">, warehouseList: Warehouse[]) {
    console.log("setSheetData START for " + spreadsheetId);

    const service: Sheets = google.sheets({ version: "v4", auth: authClient });

    const res = await service.spreadsheets.get({ spreadsheetId });
    const lists: sheets_v4.Schema$Sheet[] | undefined = res.data.sheets;

    const isExistTarifList = lists ? checkTarifList(lists) : false;

    if (!isExistTarifList) {
        console.log("Создаём новый лист для " + spreadsheetId);
        await createTarifList(service, spreadsheetId);
    } else {
        await clearSheet(service, spreadsheetId);
    }

    await setHeader(service, spreadsheetId, tarif);
    await setBody(service, spreadsheetId, warehouseList);
    console.log("setSheetData END for " + spreadsheetId);
}

// проверка существования страницы с нужным названием
function checkTarifList(lists: sheets_v4.Schema$Sheet[]) {
    for (const list of lists) {
        if (list.properties!.title === listName) {
            return true;
        }
    }

    return false;
}

// создание нового листа
async function createTarifList(service: Sheets, spreadsheetId: string) {
    try {
        console.log("createTarifList START");

        const addSheet = {
            "addSheet": {
                properties: {
                    title: listName,
                },
            },
        };

        const res = await service.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [addSheet] } });
        console.log("createTarifList SUCCESS", res.data);
    } catch (e) {
        console.error("createTarifList ERROR", e);
    }
}

async function setHeader(service: Sheets, spreadsheetId: string, tarif: Omit<TarifByDay, "warehouseList">) {
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

async function setBody(service: Sheets, spreadsheetId: string, warehouses: Warehouse[]) {
    try {
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

        for (const warehouse of warehouses) {
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

async function clearSheet(service: Sheets, spreadsheetId: string) {
    console.log(`clearSheet ${spreadsheetId} START`);
    const range = `${listName}`;

    try {
        await service.spreadsheets.values.clear({
            spreadsheetId,
            range,
        });
        console.log(`clearSheet ${spreadsheetId} END`);
    } catch (err) {
        console.error("Ошибка при очистке листа:", err);
    }
}
