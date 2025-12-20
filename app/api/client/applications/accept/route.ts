import { NextResponse } from "next/server";
import { acceptApplication } from "@/lib/actions/booking-actions";

export async function POST(req: Request) {
  try {
    const { applicationId, date, compensation, notes } = (await req.json()) as {
      applicationId: string;
      date?: string;
      compensation?: string;
      notes?: string;
    };

    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
    }

    const numericComp = compensation
      ? Number(String(compensation).replace(/[^0-9.-]/g, ""))
      : undefined;

    const result = await acceptApplication({
      applicationId,
      date,
      compensation: Number.isFinite(numericComp as number) ? (numericComp as number) : undefined,
      notes,
    });

    if (result.error) {
      const status =
        result.error === "Unauthorized"
          ? 401
          : result.error === "Forbidden"
            ? 403
            : result.error === "Application not found"
              ? 404
              : result.error === "Cannot accept a rejected application"
                ? 409
              : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, bookingId: result.bookingId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


