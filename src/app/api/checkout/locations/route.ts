import { NextResponse } from "next/server";
import { State, City } from "country-state-city";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "states") {
    const states = State.getStatesOfCountry("IN").map((s) => ({
      name: s.name,
      isoCode: s.isoCode,
    }));
    return NextResponse.json(
      { states },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  }

  if (type === "cities") {
    const stateCode = searchParams.get("stateCode");
    if (!stateCode)
      return NextResponse.json({ error: "stateCode required" }, { status: 400 });
    const cities = City.getCitiesOfState("IN", stateCode).map((c) => ({
      name: c.name,
    }));
    return NextResponse.json(
      { cities },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  }

  return NextResponse.json(
    { error: "type must be 'states' or 'cities'" },
    { status: 400 }
  );
}
