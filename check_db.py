from pymongo import MongoClient
import json
import os

client = MongoClient(os.environ.get("MONGODB_URI", "mongodb+srv://duti:duti@cluster0.zox9u.mongodb.net/dutiheritage?retryWrites=true&w=majority&appName=Cluster0"))
db = client.get_default_database()
prod = db.products.find_one({"trackInventory": True})
if prod:
    prod['_id'] = str(prod['_id'])
    prod['createdAt'] = str(prod['createdAt'])
    prod['updatedAt'] = str(prod['updatedAt'])
    for inv in prod.get('inventory', []):
        if '_id' in inv:
            inv['_id'] = str(inv['_id'])
    print(json.dumps(prod, indent=2))
else:
    print("No products tracking inventory")
