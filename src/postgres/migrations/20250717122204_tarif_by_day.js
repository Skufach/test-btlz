/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("tarif_by_day", (table) => {
        table.integer("id").primary();
        table.datetime("dtNextBox").nullable();
        table.datetime("dtTillMax").nullable();
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("tarif_by_day");
}
