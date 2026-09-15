with open("src/app/api/reviews/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'userId: isAdmin && body.isMarketing ? "MARKETING_REVIEW" : authUser.uid,',
    'userId: isAdmin && body.isMarketing ? `MARKETING_${Date.now()}_${Math.random().toString(36).substring(2)}` : authUser.uid,'
)

with open("src/app/api/reviews/route.ts", "w", encoding="utf-8") as f:
    f.write(content)

with open("src/app/api/reviews/bulk/route.ts", "r", encoding="utf-8") as f:
    bulk = f.read()

bulk = bulk.replace(
    'userId: "MARKETING_REVIEW_BULK",',
    'userId: `MARKETING_BULK_${Date.now()}_${Math.random().toString(36).substring(2)}`,'
)

with open("src/app/api/reviews/bulk/route.ts", "w", encoding="utf-8") as f:
    f.write(bulk)

# Also update the hardcoded message in api.ts so it's less confusing in the future
with open("src/lib/api.ts", "r", encoding="utf-8") as f:
    api = f.read()

api = api.replace(
    '{ error: "Duplicate key ?" slug or code already exists" }',
    '{ error: "Duplicate key ?" record already exists" }'
)
# Note: The ? is a character encoding issue from Python replacing the em-dash. I'll just rewrite it clean.
api = api.replace(
    'error: "Duplicate key ?" slug or code already exists"',
    'error: "Duplicate key ?" record already exists"'
)

with open("src/lib/api.ts", "w", encoding="utf-8") as f:
    f.write(api)

print("Fixed duplicate key bug for marketing reviews")
