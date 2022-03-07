const FOUND_COLOR = "green";

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  // Map address to original color for the element the address occurred in
  // Note: if address occurs in multiple inputs this could get messed up
  const colorForAddress: { [address: string]: string } = {};
  const cryptoAddresses: string[] = msg.addresses;

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

  const validTextInputs = [
    document.querySelectorAll("input"),
    document.querySelectorAll("textarea"),
  ];

  // Check if any exist
  const nonZeroInputsList = validTextInputs.find(
    (textInputs) => textInputs.length > 0
  );
  if (nonZeroInputsList == null) {
    sendResponse({ success: false, error: "No inputs available to check" });
    return;
  }

  for (const inputsList of validTextInputs) {
    for (const textInput of inputsList) {
      const verified = processor(textInput);
      if (verified) {
        return;
      }
    }
  }
  // Not verified
  sendResponse({
    success: false,
    error: "No saved addresses matched any input field values",
  });
});
