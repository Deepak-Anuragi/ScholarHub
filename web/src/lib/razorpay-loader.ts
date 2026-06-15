// Lazily loads the Razorpay checkout script and returns a typed openCheckout helper.

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

function injectScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("razorpay-script")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script."));
    document.body.appendChild(script);
  });
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
  theme?: { color?: string };
  prefill?: { name?: string; email?: string; contact?: string };
};

export async function loadRazorpay(options: RazorpayOptions): Promise<void> {
  await injectScript();

  return new Promise((resolve) => {
    const rzp = new window.Razorpay({
      ...options,
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        await options.handler(response);
        resolve();
      },
      modal: {
        ondismiss: () => resolve(),
      },
    });
    rzp.open();
  });
}
