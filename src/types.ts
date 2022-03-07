export type CryptoAddressContents = { name: string };

export type CryptoAddress = {
  [address: string]: CryptoAddressContents;
};

export type AddressContentsInputType = {
  address: string;
  contents: CryptoAddressContents;
  deleteAddress: boolean;
};
