export interface Category {
    id: number;
    name: string;
    slug: string;
    desc?: string;
    img_url?: string;
}

export interface CategorySectionProps {
    categories: Category[];
}
