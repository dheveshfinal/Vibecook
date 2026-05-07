export interface Recipe {
    id: number;
    title: string;
    time: string;
    cuisine: string;
    spice: string;
    img: string;
    diet: string;
    db_id?: string;
    ingredients?: string | string[];
    steps?: string | string[];
    description?: string;
}
