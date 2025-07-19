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

async function getSheetData() {
    const sheets = google.sheets({ version: "v4", auth: authClient });
    const spreadsheetId = "id листа";
    const range = "Лист1!A1:C10";
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        console.log("Данные из таблицы:", response.data.values);
    } catch (err) {
        console.error("Ошибка при получении данных:", err);
    }
}

export function startExcelJob() {
    cron.schedule("*/10 * * * * *", async function () {
        try {
            console.log("ОТПРАВКА");
            await getSheetData();
            console.log("ПОЛУЧЕНИЕ");
        } catch (e) {
            throw new Error(e);
        }
    });
}
