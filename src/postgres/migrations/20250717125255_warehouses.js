/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("warehouses", (table) => {
        table.increments("id");
        table.string("boxDeliveryAndStorageExpr").nullable();
        table.string("boxDeliveryBase").nullable();
        table.string("boxDeliveryLiter").nullable();
        table.string("boxStorageBase").nullable();
        table.string("boxStorageLiter").nullable();
        table.integer("tarifId").unsigned().references("tarifs.id").onDelete("CASCADE");

        table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("warehouses");
}
