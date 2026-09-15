import re

def add_cache(path, cache_str, repl_str):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We will just replace return jsonOk({ ... }) with return new Response(...)
    content = re.sub(
        r'return jsonOk\(\{(.*?)\}\);',
        r'return new Response(JSON.stringify({\1}), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "' + cache_str + r'" } });',
        content,
        flags=re.DOTALL
    )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

add_cache("src/app/api/checkout/config/route.ts", "public, s-maxage=300", "checkout/config")
add_cache("src/app/api/reviews/route.ts", "public, s-maxage=60, stale-while-revalidate=120", "reviews")
