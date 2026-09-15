with open("src/app/api/orders/export/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_response = """    const csvContent = csvLines.join("\\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders_export_${new Date().toISOString().split("T")[0]}.csv"`
      }
    });"""

new_response = """    const csvContent = csvLines.join("\\n");

    return new Response(JSON.stringify({ csv: csvContent }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });"""

content = content.replace(old_response, new_response)

with open("src/app/api/orders/export/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed API response format for order export")
