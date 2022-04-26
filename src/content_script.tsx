import { getStoredAddresses } from "./helpers/storage";
import { ChromeMessageId, CryptoAddress } from "./types";
import cogoToast from "cogo-toast";
import React from "react";
import { VerifiedText } from "./helpers/text";

const FOUND_COLOR = "green";
const TRACKED_INPUT_TYPES = ["input", "textarea"];
// Map address to original color for the element the address occurred in
// Note: if address occurs in multiple inputs this could get messed up
const colorForAddress: { [address: string]: string } = {};

type HTMLInputType = HTMLTextAreaElement | HTMLInputElement;
const inputs: (HTMLTextAreaElement | HTMLInputElement)[] = [];
let addressesSet = new Set<string>();
let addresses: CryptoAddress = {};
const acceptableTagNames = new Set(
  TRACKED_INPUT_TYPES.map((inputType) => inputType.toUpperCase())
);

async function refreshSavedAddresses() {
  addresses = await getStoredAddresses();
  addressesSet = new Set(Object.keys(addresses));
}
refreshSavedAddresses();

const verify = (element: HTMLInputElement | HTMLTextAreaElement): boolean => {
  const eltAddress = element.value;
  if (!addressesSet.has(eltAddress)) {
    return false;
  }
  const ogColor = element.style.color;
  if (ogColor !== FOUND_COLOR) {
    // This if protects against pressing verify twice in a row
    // (e.g. having ogColor be FOUND_COLOR and then verify pressed)
    colorForAddress[eltAddress] = ogColor;
    element.style.color = FOUND_COLOR;
    element.addEventListener(
      "input",
      () => (element.style.color = colorForAddress[eltAddress]),
      // Only run this listener for first input after match
      { once: true }
    );
  }

  return true;
};

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

  TRACKED_INPUT_TYPES.forEach((inputType) => {
    const childInputs = node.querySelectorAll(inputType);
    childInputs.forEach((childInput) => {
      childInput.addEventListener("input", (e) => {
        const element = e.target as HTMLInputType;
        const verified = verify(element);

        if (!verified) {
          return;
        }
        const address = element.value;
        const { hide } = cogoToast.success(
          <VerifiedText
            verifiedAddress={address}
            addressContents={addresses[address]}
          />,
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
      });

      inputs.push(childInput as HTMLInputType);
    });
  });
});

chrome.runtime.onMessage.addListener(function (
  msg: { id: string } & any,
  _sender,
  sendResponse
) {
  if (msg.id === ChromeMessageId.SET_ADDRESSES) {
    refreshSavedAddresses();
    return;
  }

  // Ensure some addresses exist in order to continue processing
  if (addressesSet.size === 0) {
    sendResponse({ success: false, error: "You have not saved any addresses. Click \"Edit Addresses\"." });
    return;
  }

  // Check if any exist
  if (inputs.length === 0) {
    sendResponse({ success: false, error: "There are no crypto addresses inputted on this open tab. Click \"Verify Address\" to try again." });
    return;
  }

  const verifiedTextInput = inputs.find((textInput) => verify(textInput));
  if (verifiedTextInput != null) {
    sendResponse({ success: true, address: verifiedTextInput.value });
    return;
  }

  // Not verified
  sendResponse({
    success: false,
    error: "No values on this page match with any of your saved addresses.",
  });
});
