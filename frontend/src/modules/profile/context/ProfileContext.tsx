import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { UserProfile, ProfileUpdate } from "../types";
import { profileService } from "../service/profileService";

interface ProfileContextType {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    updateProfile: (data: ProfileUpdate) => Promise<void>;
    uploadAvatar: (file: File) => Promise<void>;
    toggleSaveRecipe: (recipeId: string, currentlySaved: boolean) => Promise<void>;
    customizeRecipe: (recipeId: string, data: any) => Promise<void>;
    deleteCustomization: (recipeId: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await profileService.getProfile();
            setProfile(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch profile:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch profile");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateProfile = async (data: ProfileUpdate) => {
        if (!profile) return;
        await profileService.updateProfile(profile.id, data);
        await fetchProfile();
    };

    const uploadAvatar = async (file: File) => {
        const url = await profileService.uploadAvatar(file);
        if (profile) {
            setProfile({ ...profile, avatar_url: url });
        }
    };

    const toggleSaveRecipe = async (recipeId: string, currentlySaved: boolean) => {
        if (!profile) return;
        try {
            if (currentlySaved) {
                await profileService.unsaveRecipe(profile.id, recipeId);
            } else {
                await profileService.saveRecipe(profile.id, recipeId);
            }
            await fetchProfile();
        } catch (err) {
            console.error("Failed to toggle recipe save status:", err);
        }
    };

    const customizeRecipe = async (recipeId: string, data: any) => {
        await profileService.customizeRecipe(recipeId, data);
        await fetchProfile();
    };

    const deleteCustomization = async (recipeId: string) => {
        await profileService.deleteCustomization(recipeId);
        await fetchProfile();
    };

    return (
        <ProfileContext.Provider value={{
            profile, loading, error, updateProfile, uploadAvatar, toggleSaveRecipe, customizeRecipe, deleteCustomization, refresh: fetchProfile
        }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfileContext = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error("useProfileContext must be used within a ProfileProvider");
    }
    return context;
};
