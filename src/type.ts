export type Warehouse = {
    boxDeliveryAndStorageExpr: string;
    boxDeliveryBase: string;
    boxDeliveryLiter: string;
    boxStorageBase: string;
    boxStorageLiter: string;
    warehouseName: string;
    tarif_by_day_id: number;
};

export type TarifByDay = {
    date: Date;
    dtNextBox: string | null;
    dtTillMax: string | null;
    warehouseList: Warehouse[];
};
