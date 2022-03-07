import { getStoredAddresses } from "./storage";
import { ChromeMessageId, CryptoAddress } from "./types";
import cogoToast from "cogo-toast";
import React from "react";
import { Typography } from "@mui/material";

const FOUND_COLOR = "green";
const colorForAddress: { [address: string]: string } = {};

type HTMLInputType = HTMLTextAreaElement | HTMLInputElement;
let inputs: (HTMLTextAreaElement | HTMLInputElement)[] = [];
let addressesSet = new Set<string>();
let addresses: CryptoAddress = {};
const inputTypes = ["input", "textarea"];
const acceptableTagNames = new Set(
  inputTypes.map((inputType) => inputType.toUpperCase())
);

async function init() {
  addresses = await getStoredAddresses();
  addressesSet = new Set(Object.keys(addresses));
}
init();

document.addEventListener("DOMNodeInserted", (e) => {
  const node = e.target as HTMLElement;

  if (node == null) {
    return;
  }
  const tagName = node.tagName;
  if (tagName == null) {
    return;
  }

  if (acceptableTagNames.has(tagName)) {
    inputs.push(node as HTMLInputType);
  }

  inputTypes.forEach((inputType) => {
    const childInputs = node.querySelectorAll(inputType);
    childInputs.forEach((childInput) => {
      childInput.addEventListener("input", (e) => {
        const element = e.target as HTMLInputType;
        const val = element.value;
        const foundAddress = val;
        if (addressesSet.has(foundAddress)) {
          const ogColor = element.style.color;
          if (ogColor !== FOUND_COLOR) {
            // This if protects against pressing verify twice in a row
            // (e.g. having ogColor be FOUND_COLOR and then verify pressed)
            colorForAddress[foundAddress] = ogColor;
            element.style.color = FOUND_COLOR;
            element.addEventListener("input", () => {
              element.style.color = colorForAddress[foundAddress];
            });
          }

          const { hide } = cogoToast.success(
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
            </div>,
            {
              hideAfter:
                // seconds
                10,
              onClick: () => {
                if (hide == null) {
                  return;
                }
                hide();
              },
            }
          );
        }
        // Prevents this event from triggering a DOMNodeInserted event
        // which happens for some reason
        e.stopPropagation();
      });

      inputs.push(childInput as HTMLInputType);
    });
  });
});

chrome.runtime.onMessage.addListener(function (
  msg: { id: string } & any,
  sender,
  sendResponse
) {
  if (msg.id === ChromeMessageId.SET_ADDRESSES) {
    addressesSet = new Set(Object.keys(msg.addresses));
    return;
  }
  // Map address to original color for the element the address occurred in
  // Note: if address occurs in multiple inputs this could get messed up
  const cryptoAddresses: string[] = msg.addresses;
  addressesSet = new Set(cryptoAddresses);

  // Ensure some addresses exist in order to continue processing
  if (cryptoAddresses.length === 0) {
    sendResponse({ success: false, error: "No saved addresses" });
    return;
  }

  const processor = (element: HTMLInputElement | HTMLTextAreaElement) => {
    const foundAddress = cryptoAddresses.find(
      (address) => element.value === address
    );
    if (foundAddress != null) {
      const ogColor = element.style.color;
      if (ogColor !== FOUND_COLOR) {
        // This if protects against pressing verify twice in a row
        // (e.g. having ogColor be FOUND_COLOR and then verify pressed)
        colorForAddress[foundAddress] = ogColor;
        element.style.color = FOUND_COLOR;
        element.addEventListener("input", () => {
          element.style.color = colorForAddress[foundAddress];
        });
      }
      sendResponse({ success: true, address: foundAddress });
      return true;
    }
    return false;
  };

  // Check if any exist
  const nonZeroInputsList = inputs.length > 0;
  if (nonZeroInputsList == null) {
    sendResponse({ success: false, error: "No inputs available to check" });
    return;
  }

  for (const textInput of inputs) {
    const verified = processor(textInput);
    if (verified) {
      return;
    }
  }
  // Not verified
  sendResponse({
    success: false,
    error: "No saved addresses matched any input field values",
  });
});
