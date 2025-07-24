import knex, { migrate, seed } from "#postgres/knex.js";
import { startWbJob } from "#wb.service.js";
import * as dotenv from "dotenv";
import { getAuthClient, startExcelJob } from "#excel.service.js";

dotenv.config();
await migrate.latest();
await seed.run();

console.log("start");
startWbJob();

// получаем токен для обращения в google
await getAuthClient();

// запускаем крон для работы с экселем
startExcelJob();
