with open("src/app/api/reports/monthly/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_auth = """    const authHeader = request.headers.get("authorization");
    
    // If not a Vercel cron request (which has specific headers), enforce admin
    if (request.headers.get("user-agent") !== "vercel-cron") {
       // Only allow admin for manual GET
       await requireAuth(request, { admin: true });
    }"""

new_auth = """    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // Check if it's a valid CRON request (Vercel or GitHub Action with Bearer token)
    const isCronRequest = 
      request.headers.get("user-agent") === "vercel-cron" || 
      (cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isCronRequest) {
       // Only allow admin for manual GET if not a valid cron request
       await requireAuth(request, { admin: true });
    }"""
    
content = content.replace(old_auth, new_auth)

with open("src/app/api/reports/monthly/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated API auth")
