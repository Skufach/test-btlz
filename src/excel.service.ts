import * as cron from "node-cron";
import axios from "axios";
import { db } from "./config/knex/knexfile.js";
import { google } from "googleapis";

let authClient = null;

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

type Warehouse = {
    boxDeliveryAndStorageExpr: string | null;
    boxDeliveryBase: string | null;
    boxDeliveryLiter: string | null;
    boxStorageBase: string | null;
    boxStorageLiter: string | null;
    tarif_by_day_id: number | null;
};

type TarifByDay = {
    dtNextBox: string | null;
    dtTillMax: string | null;
    warehouseList: Warehouse[];
};

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

    console.log("sheets", res.data.sheets);

    // const values = [
    //     ["Привет", "Мир"],
    //     ["Это", "тест"],
    // ];
    //
    // const range = "Лист1!A1:B2";
    // try {
    //
    //     const response = await service.spreadsheets.values.update({
    //         spreadsheetId,
    //         range,
    //         valueInputOption: "RAW",
    //         requestBody: {
    //             values,
    //         },
    //     });
    //     console.log("Записали", response.data);
    // } catch (err) {
    //     console.error("Ошибка при записи", err);
    // }
}

export function startExcelJob() {
    cron.schedule("*/10 * * * * *", async function () {
        try {
            console.log("ОТПРАВКА");
            await setSheetData();
            console.log("ПОЛУЧЕНИЕ");
        } catch (e) {
            throw new Error(e);
        }
    });
}

// проверка существования страницы с нужным названием
function checkTarifList(sheets) {
    for (const sheet of sheets) {
        if (sheet.properties.title === `${process.env.EXCEL_TARIF_LIST}`) {
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
                    title: `${process.env.EXCEL_TARIF_LIST}`,
                },
            },
        };

        const res = await service.spreadsheets.batchUpdate({ spreadsheetId: `${process.env.TABLE_ID}`, resource: { requests: [addSheet] } });
        console.log("createTarifList END", res.data);
    } catch (e) {
        console.error("createTarifList ERROR", e);
    }
}
