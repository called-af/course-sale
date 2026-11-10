import type { MaterialContent } from './material-content';
import type { Module } from './modules';

export interface Material {
    module: Module;
    contents: MaterialContent[];
    id: number;
    module_id: number;
    title: string;
    description?: string | null;
    sort_order: number;
    status: 'draft' | 'published';

    created_at?: string;
    updated_at?: string;
}
