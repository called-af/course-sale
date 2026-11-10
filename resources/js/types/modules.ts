import type { Material } from './material';

export interface Module {
    id: number;
    course_id: number;
    title: string;
    sort_order: number;
    status: 'draft' | 'published';

    course: {
        slug: string;
    };

    materials?: Material[];
}
