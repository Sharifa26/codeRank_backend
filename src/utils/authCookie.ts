import { Response } from "express";
import env from "../config/env";

export const AUTH_COOKIE_NAME = "codenova_auth";

const hostnameFor = (url: string): string | null => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

const backendIsHttps = env.BACKEND_URL.startsWith("https://");
const frontendHost = hostnameFor(env.FRONTEND_URL);
const backendHost = hostnameFor(env.BACKEND_URL);
const isCrossSite = Boolean(
  frontendHost && backendHost && frontendHost !== backendHost,
);

export const getAuthCookieOptions = () => {
  const secure = env.NODE_ENV === "production" || backendIsHttps;

  return {
    httpOnly: true,
    secure,
    sameSite: isCrossSite ? ("none" as const) : ("lax" as const),
    path: "/",
  };
};

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...getAuthCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
};

export const readCookie = (
  cookieHeader: string | undefined,
  name: string,
): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const prefix = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(prefix));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(prefix.length));
};
