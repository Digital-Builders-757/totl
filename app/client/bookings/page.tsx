import { redirect } from "next/navigation";
import ClientBookingsClient from "@/app/client/bookings/client-bookings-client";
import type { Booking } from "@/app/client/bookings/types";
import { getClientBookings } from "@/lib/actions/booking-actions";
import { getBootState } from "@/lib/actions/boot-actions";
import { ONBOARDING_PATH, PATHS } from "@/lib/constants/routes";
import { isRedirectError } from "@/lib/is-redirect-error";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
const CLIENT_BOOKINGS_PATH = "/client/bookings";

export default async function ClientBookingsPage() {
  try {
    const boot = await getBootState();
    if (!boot) redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(CLIENT_BOOKINGS_PATH)}`);
    if (boot.needsOnboarding) redirect(ONBOARDING_PATH);
    if (boot.nextPath !== PATHS.CLIENT_DASHBOARD && boot.nextPath !== CLIENT_BOOKINGS_PATH) {
      redirect(boot.nextPath);
    }

    const bookingsResult = await getClientBookings();
    const initialBookings = bookingsResult.bookings
      ? (bookingsResult.bookings as Booking[])
      : [];

    return <ClientBookingsClient userId={boot.userId} initialBookings={initialBookings} />;
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    logger.error("[client/bookings] Error in server component", error);
    redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(CLIENT_BOOKINGS_PATH)}`);
  }
}

