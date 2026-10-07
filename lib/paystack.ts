// Paystack API wrapper — payments, subscriptions, bank account resolution,
// and transfers (provider withdrawals).
//
// In dev mode (no PAYSTACK_SECRET_KEY configured), mutating calls return a
// clearly-labelled mock response instead of throwing, so the rest of the
// booking/wallet/subscription flow can be exercised end-to-end locally.

import { createHmac } from "crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = "https://api.paystack.co";

const isLive = Boolean(PAYSTACK_SECRET_KEY);

async function paystackFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const json = await res.json();
  if (!res.ok || json.status === false) {
    throw new Error(json.message || "Paystack request failed");
  }
  return json;
}

export interface InitializeTransactionParams {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
}

export async function initializeTransaction(params: InitializeTransactionParams) {
  if (!isLive) {
    console.log("[PAYSTACK:DEV] initializeTransaction", params);
    return {
      status: true,
      data: {
        authorization_url: `${process.env.NEXT_PUBLIC_APP_URL}/mock-checkout?ref=${params.reference}`,
        access_code: "mock_access_code",
        reference: params.reference,
      },
    };
  }

  return paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      metadata: params.metadata,
      callback_url: params.callbackUrl,
    }),
  });
}

export async function verifyTransaction(reference: string) {
  if (!isLive) {
    console.log("[PAYSTACK:DEV] verifyTransaction", reference);
    return {
      status: true,
      data: { status: "success", reference, amount: 0, gateway_response: "Mock Approved (dev mode)" },
    };
  }

  return paystackFetch(`/transaction/verify/${reference}`);
}

export async function resolveBankAccount(accountNumber: string, bankCode: string) {
  if (!isLive) {
    console.log("[PAYSTACK:DEV] resolveBankAccount", accountNumber, bankCode);
    return { status: true, data: { account_number: accountNumber, account_name: "DEV MODE — unresolved" } };
  }

  return paystackFetch(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
}

export async function listBanks() {
  if (!isLive) {
    return { status: true, data: [{ name: "Dev Bank (mock)", code: "000", id: 1 }] };
  }
  return paystackFetch("/bank?country=nigeria");
}

export async function createTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
}) {
  if (!isLive) {
    console.log("[PAYSTACK:DEV] createTransferRecipient", params);
    return { status: true, data: { recipient_code: `MOCK_RCP_${Date.now()}` } };
  }

  return paystackFetch("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: "NGN",
    }),
  });
}

export async function initiateTransfer(params: { amountKobo: number; recipientCode: string; reason: string }) {
  if (!isLive) {
    console.log("[PAYSTACK:DEV] initiateTransfer", params);
    return { status: true, data: { transfer_code: `MOCK_TRF_${Date.now()}`, status: "success" } };
  }

  return paystackFetch("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: params.amountKobo,
      recipient: params.recipientCode,
      reason: params.reason,
    }),
  });
}

export async function createCustomer(params: { email: string; firstName: string; lastName: string; phone?: string }) {
  if (!isLive) {
    console.log("[PAYSTACK:DEV] createCustomer", params);
    return { status: true, data: { customer_code: `MOCK_CUS_${Date.now()}` } };
  }

  return paystackFetch("/customer", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone,
    }),
  });
}

export async function createDedicatedVirtualAccount(params: { customerCode: string; preferredBank?: string }) {
  if (!isLive) {
    console.log("[PAYSTACK:DEV] createDedicatedVirtualAccount", params);
    return {
      status: true,
      data: {
        account_number: "0" + Math.floor(100000000 + Math.random() * 899999999).toString(),
        bank: { name: "Dev Bank (mock)" },
        account_name: "BOKLE DEV MOCK ACCOUNT",
      },
    };
  }

  return paystackFetch("/dedicated_account", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerCode,
      preferred_bank: params.preferredBank || "wema-bank",
    }),
  });
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!isLive) return true; // dev mode: no real webhooks arrive
  if (!signature) return false;
  const hash = createHmac("sha512", PAYSTACK_SECRET_KEY!).update(rawBody).digest("hex");
  return hash === signature;
}

export const paystackMode = isLive ? "live" : "dev-mock";
