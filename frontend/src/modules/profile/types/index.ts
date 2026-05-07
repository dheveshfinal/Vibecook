export interface UserProfile {
    id: string;
    display_name: string;
    bio: string;
    avatar_path: string;
    diet_type: "Veg" | "Non-Veg" | "Vegan";
    spice_level: number;
    allergies: string[];
    cuisine_prefs: string[];
    cooking_skill: "Beginner" | "Intermediate" | "Pro";
    recipes_cooked: number;
    recipes_saved: number;
    member_since: string;
    avatar_url: string;
}

export interface ProfileUpdate {
    display_name?: string;
    bio?: string;
    diet_type?: string;
    spice_level?: number;
    allergies?: string[];
    cuisine_prefs?: string[];
    cooking_skill?: string;
}
