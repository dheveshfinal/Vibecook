export interface UserProfile {
    id: string;
    username: string;
    email: string;
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
    recipes_saved_ids: string[];
    member_since: string;
    avatar_url: string;
    followers_count: number;
    following_count: number;
    is_following: boolean;
}

export interface ProfileUpdate {
    username?: string;
    display_name?: string;
    bio?: string;
    diet_type?: string;
    spice_level?: number;
    allergies?: string[];
    cuisine_prefs?: string[];
    cooking_skill?: string;
}
