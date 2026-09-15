with open("src/lib/auth-client.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("export type SyncResult = {\n  profile: UserProfile | null;\n  isAdmin: boolean;\n  adminRole?: string | null;\n  customerId?: string;\n};", "export type SyncResult = {\n  profile: UserProfile | null;\n  isAdmin: boolean;\n  adminRole?: string | null;\n  customerId?: string;\n  isFrozen?: boolean;\n};")
content = content.replace("      adminRole?: string | null;\n      customer?: { id?: string };\n    };", "      adminRole?: string | null;\n      isFrozen?: boolean;\n      customer?: { id?: string };\n    };")
content = content.replace("      adminRole: data.adminRole || null,\n      customerId: data.customer?.id,\n    };", "      adminRole: data.adminRole || null,\n      isFrozen: Boolean(data.isFrozen),\n      customerId: data.customer?.id,\n    };")
content = content.replace("return { profile: null, isAdmin: false, adminRole: null };", "return { profile: null, isAdmin: false, adminRole: null, isFrozen: false };")

with open("src/lib/auth-client.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated auth client")
