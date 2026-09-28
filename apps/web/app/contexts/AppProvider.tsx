"use client";

import { createContext, useContext, useState } from "react";

interface IAppContext {
  accessToken: string;
  refreshToken: string;
  setAccessToken: (accessToken: string) => void;
  setRefreshToken: (refreshToken: string) => void;
}

export const AppContext = createContext<IAppContext>({
  accessToken: "",
  refreshToken: "",
  setAccessToken: () => {},
  setRefreshToken: () => {},
});

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

export const AppProvider = ({
  children,
  initialAccessToken,
  initialRefreshToken,
}: {
  children: React.ReactNode;
  initialAccessToken: string;
  initialRefreshToken: string;
}) => {
  const [accessToken, setAccessToken] = useState<string>(initialAccessToken);
  const [refreshToken, setRefreshToken] = useState<string>(initialRefreshToken);

  return (
    <AppContext.Provider
      value={{ accessToken, refreshToken, setAccessToken, setRefreshToken }}
    >
      {children}
    </AppContext.Provider>
  );
};
