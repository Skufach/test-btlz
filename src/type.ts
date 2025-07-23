export type Warehouse = {
    boxDeliveryAndStorageExpr: string | null;
    boxDeliveryBase: string | null;
    boxDeliveryLiter: string | null;
    boxStorageBase: string | null;
    boxStorageLiter: string | null;
    tarif_by_day_id: number | null;
};

export type TarifByDay = {
    date: Date;
    dtNextBox: string | null;
    dtTillMax: string | null;
    warehouseList: Warehouse[];
};
