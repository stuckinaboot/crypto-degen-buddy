import { CryptoAddress } from "./types";

const CHROME_LOCAL_STORAGE_ADDRESSES_KEY = "cryptoAddresses";

export async function getStoredAddresses(): Promise<CryptoAddress> {
  return new Promise((resolve) =>
    chrome.storage.local.get(CHROME_LOCAL_STORAGE_ADDRESSES_KEY, (result) => {
      const parsedAddresses: CryptoAddress = result
        ? JSON.parse(result[CHROME_LOCAL_STORAGE_ADDRESSES_KEY])
        : {};
      resolve(parsedAddresses);
    })
  );
}

export async function setStoredAddresses(
  addresses: CryptoAddress
): Promise<void> {
  await chrome.storage.local.set({
    [CHROME_LOCAL_STORAGE_ADDRESSES_KEY]: JSON.stringify(addresses),
  });
}
