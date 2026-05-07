import { useState, useEffect, useCallback } from "react";
import type { UserProfile, ProfileUpdate } from "../types";
import { profileService } from "../service/profileService";

export function useProfile() {
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

    return { profile, loading, error, updateProfile, uploadAvatar, refresh: fetchProfile };
}
