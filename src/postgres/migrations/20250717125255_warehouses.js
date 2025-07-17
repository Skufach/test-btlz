/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("warehouses", (table) => {
        table.integer("id").primary();
        table.string("boxDeliveryAndStorageExpr").nullable();
        table.string("boxDeliveryBase").nullable();
        table.string("boxDeliveryLiter").nullable();
        table.string("boxStorageBase").nullable();
        table.string("boxStorageLiter").nullable();
        table.integer("tarif_by_day_id").unsigned().references("tarif_by_day.id").onDelete("CASCADE");
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("warehouses");
}
