import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import * as authApi from "../api/authApi.js";
import {
  setHttpAccessToken,
  setUnauthorizedHandler
} from "../api/httpClient.js";
import * as profilesApi from "../api/profilesApi.js";
import { AuthContext } from "./authContextObject.js";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setHttpAccessToken(null);
    setSession(null);
  }, []);

  const acceptSession = useCallback((payload) => {
    setHttpAccessToken(payload.accessToken);
    setSession(payload);
    return payload;
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    authApi
      .refreshAccount()
      .then((response) => {
        if (response?.data) {
          acceptSession(response.data);
        } else {
          clearSession();
        }
      })
      .catch(clearSession)
      .finally(() => setIsLoading(false));

    return () => setUnauthorizedHandler(null);
  }, [acceptSession, clearSession]);

  const login = useCallback(
    async (values) => acceptSession((await authApi.loginAccount(values)).data),
    [acceptSession]
  );

  const register = useCallback(
    async (values) =>
      acceptSession((await authApi.registerAccount(values)).data),
    [acceptSession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logoutAccount();
    } finally {
      window.location.replace("/");
    }
  }, []);

  const updateProfile = useCallback(async (values) => {
    const { data } = await profilesApi.updateProfile(values);
    setSession((current) => ({
      ...current,
      profile: { ...current.profile, ...data }
    }));
    return data;
  }, []);

  const switchRole = useCallback(async (role) => {
    const { data } = await profilesApi.switchRole(role);
    setSession((current) => ({
      ...current,
      profile: { ...current.profile, ...data.profile }
    }));
    return data;
  }, []);

  const updateAvatar = useCallback(async (file) => {
    const { data } = await profilesApi.uploadAvatar(file);
    setSession((current) => ({
      ...current,
      profile: { ...current.profile, ...data }
    }));
    return data;
  }, []);

  const removeAvatar = useCallback(async () => {
    await profilesApi.deleteAvatar();
    setSession((current) => ({
      ...current,
      profile: { ...current.profile, avatar_path: null, avatarUrl: null }
    }));
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      profile: session?.profile ?? null,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      switchRole,
      updateAvatar,
      removeAvatar
    }),
    [
      session,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      switchRole,
      updateAvatar,
      removeAvatar
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
