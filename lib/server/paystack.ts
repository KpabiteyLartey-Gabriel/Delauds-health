type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel?: string;
    customer?: {
      email?: string;
    };
    metadata?: {
      bookingId?: string;
      clientUserId?: string;
      roomId?: string;
    };
  };
};

function getPaystackSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }
  return key;
}

export function getPaystackCallbackUrl(): string {
  const explicit = process.env.PAYSTACK_CALLBACK_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (!appUrl && process.env.NODE_ENV !== "production") {
    return "http://localhost:3000/api/payments/paystack/callback";
  }

  if (!appUrl) {
    throw new Error(
      "Set PAYSTACK_CALLBACK_URL or NEXT_PUBLIC_APP_URL for Paystack callbacks",
    );
  }
  return `${appUrl.replace(/\/$/, "")}/api/payments/paystack/callback`;
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
      currency: "GHS",
    }),
  });

  const data = (await res.json()) as PaystackInitializeResponse;
  if (!res.ok || !data.status || !data.data?.authorization_url) {
    throw new Error(data.message || "Failed to initialize Paystack transaction");
  }
  return data.data;
}

export async function verifyPaystackTransaction(reference: string) {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getPaystackSecretKey()}`,
      },
    },
  );

  const data = (await res.json()) as PaystackVerifyResponse;
  if (!res.ok || !data.status || !data.data) {
    throw new Error(data.message || "Failed to verify Paystack transaction");
  }
  return data.data;
}
