/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("tarifs", (table) => {
        table.increments("id");
        table.datetime("date").unique();
        table.string("dtNextBox").nullable();
        table.string("dtTillMax").nullable();

        table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
        table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("tarif_by_day");
}
