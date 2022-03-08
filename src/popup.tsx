import React, { useState } from "react";
import ReactDOM from "react-dom";
import Button from "@mui/material/Button";
import { ChromeMessageId, CryptoAddress } from "./types";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import EditAddresses from "./address-book/EditAddresses";
import useAsyncEffect from "use-async-effect";
import { getStoredAddresses, setStoredAddresses } from "./helpers/storage";
import { AppName, VerifiedText } from "./helpers/text";

enum Status {
  NONE = "none",
  FAILED = "failed",
  SUCCESS = "success",
}

const Popup = () => {
  const [foundAddress, setFoundAddress] = useState("");
  const [status, setStatus] = useState<Status>(Status.NONE);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [addresses, setAddresses] = useState<CryptoAddress>({});

  function sendMessageToActiveTab(
    msg: { id: ChromeMessageId } & any,
    callback: (result: any) => void
  ) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, msg, callback);
      }
    });
  }

  useAsyncEffect(async () => {
    const storedAddresses = await getStoredAddresses();
    setAddresses(storedAddresses);
    sendMessageToActiveTab(
      {
        id: ChromeMessageId.SET_ADDRESSES,
        addresses: storedAddresses,
      },
      () => {}
    );
  }, []);

  const performVerify = () => {
    setStatus(Status.NONE);
    sendMessageToActiveTab(
      {
        id: ChromeMessageId.OTHER,
        addresses: Object.keys(addresses),
      },
      (msg) => {
        setFoundAddress(msg.address);
        setStatus(msg.success ? Status.SUCCESS : Status.FAILED);
        setError(msg.error ?? "");
      }
    );
  };

  // Take addresses in as a param so we don't need to be concerned about
  // any React state updates (which may occur to addresses state variable)
  function saveAddressesToLocalStorage(addresses: CryptoAddress) {
    setStoredAddresses(addresses);
    sendMessageToActiveTab(
      {
        id: ChromeMessageId.SET_ADDRESSES,
        addresses: Object.keys(addresses),
      },
      (msg) => {}
    );
  }

  return (
    <Grid container style={{ minWidth: "400px", textAlign: "center" }}>
      <Grid item xs={12}>
        <Grid item xs={12}>
          <Typography variant="h6">
            <AppName />
          </Typography>
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
                <VerifiedText
                  verifiedAddress={foundAddress}
                  addressContents={addresses[foundAddress]}
                />
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
