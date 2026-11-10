export interface CourseResource {
    id: number;
    title: string;
    description?: string | null;
    file_path?: string | null;
    external_url?: string | null;
    url?: string | null;
    download_url?: string | null;
    status: 'draft' | 'published';
    sort_order: number;
}
