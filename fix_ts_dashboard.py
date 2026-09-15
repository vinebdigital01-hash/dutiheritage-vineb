with open("src/app/api/analytics/dashboard/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'await Collection.find({ _id: { $in: colViews.map(c => new mongoose.Types.ObjectId(c._id.toString())) } })',
    'await Collection.find({ _id: { $in: colViews.map(c => new mongoose.Types.ObjectId(c._id.toString())) } } as any)'
)

content = content.replace(
    'await Collection.find({ _id: { $in: Array.from(colAbandonMap.keys()).map(id => new mongoose.Types.ObjectId(id)) } })',
    'await Collection.find({ _id: { $in: Array.from(colAbandonMap.keys()).map(id => new mongoose.Types.ObjectId(id)) } } as any)'
)

content = content.replace(
    'await Product.find({ _id: { $in: productIds.map(id => id.toString()) } })',
    'await Product.find({ _id: { $in: productIds.map(id => id.toString()) } } as any)'
)

with open("src/app/api/analytics/dashboard/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Cast to any to fix TS")
