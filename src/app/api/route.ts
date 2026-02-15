import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Sunshade simulator API is running" });
}
