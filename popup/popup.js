const inputs = document.querySelectorAll("input[data-key]");

chrome.storage.sync.get(RSB_DEFAULTS, (settings) => {
  for (const input of inputs) input.checked = settings[input.dataset.key];
});

for (const input of inputs) {
  input.addEventListener("change", () => {
    chrome.storage.sync.set({ [input.dataset.key]: input.checked });
  });
}
