import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { createCustomer, createDedicatedVirtualAccount } from "@/lib/paystack";

// Returns the user's Paystack Dedicated Virtual Account, creating one on
// first request (PRD P1: "Paystack Dedicated Virtual Accounts — bank
// transfer top-up"). Once created, any bank transfer to this account
// number tops up the wallet automatically via the Paystack webhook.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    if (user.dvaAccountNumber) {
      return apiSuccess({
        accountNumber: user.dvaAccountNumber,
        bankName: user.dvaBankName,
        accountName: user.dvaAccountName,
      });
    }

    if (!user.email) return apiError("Add an email to your profile before setting up bank transfer top-up", 400);

    let customerCode = user.paystackCustomerCode;
    if (!customerCode) {
      const [firstName, ...rest] = user.fullName.split(" ");
      const customer = await createCustomer({
        email: user.email,
        firstName: firstName || user.fullName,
        lastName: rest.join(" ") || firstName || user.fullName,
        phone: user.phone || undefined,
      });
      customerCode = customer.data.customer_code;
    }
    if (!customerCode) return apiError("Could not create Paystack customer", 502);

    const dva = await createDedicatedVirtualAccount({ customerCode });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        paystackCustomerCode: customerCode,
        dvaAccountNumber: dva.data.account_number,
        dvaBankName: dva.data.bank.name,
        dvaAccountName: dva.data.account_name,
      },
    });

    return apiSuccess({
      accountNumber: updated.dvaAccountNumber,
      bankName: updated.dvaBankName,
      accountName: updated.dvaAccountName,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
