export interface Certificate {
    id: number;
    certificate_number: string;
    issued_at: string;
    has_pdf?: boolean;
    course: {
        id?: number;
        title: string;
        slug: string;
        thumbnail_url: string;
        instructor: string;
    };
}
