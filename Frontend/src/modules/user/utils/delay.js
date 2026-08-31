export const delay = (ms = 250) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
