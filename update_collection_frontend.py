with open("src/app/collections/[slug]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# I want to add the banner just below the header.
old_ui = """      {/* Header */}
      <div className="bg-[#f9f9f9] py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-serif text-black uppercase tracking-[2px]">
            {collection.name}
          </h1>
          {collection.seoDescription && (
            <p className="mt-4 text-neutral-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              {collection.seoDescription}
            </p>
          )}
        </div>
      </div>"""

new_ui = """      {/* Header */}
      <div className="bg-[#f9f9f9] py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-serif text-black uppercase tracking-[2px]">
            {collection.name}
          </h1>
          {collection.seoDescription && (
            <p className="mt-4 text-neutral-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              {collection.seoDescription}
            </p>
          )}
        </div>
      </div>
      
      {collection.discountBanner && (
        <div className="w-full bg-black text-white text-center py-3 text-xs md:text-sm font-bold tracking-[1px] uppercase">
          {collection.discountBanner}
        </div>
      )}"""

content = content.replace(old_ui, new_ui)

with open("src/app/collections/[slug]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Collection Frontend Page")
