with open("src/app/api/analytics/dashboard/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    """const abandonedCollections = await Collection.find({ _id: { $in: Array.from(colAbandonMap.keys()) } }).select("name").lean();""",
    """import mongoose from "mongoose";\n    const abandonedCollections = await Collection.find({ _id: { $in: Array.from(colAbandonMap.keys()).map(id => new mongoose.Types.ObjectId(id)) } }).select("name").lean();"""
)

# Also fix the previous Collection.find if it's there
content = content.replace(
    """const collections = await Collection.find({ _id: { $in: colViews.map(c => c._id) } }).select("name").lean();""",
    """const collections = await Collection.find({ _id: { $in: colViews.map(c => new mongoose.Types.ObjectId(c._id.toString())) } }).select("name").lean();"""
)

# And fix Product.find
content = content.replace(
    """const cartProducts = await Product.find({ _id: { $in: productIds } }).select("collectionId").lean();""",
    """const cartProducts = await Product.find({ _id: { $in: productIds.map(id => id.toString()) } }).select("collectionId").lean();"""
)

with open("src/app/api/analytics/dashboard/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed TS error in dashboard api")
