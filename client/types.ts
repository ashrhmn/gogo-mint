export interface DiscordAccessTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface DiscordUserResponse {
  id: string;
  username: string;
  avatar: string | null;
  avatar_decoration: null;
  discriminator: string;
  public_flags: number;
  flags: number;
  banner: null;
  banner_color: string;
  accent_color: number;
  locale: string;
  mfa_enabled: boolean;
}
