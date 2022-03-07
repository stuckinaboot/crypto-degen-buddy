export type CryptoAddressContents = { name: string };

export type CryptoAddress = {
  [address: string]: CryptoAddressContents;
};

export type AddressContentsInputType = {
  address: string;
  contents: CryptoAddressContents;
  deleteAddress: boolean;
};

export enum ChromeMessageId {
  SET_ADDRESSES = "set_addresses",
  OTHER = "other",
}
