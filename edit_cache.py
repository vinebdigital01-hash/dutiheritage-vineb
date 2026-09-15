import re
def add_cache(path, cache_str):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace jsonOk({ ... }) with new Response
    # Or just replace the return statement for collections
    if "api/collections" in path:
        content = re.sub(
            r'return jsonOk\(\{ collections \}\);',
            r'return new Response(JSON.stringify({ collections }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "' + cache_str + r'" } });',
            content
        )
        content = re.sub(
            r'return jsonOk\(\{ collection \}\);',
            r'return new Response(JSON.stringify({ collection }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "' + cache_str + r'" } });',
            content
        )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

add_cache("src/app/api/collections/route.ts", "public, s-maxage=120, stale-while-revalidate=600")
