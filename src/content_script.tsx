import { getStoredAddresses } from "./helpers/storage";
import { ChromeMessageId, CryptoAddress } from "./types";
import cogoToast from "cogo-toast";
import React from "react";
import { VerifiedText } from "./helpers/text";

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

const verify = (element: HTMLInputElement | HTMLTextAreaElement): boolean => {
  const eltAddress = element.value;
  if (addressesSet.has(eltAddress)) {
    const ogColor = element.style.color;
    if (ogColor !== FOUND_COLOR) {
      // This if protects against pressing verify twice in a row
      // (e.g. having ogColor be FOUND_COLOR and then verify pressed)
      colorForAddress[eltAddress] = ogColor;
      element.style.color = FOUND_COLOR;
      element.addEventListener("input", () => {
        element.style.color = colorForAddress[eltAddress];
      });
    }

    return true;
  }
  return false;
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

  inputTypes.forEach((inputType) => {
    const childInputs = node.querySelectorAll(inputType);
    childInputs.forEach((childInput) => {
      childInput.addEventListener("input", (e) => {
        const element = e.target as HTMLInputType;
        const verified = verify(element);

        if (verified) {
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

  // Check if any exist
  const nonZeroInputsList = inputs.length > 0;
  if (nonZeroInputsList == null) {
    sendResponse({ success: false, error: "No inputs available to check" });
    return;
  }

  for (const textInput of inputs) {
    const verified = verify(textInput);
    if (verified) {
      sendResponse({ success: true, address: textInput.value });
      return;
    }
  }
  // Not verified
  sendResponse({
    success: false,
    error: "No saved addresses matched any input field values",
  });
});
