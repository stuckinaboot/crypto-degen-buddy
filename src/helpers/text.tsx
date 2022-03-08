import { Typography } from "@mui/material";
import React from "react";
import { CryptoAddressContents } from "../types";

export function VerifiedText({
  verifiedAddress,
  addressContents,
}: {
  verifiedAddress: string;
  addressContents: CryptoAddressContents;
}): React.ReactElement {
  return (
    <div>
      <Typography variant="h5" style={{ color: "green" }}>
        Verified ✅
      </Typography>
      <Typography>
        The following cryptocurrency address was verified by <AppName /> and has
        been marked green on your page
        <br />
        <b>
          {addressContents.name}
          <br />
          {verifiedAddress}
        </b>
      </Typography>
    </div>
  );
}

export function AppName(): React.ReactElement {
  return <>Crypto Address Verifier</>;
}
