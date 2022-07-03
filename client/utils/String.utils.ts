import CryptoJS from "crypto-js";
import { CRYPTO_SECRET } from "../constants/configuration";

export const isValidQueryParam = (
  ...data: (string | string[] | undefined)[]
) => {
  let hasError = false;
  data.forEach((item) => {
    if (!item || typeof item !== "string") {
      hasError = true;
    }
  });
  return !hasError;
};

export const decryptAccessToken = (encryptedAccessToken: string) =>
  CryptoJS.AES.decrypt(encryptedAccessToken, CRYPTO_SECRET).toString(
    CryptoJS.enc.Utf8
  );

export const encryptToken = (token: string) =>
  CryptoJS.AES.encrypt(token, CRYPTO_SECRET).toString();

export function capitalize(input: string) {
  return input[0].toUpperCase() + input.slice(1);
}

export function normalizeString(input: string) {
  return capitalize(input).replace(/\W+/, "_");
}

export const bufferTohex = (buf: Buffer) => `0x${buf.toString("hex")}`;
