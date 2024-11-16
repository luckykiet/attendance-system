type Employee = {
    name?: string;
    publicKey?: string;
    email?: string;
    phone?: string;
    deviceId?: string | null;
}

type Retail = {
    name?: string;
    tin?: string;
    address?: {
        street?: string;
        city?: string;
        zip?: string;
    }
}

export type RegistrationForm = {
    domain: string;
    employee?: Employee;
    retail?: Retail;
    tokenId: string;
};

export interface RegistrationSubmitForm {
    tokenId: string;
    form: Employee;
}
