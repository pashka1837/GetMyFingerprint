export type OnlyfansPageAuthSnapshot = {
  isAuth: boolean;
  isReady: boolean;
};

export type FingerprintResult = {
  authUser: {
    id: string | number;
    username: string;
    [key: string]: any;
  };
  userAgent: string;
  bcTokenSha: string | null;
  userId: string | number;
};

export type FingerprintPayload = FingerprintResult & {
  cookies: any[];
};

export type FailedFPPayload = {
  message: string;
};
