import knex, { migrate, seed } from "#postgres/knex.js";
import { startJob } from "#wb.js";
import * as dotenv from "dotenv";

dotenv.config();
await migrate.latest();
await seed.run();

console.log("start");
startJob();
console.log("end");
