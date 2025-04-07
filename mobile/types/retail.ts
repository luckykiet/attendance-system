import { Address } from "./address"

export type MyRetail = {
    _id: string;
    tin: string;
    vin?: string;
    name: string,
    address: Address
}