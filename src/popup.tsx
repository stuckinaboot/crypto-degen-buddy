import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Button from "@mui/material/Button";
import { CryptoAddress } from "./types";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import EditAddresses from "./EditAddresses";

enum Status {
  NONE = "none",
  FAILED = "failed",
  SUCCESS = "success",
}

// const addresses: CryptoAddress = {
//   "0xABCD7FB541eFOOE586CARBe4B1B41Bb55293EFGH": { name: "terra" },
// };

const CHROME_LOCAL_STORAGE_ADDRESSES_KEY = "cryptoAddresses";

const Popup = () => {
  const [foundAddress, setFoundAddress] = useState("");
  const [status, setStatus] = useState<Status>(Status.NONE);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [addresses, setAddresses] = useState<CryptoAddress>({});

  useEffect(() => {
    chrome.storage.local.get(CHROME_LOCAL_STORAGE_ADDRESSES_KEY, (result) => {
      setAddresses(
        result ? JSON.parse(result[CHROME_LOCAL_STORAGE_ADDRESSES_KEY]) : {}
      );
    });
  }, []);

  const performVerify = () => {
    setStatus(Status.NONE);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          { addresses: Object.keys(addresses) },
          (msg) => {
            setFoundAddress(msg.address);
            setStatus(msg.success ? Status.SUCCESS : Status.FAILED);
            setError(msg.error ?? "");
          }
        );
      }
    });
  };

  // Take addresses in as a param so we don't need to be concerned about
  // any React state updates (which may occur to addresses state variable)
  function saveAddressesToLocalStorage(addresses: CryptoAddress) {
    chrome.storage.local.set({
      [CHROME_LOCAL_STORAGE_ADDRESSES_KEY]: JSON.stringify(addresses),
    });
  }

  return (
    <Grid container style={{ minWidth: "400px", textAlign: "center" }}>
      <Grid item xs={12}>
        <Grid item xs={12}>
          <Typography variant="h6">Crypto Address Verifier</Typography>
        </Grid>
        {isEditing ? (
          <EditAddresses
            addresses={addresses}
            onUpdate={({ address, contents, deleteAddress }) => {
              let updatedAddresses = {};
              if (deleteAddress) {
                const newAddresses: CryptoAddress = {};
                Object.entries(addresses).forEach(([currAddress, contents]) =>
                  currAddress !== address
                    ? // Only add addresses that are different than the deleted address
                      (newAddresses[currAddress] = contents)
                    : null
                );
                updatedAddresses = newAddresses;
              } else {
                updatedAddresses = { ...addresses, [address]: contents };
              }
              setAddresses(updatedAddresses);
              saveAddressesToLocalStorage(updatedAddresses);
            }}
            onDone={() => {
              setIsEditing(false);
            }}
          />
        ) : (
          <Grid item xs={12}>
            <Grid item xs={12}>
              <Typography variant="caption">
                Press "Verify Address" to check if the crypto address you
                inputted on the open tab is one of your saved addresses
                <br />
                <br />
                Press "Edit addresses" to edit your saved addresses
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Button
                onClick={performVerify}
                variant="outlined"
                style={{ width: "100%" }}
              >
                Verify address
              </Button>
              <Box m={1} />
              <Button
                onClick={() => setIsEditing(true)}
                variant="outlined"
                style={{ width: "100%" }}
              >
                Edit addresses
              </Button>
            </Grid>
            <Grid item xs={12}>
              {status === Status.SUCCESS ? (
                <div>
                  <Typography variant="h5" style={{ color: "green" }}>
                    Verified!
                  </Typography>
                  <Typography>
                    The following cryptocurrency address was verified and can be
                    seen in green on your page
                    <br />
                    <b>
                      {addresses[foundAddress].name}
                      <br />
                      {foundAddress}
                    </b>
                  </Typography>
                </div>
              ) : status === Status.FAILED ? (
                <div>
                  <Typography variant="h5" style={{ color: "red" }}>
                    Failed!
                  </Typography>
                  <Typography>
                    {error ||
                      "No saved addresses matched any input addresses on this page"}
                  </Typography>
                </div>
              ) : null}
            </Grid>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
