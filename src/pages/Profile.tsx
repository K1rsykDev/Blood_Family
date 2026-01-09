import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, FileText, Calendar, Loader2, Camera, Heart, Image, Lock, Mail, Bell, MessageSquare, UserMinus, Palmtree } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { ProfileNotifications } from "@/components/profile/ProfileNotifications";
import { TelegramConnection } from "@/components/profile/TelegramConnection";
import { NotificationSettings } from "@/components/profile/NotificationSettings";
import { DirectMessages } from "@/components/DirectMessages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaveFamily } from "@/components/profile/LeaveFamily";
import { VacationRequest } from "@/components/profile/VacationRequest";
import { ContractsTab } from "@/components/profile/ContractsTab";
interface CustomRole {
  id: string;
  display_name: string;
  color: string;
  has_admin_access: boolean;
  has_roulette_access: boolean;
  can_change_username: boolean;
}

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  role: string;
  discord_id: string | null;
  created_at: string | null;
  custom_role_id: string | null;
  custom_role?: CustomRole | null;
  has_nickname_glow?: boolean;
  nickname_gradient_start?: string | null;
  nickname_gradient_end?: string | null;
  static?: string | null;
}

const Profile = () => {
  const { userId } = useParams();
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [adminCode, setAdminCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<ProfileData | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Password change state
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Settings state
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDiscordId, setNewDiscordId] = useState("");
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Image crop state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"avatar" | "banner">("avatar");

  // Direct messages state
  const [directOpen, setDirectOpen] = useState(false);
  const [directInitialUser, setDirectInitialUser] = useState<string | undefined>(undefined);

  // Admin pending counts
  const [adminPendingCount, setAdminPendingCount] = useState(0);

  // Active vacation state for viewed profile
  const [activeVacation, setActiveVacation] = useState<{start_date: string; end_date: string} | null>(null);

  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (!isLoading && !user && !userId) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate, userId]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!targetUserId) return;

      if (isOwnProfile && profile) {
        setViewedProfile({
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          banner_url: (profile as any).banner_url || null,
          role: profile.role || 'guest',
          discord_id: profile.discord_id,
          created_at: profile.created_at,
          custom_role_id: (profile as any).custom_role_id || null,
          custom_role: (profile as any).custom_role || null,
          has_nickname_glow: (profile as any).has_nickname_glow || false,
          nickname_gradient_start: (profile as any).nickname_gradient_start || null,
          nickname_gradient_end: (profile as any).nickname_gradient_end || null,
          static: (profile as any).static || null,
        });
        setNewUsername(profile.username || "");
        setNewDiscordId(profile.discord_id || "");
      } else if (userId) {
        const { data } = await supabase
          .from("profiles")
          .select("*, custom_roles(*)")
          .eq("id", userId)
          .maybeSingle();
        
        if (data) {
          setViewedProfile({
            id: data.id,
            username: data.username,
            avatar_url: data.avatar_url,
            banner_url: data.banner_url || null,
            role: data.role || 'guest',
            discord_id: data.discord_id,
            created_at: data.created_at,
            custom_role_id: data.custom_role_id || null,
            custom_role: (data as any).custom_roles || null,
            has_nickname_glow: (data as any).has_nickname_glow || false,
            nickname_gradient_start: (data as any).nickname_gradient_start || null,
            nickname_gradient_end: (data as any).nickname_gradient_end || null,
            static: data.static || null,
          });
        }
      }
    };

    fetchProfileData();
  }, [targetUserId, profile, isOwnProfile, userId]);


  useEffect(() => {
    const fetchLikes = async () => {
      if (!targetUserId) return;

      const { count } = await supabase
        .from("profile_likes")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", targetUserId);

      setLikesCount(count || 0);

      if (user && user.id !== targetUserId) {
        const { data } = await supabase
          .from("profile_likes")
          .select("id")
          .eq("from_user_id", user.id)
          .eq("to_user_id", targetUserId)
          .maybeSingle();
        
        setHasLiked(!!data);
      }
    };

    fetchLikes();
  }, [targetUserId, user]);

  // Fetch active vacation for viewed profile
  useEffect(() => {
    const fetchActiveVacation = async () => {
      if (!targetUserId) return;
      
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("vacations")
        .select("start_date, end_date")
        .eq("user_id", targetUserId)
        .eq("status", "approved")
        .lte("start_date", today)
        .gte("end_date", today)
        .maybeSingle();
      
      setActiveVacation(data);
    };

    fetchActiveVacation();
  }, [targetUserId]);

  // Listen for settings open event
  useEffect(() => {
    const handleOpenSettings = () => {
      if (isOwnProfile) {
        setSettingsDialog(true);
      }
    };

    window.addEventListener('openProfileSettings', handleOpenSettings);
    return () => window.removeEventListener('openProfileSettings', handleOpenSettings);
  }, [isOwnProfile]);

  // Fetch admin pending counts
  useEffect(() => {
    const hasAdminAccess = profile?.role === "admin" || profile?.role === "developer" || (profile as any)?.custom_role?.has_admin_access;
    if (!hasAdminAccess || !isOwnProfile) return;

    const fetchPendingCounts = async () => {
      const [applications, contracts, leaveRequests, vacations] = await Promise.all([
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("contracts").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("vacations").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const total = (applications.count || 0) + (contracts.count || 0) + (leaveRequests.count || 0) + (vacations.count || 0);
      setAdminPendingCount(total);
    };

    fetchPendingCounts();
  }, [profile, isOwnProfile]);

  const handleLike = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    setIsLiking(true);
    try {
      if (hasLiked) {
        await supabase
          .from("profile_likes")
          .delete()
          .eq("from_user_id", user.id)
          .eq("to_user_id", targetUserId);
        setHasLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await supabase
          .from("profile_likes")
          .insert({ from_user_id: user.id, to_user_id: targetUserId });
        setHasLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Файл занадто великий",
        description: "Максимальний розмір 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropType("avatar");
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Файл занадто великий",
        description: "Максимальний розмір 10MB",
        variant: "destructive",
      });
      return;
    }

    // Check if it's a GIF - if so, upload directly without cropping
    const isGif = file.type === "image/gif";
    
    if (isGif) {
      // Upload GIF directly without cropping
      uploadBannerDirect(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setCropType("banner");
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }

    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  };

  const uploadBannerDirect = async (file: File) => {
    if (!user) return;
    setIsUploadingBanner(true);

    try {
      const ext = file.name.split('.').pop() || 'gif';
      const fileName = `${user.id}/banner.${ext}`;
      const bucket = "avatars";

      // Remove old files
      const extensions = ["png", "jpg", "jpeg", "webp", "gif"];
      const filesToRemove = extensions.map((e) => `${user.id}/banner.${e}`);
      await supabase.storage.from(bucket).remove(filesToRemove);

      // Upload file directly
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ banner_url: `${publicUrl.publicUrl}?t=${Date.now()}` })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      
      setViewedProfile((prev) =>
        prev
          ? { ...prev, banner_url: `${publicUrl.publicUrl}?t=${Date.now()}` }
          : prev
      );

      toast({
        title: "Банер оновлено!",
      });
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити банер",
        variant: "destructive",
      });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    const isAvatar = cropType === "avatar";
    isAvatar ? setIsUploadingAvatar(true) : setIsUploadingBanner(true);

    try {
      const fileName = `${user.id}/${cropType}.jpg`;
      const bucket = "avatars";

      // Remove old files
      const extensions = ["png", "jpg", "jpeg", "webp"];
      const filesToRemove = extensions.map((ext) => `${user.id}/${cropType}.${ext}`);
      await supabase.storage.from(bucket).remove(filesToRemove);

      // Upload cropped image
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, croppedBlob, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);

      const updateField = isAvatar ? "avatar_url" : "banner_url";
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ [updateField]: `${publicUrl.publicUrl}?t=${Date.now()}` })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      
      // Update viewed profile as well
      setViewedProfile((prev) =>
        prev
          ? { ...prev, [updateField]: `${publicUrl.publicUrl}?t=${Date.now()}` }
          : prev
      );

      toast({
        title: isAvatar ? "Аватарку оновлено!" : "Банер оновлено!",
      });
    } catch (error) {
      console.error(`Error uploading ${cropType}:`, error);
      toast({
        title: "Помилка",
        description: `Не вдалося завантажити ${isAvatar ? "аватарку" : "банер"}`,
        variant: "destructive",
      });
    } finally {
      isAvatar ? setIsUploadingAvatar(false) : setIsUploadingBanner(false);
      setSelectedImage(null);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Помилка",
        description: "Паролі не співпадають",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Помилка",
        description: "Пароль має бути мінімум 6 символів",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast({
        title: "Пароль змінено!",
      });
      setPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося змінити пароль",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSettingsUpdate = async () => {
    const canChangeUsername = profile?.role === "developer" || (profile as any)?.custom_role?.can_change_username;
    const trimmedUsername = newUsername.trim();
    
    if (canChangeUsername) {
      if (!trimmedUsername) {
        toast({
          title: "Помилка",
          description: "Нікнейм не може бути порожнім",
          variant: "destructive",
        });
        return;
      }

      if (trimmedUsername.length < 2 || trimmedUsername.length > 30) {
        toast({
          title: "Помилка",
          description: "Нікнейм має бути від 2 до 30 символів",
          variant: "destructive",
        });
        return;
      }
    }

    setIsUpdatingSettings(true);

    try {
      if (newEmail && newEmail !== user?.email) {
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) throw error;
      }

      const profileUpdates: { username?: string; discord_id?: string | null } = {};
      
      if (canChangeUsername && trimmedUsername !== profile?.username) {
        profileUpdates.username = trimmedUsername;
      }
      
      if (newDiscordId !== profile?.discord_id) {
        profileUpdates.discord_id = newDiscordId || null;
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user?.id);
        if (error) throw error;
        await refreshProfile();
        
        // Update viewed profile
        setViewedProfile(prev => prev ? { ...prev, ...profileUpdates } : prev);
      }

      toast({
        title: "Налаштування збережено!",
      });
      setSettingsDialog(false);
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити налаштування",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleAdminCodeSubmit = async () => {
    if (!adminCode.trim()) return;
    setIsVerifying(true);

    try {
      const { data: settings } = await supabase
        .from("site_settings")
        .select("admin_code")
        .eq("id", 1)
        .single();

      if (settings && settings.admin_code === adminCode) {
        // Don't change role if user is already a developer
        if (profile?.role === "developer") {
          await supabase
            .from("profiles")
            .update({ admin_code_verified: true })
            .eq("id", user?.id);
          
          await refreshProfile();
          toast({
            title: "Код підтверджено!",
            description: "Ви вже маєте роль розробника.",
          });
        } else {
          const { error } = await supabase
            .from("profiles")
            .update({ role: "admin", admin_code_verified: true })
            .eq("id", user?.id);

          if (error) throw error;

          await refreshProfile();
          toast({
            title: "Успіх!",
            description: "Ви тепер адміністратор.",
          });
        }
        setAdminCode("");
      } else {
        toast({
          title: "Невірний код",
          description: "Код адміністратора невірний.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying admin code:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося перевірити код.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  const displayProfile = viewedProfile;

  const getRoleLabel = (role: string, customRole?: any) => {
    if (customRole) return customRole.display_name;
    const roleLabels: Record<string, string> = {
      guest: "Гість",
      member: "Учасник сім'ї",
      admin: "Адміністратор",
      developer: "Розробник",
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role: string, customRole?: any) => {
    if (customRole) return customRole.color;
    const roleColors: Record<string, string> = {
      guest: "text-muted-foreground",
      member: "text-primary",
      admin: "text-gold",
      developer: "text-purple-500",
    };
    return roleColors[role] || "text-muted-foreground";
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Banner */}
          <div className="relative h-48 md:h-64 rounded-t-xl overflow-hidden mb-6">
            {displayProfile?.banner_url ? (
              <img
                src={displayProfile.banner_url}
                alt="Банер профілю"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/30 to-primary/10" />
            )}
            {isOwnProfile && (
              <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 z-20 flex gap-2">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-background/80 backdrop-blur-sm rounded-lg flex items-center gap-2 text-xs md:text-sm hover:bg-background transition-colors"
                >
                  {isUploadingBanner ? (
                    <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                  ) : (
                    <Image className="w-3 h-3 md:w-4 md:h-4" />
                  )}
                  <span className="hidden sm:inline">Змінити банер</span>
                  <span className="sm:hidden">Банер</span>
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8 md:mt-0">
            {/* Profile Card */}
            <div className="md:col-span-1">
              <div className="card-blood p-6 text-center relative pt-16 md:pt-20">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                  <div className="relative w-24 h-24">
                    <div className="w-24 h-24 rounded-full bg-secondary border-4 border-background flex items-center justify-center overflow-hidden">
                      {displayProfile?.avatar_url ? (
                        <img
                          src={displayProfile.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    {isOwnProfile && (
                      <>
                        <button
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarSelect}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>
                </div>

                <h2 
                  className={`font-display text-xl font-bold mb-1 ${viewedProfile?.has_nickname_glow && viewedProfile?.nickname_gradient_start ? 'nickname-gradient-glow' : ''}`}
                  data-text={displayProfile?.username || "Користувач"}
                  style={viewedProfile?.has_nickname_glow && viewedProfile?.nickname_gradient_start ? {
                    background: `linear-gradient(90deg, ${viewedProfile.nickname_gradient_start}, ${viewedProfile.nickname_gradient_end || viewedProfile.nickname_gradient_start})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    '--glow-color-start': viewedProfile.nickname_gradient_start,
                    '--glow-color-end': viewedProfile.nickname_gradient_end || viewedProfile.nickname_gradient_start,
                  } as React.CSSProperties : undefined}
                >
                  {displayProfile?.username || "Користувач"}
                </h2>
                <p 
                  className="text-sm font-medium"
                  style={{ color: viewedProfile?.custom_role ? viewedProfile.custom_role.color : undefined }}
                >
                  <span className={!viewedProfile?.custom_role ? getRoleColor(viewedProfile?.role || "guest") : ""}>
                    {getRoleLabel(viewedProfile?.role || "guest", viewedProfile?.custom_role)}
                  </span>
                </p>
                
                {/* Active vacation badge */}
                {activeVacation && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-green-500/20 text-green-500 text-xs font-medium px-2.5 py-1 rounded-full">
                    <Palmtree className="w-3 h-3" />
                    У відпустці до {new Date(activeVacation.end_date).toLocaleDateString("uk-UA")}
                  </div>
                )}
                
                {viewedProfile?.static && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Статик: <span className="font-mono text-primary">{viewedProfile.static}</span>
                  </p>
                )}
                
                {displayProfile?.discord_id && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Discord: {displayProfile.discord_id}
                  </p>
                )}

                {/* Likes */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Heart className={`w-5 h-5 ${hasLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                  <span className="font-semibold">{likesCount}</span>
                  <span className="text-muted-foreground text-sm">вподобань</span>
                </div>

                {user && !isOwnProfile && (
                  <>
                    <Button
                      onClick={handleLike}
                      disabled={isLiking}
                      variant={hasLiked ? "default" : "outline"}
                      className={`mt-4 w-full ${hasLiked ? 'btn-blood' : ''}`}
                    >
                      {isLiking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : hasLiked ? (
                        <>
                          <Heart className="w-4 h-4 mr-2 fill-current" />
                          Вподобано
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          Вподобати
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setDirectInitialUser(targetUserId);
                        setDirectOpen(true);
                      }}
                      variant="outline"
                      className="mt-2 w-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Написати
                    </Button>
                  </>
                )}

                {isOwnProfile && (
                  <div className="mt-4 space-y-2">
                    <Button
                      onClick={() => {
                        setDirectInitialUser(undefined);
                        setDirectOpen(true);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Дірект
                    </Button>
                    <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Lock className="w-4 h-4 mr-2" />
                          Змінити пароль
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Змінити пароль</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Новий пароль</Label>
                            <Input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="bg-secondary"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Підтвердіть пароль</Label>
                            <Input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="bg-secondary"
                            />
                          </div>
                          <Button
                            onClick={handlePasswordChange}
                            disabled={isChangingPassword}
                            className="w-full btn-blood"
                          >
                            {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Змінити"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Mail className="w-4 h-4 mr-2" />
                          Налаштування
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Налаштування профілю</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="profile" className="w-full">
                          <TabsList className="w-full grid grid-cols-4 mb-4">
                            <TabsTrigger value="profile" className="text-xs sm:text-sm">Профіль</TabsTrigger>
                            <TabsTrigger value="notifications" className="text-xs sm:text-sm">Сповіщення</TabsTrigger>
                            <TabsTrigger value="telegram" className="text-xs sm:text-sm">Telegram</TabsTrigger>
                            <TabsTrigger value="admin" className="text-xs sm:text-sm">Адмін код</TabsTrigger>
                          </TabsList>

                          <TabsContent value="profile" className="space-y-4">
                            {/* Username change - only for developers or users with can_change_username permission */}
                            {(profile?.role === "developer" || (profile as any)?.custom_role?.can_change_username) && (
                              <div className="space-y-2">
                                <Label>Нікнейм</Label>
                                <Input
                                  type="text"
                                  value={newUsername}
                                  onChange={(e) => setNewUsername(e.target.value)}
                                  placeholder="Ваш нікнейм"
                                  maxLength={30}
                                  className="bg-secondary"
                                />
                                <p className="text-xs text-muted-foreground">Від 2 до 30 символів</p>
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={newEmail || user?.email || ""}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="bg-secondary"
                              />
                            </div>
                            <Button
                              onClick={handleSettingsUpdate}
                              disabled={isUpdatingSettings}
                              className="w-full btn-blood"
                            >
                              {isUpdatingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : "Зберегти"}
                            </Button>
                          </TabsContent>

                          <TabsContent value="notifications">
                            <NotificationSettings />
                          </TabsContent>

                          <TabsContent value="telegram">
                            <TelegramConnection userId={user?.id || ""} />
                          </TabsContent>

                          <TabsContent value="admin" className="space-y-4">
                            {profile?.role !== "admin" && profile?.role !== "developer" ? (
                              <>
                                <p className="text-sm text-muted-foreground">
                                  Якщо у вас є код адміністратора, введіть його тут щоб отримати доступ до адмін-панелі.
                                </p>
                                <div className="flex gap-3">
                                  <Input
                                    type="password"
                                    placeholder="Введіть код"
                                    value={adminCode}
                                    onChange={(e) => setAdminCode(e.target.value)}
                                    className="bg-secondary border-border"
                                  />
                                  <Button
                                    onClick={handleAdminCodeSubmit}
                                    disabled={isVerifying || !adminCode.trim()}
                                    className="btn-blood rounded-lg"
                                  >
                                    {isVerifying ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      "Підтвердити"
                                    )}
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Ви вже маєте права адміністратора або розробника.
                              </p>
                            )}
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>

                    {/* Admin/Developer Panel Links */}
                    {(profile?.role === "admin" || profile?.role === "developer" || (profile as any)?.custom_role?.has_admin_access) && (
                      <div className="pt-2 border-t border-border space-y-2">
                        <Link to="/admin">
                          <Button variant="outline" className="w-full text-gold border-gold/30 hover:bg-gold/10 relative">
                            <Shield className="w-4 h-4 mr-2" />
                            Адмін панель
                            {adminPendingCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                                {adminPendingCount > 99 ? "99+" : adminPendingCount}
                              </span>
                            )}
                          </Button>
                        </Link>
                        {(profile?.role === "admin" || profile?.role === "developer" || (profile as any)?.custom_role?.has_roulette_access) && (
                          <Link to="/roulette">
                            <Button variant="outline" className="w-full text-gold border-gold/30 hover:bg-gold/10">
                              <span className="mr-2">🎰</span>
                              Рулетка
                            </Button>
                          </Link>
                        )}
                        {profile?.role === "developer" && (
                          <Link to="/developer">
                            <Button variant="outline" className="w-full text-purple-500 border-purple-500/30 hover:bg-purple-500/10">
                              <Shield className="w-4 h-4 mr-2" />
                              Панель розробника
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats, Notifications & Settings */}
            <div className="md:col-span-2 space-y-6">
              {/* Tabs for own profile */}
              {/* Contract stats for own profile - moved to header area */}
              {isOwnProfile && (
                <ContractsTab userId={user?.id || ""} userRole={profile?.role || "guest"} />
              )}

              {isOwnProfile ? (
                <Tabs defaultValue="notifications" className="w-full">
                  <TabsList className="w-full grid grid-cols-3 mb-4 h-auto">
                    <TabsTrigger value="notifications" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                      <Bell className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Повідомлення</span>
                      <span className="sm:hidden">Повід.</span>
                    </TabsTrigger>
                    <TabsTrigger value="vacation" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                      <Palmtree className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Відпустка</span>
                      <span className="sm:hidden">Відп.</span>
                    </TabsTrigger>
                    <TabsTrigger value="leave" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                      <UserMinus className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Вихід</span>
                      <span className="sm:hidden">Вих.</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="notifications">
                    <ProfileNotifications userId={user?.id || ""} />
                  </TabsContent>

                  <TabsContent value="vacation">
                    <VacationRequest userId={user?.id || ""} userRole={profile?.role || "guest"} />
                  </TabsContent>

                  <TabsContent value="leave">
                    <LeaveFamily userId={user?.id || ""} userRole={profile?.role || "guest"} />
                  </TabsContent>
                </Tabs>
              ) : (
                /* Show contracts for admins viewing other profiles */
                (profile?.role === "admin" || profile?.role === "developer" || (profile as any)?.custom_role?.has_admin_access) && (
                  <div className="card-blood p-6">
                    <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Контракти гравця
                    </h3>
                    <ContractsTab userId={targetUserId || ""} userRole={viewedProfile?.role || "guest"} />
                  </div>
                )
              )}

              {/* Account Info */}
              <div className="card-blood p-6">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Інформація
                </h3>
                <div className="space-y-2 text-sm">
                  {isOwnProfile && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{user?.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Дата реєстрації:</span>
                    <span>
                      {displayProfile?.created_at
                        ? new Date(displayProfile.created_at).toLocaleDateString("uk-UA")
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Crop Dialog */}
      {selectedImage && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={(open) => {
            setCropDialogOpen(open);
            if (!open) setSelectedImage(null);
          }}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          aspectRatio={cropType === "avatar" ? 1 : 16 / 6}
          cropShape={cropType === "avatar" ? "round" : "rect"}
          title={cropType === "avatar" ? "Редагувати аватарку" : "Редагувати банер"}
        />
      )}

      {/* Direct Messages */}
      <DirectMessages
        open={directOpen}
        onOpenChange={setDirectOpen}
        initialUserId={directInitialUser}
      />
    </Layout>
  );
};

export default Profile;