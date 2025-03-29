export interface Category {
    id: string;
    name: string;
    description: string;
    image?: string;
    parentId?: string;
    order?: number;
    slug?: string;
    isActive?: boolean;
    metaTitle?: string;
    metaDescription?: string;
}