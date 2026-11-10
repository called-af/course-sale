export interface PaymentMethod {
    id: number;
    name: string;
    code: string;
    provider?: {
        id: number;
        name: string;
        code: string;
    } | null;
}

export interface PaymentGateway {
    name: string;
    midtrans_enabled: boolean;
    is_production?: boolean;
}
