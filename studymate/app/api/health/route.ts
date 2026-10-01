export function GET() {
  return Response.json({
    service: "studymate-api",
    mobileApiVersion: 1,
    status: "ok",
    billingConfigured: Boolean(process.env.REVENUECAT_SECRET_API_KEY),
  }, { headers: { "Cache-Control": "no-store" } });
}
