import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { CountryPicker } from "@/components/ui/country-picker";
import { Logo } from "@/components/ui/logo";
import { colors, scoreboardPattern } from "@/constants";
import { useCompleteProfileAndAccept } from "@/invite/hooks";
import { clearPendingInviteToken, getPendingInviteToken } from "@/invite/storage";
import type { PickedImageFile } from "@/invite/types";
import { CountryOption } from "@/league/league-create-constants";
import { pickProfileImage } from "@/lib/pick-profile-image";
import { showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

export default function CreatePlayerProfileRoute() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<PickedImageFile | null>(null);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [loadingToken, setLoadingToken] = useState(true);
  const completeMutation = useCompleteProfileAndAccept();
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  useEffect(() => {
    void (async () => {
      const pending = await getPendingInviteToken();
      setToken(pending);
      setLoadingToken(false);
      if (!pending) {
        router.replace("/");
      }
    })();
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePickAvatar = async () => {
    setPickingAvatar(true);
    try {
      const picked = await pickProfileImage();
      if (picked) setAvatar(picked);
    } catch (error) {
      showThrownAsToast(error, "Could not pick photo");
    } finally {
      setPickingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
  };

  const onSubmit = async () => {
    if (!token || !name.trim() || !selectedCountry) return;
    try {
       await completeMutation.mutateAsync({
        token,
        payload: {
          name: name.trim(),
          bio: bio.trim() || undefined,
          avatar: avatar ?? undefined,
          countryId: selectedCountry.id,
        },
      });
      await clearPendingInviteToken();
   
        router.replace("/");
      
    } catch (error) {
    if ((error as any)?.status === 409) {
        await clearPendingInviteToken()
        router.replace('/')
        return
    }
      showThrownAsToast(error, "Could not create profile");
    }
  };

  if (loadingToken || !token) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
          <BlackPatternBackground
              baseColor={scoreboardPattern().baseColor}
              stripeColor={scoreboardPattern().stripeColor}
          />
        <ScrollView
          contentContainerClassName="gap-6 px-6 pb-10 pt-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center">
            <Logo fontSize={40} lineHeight={50} />
          </View>

          <View className="gap-2">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-center text-xl text-white"
            >
              Create your player profile
            </Text>
            <Text
              style={{ fontFamily: fonts.body }}
              className="text-center text-sm text-slate-300"
            >
              This is how you&apos;ll appear on the team sheet and match events.
            </Text>
          </View>

          <ProfileAvatarPicker
            avatar={avatar}
            picking={pickingAvatar}
            onPick={() => void handlePickAvatar()}
            onRemove={handleRemoveAvatar}
          />

          <AuthTextField
            label="Display name"
            value={name}
            onChangeText={setName}
            placeholder="Alex Morgan"
            autoCapitalize="words"
          />
           <CountryPicker value={selectedCountry} onChange={setSelectedCountry} />
          <AuthTextField
            label="Bio (optional)"
            value={bio}
            onChangeText={setBio}
            placeholder="A few words about your game"
            multiline
          />

          <Button
            variant="authPurple"
            label="Join league"
            onPress={() => void onSubmit()}
            loading={completeMutation.isPending}
            disabled={!name.trim() || !selectedCountry || completeMutation.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProfileAvatarPicker({
  avatar,
  picking,
  onPick,
  onRemove,
}: {
  avatar: PickedImageFile | null;
  picking: boolean;
  onPick: () => void;
  onRemove: () => void;
}) {
  return (
    <View className="items-center gap-3">
      <Text
        style={{ fontFamily: fonts.bodySemibold }}
        className="text-sm text-neutral-300"
      >
        Profile photo (optional)
      </Text>

      <Pressable
        onPress={onPick}
        disabled={picking}
        accessibilityRole="button"
        accessibilityLabel={avatar ? "Change profile photo" : "Add profile photo"}
        className="h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-neutral-300 bg-neutral-50 active:opacity-80"
      >
        {picking ? (
          <ActivityIndicator color={colors.brand} />
        ) : avatar ? (
          <Image
            source={{ uri: avatar.uri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="items-center gap-1">
            <Ionicons name="camera-outline" size={28} color={colors.authPurple} />
            <Text
              style={{ fontFamily: fonts.body }}
              className="text-[11px] text-slate-500"
            >
              Add photo
            </Text>
          </View>
        )}
      </Pressable>

      {avatar ? (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel="Remove profile photo"
          hitSlop={8}
        >
          <Text
            style={{ fontFamily: fonts.bodySemibold }}
            className="text-sm text-slate-400"
          >
            Remove photo
          </Text>
        </Pressable>
      ) : (
        <Text
          style={{ fontFamily: fonts.body }}
          className="text-center text-xs text-slate-400"
        >
          JPG, PNG
        </Text>
      )}
    </View>
  );
}
