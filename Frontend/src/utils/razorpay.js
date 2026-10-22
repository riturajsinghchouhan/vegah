const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// One shared promise for the whole app: the SDK is fetched at most once, and every
// caller after the first resolves instantly instead of injecting another <script>.
let razorpayScriptPromise = null;
export const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_SRC}"]`);
    const script = existing || document.createElement("script");
    script.addEventListener("load", () => resolve(true));
    script.addEventListener("error", () => {
      razorpayScriptPromise = null; // let a retry re-attempt the download
      resolve(false);
    });
    if (!existing) {
      script.src = RAZORPAY_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
  return razorpayScriptPromise;
};
