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
        Verified!
      </Typography>
      <Typography>
        The following cryptocurrency address was verified and can be seen in
        green on your page
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
