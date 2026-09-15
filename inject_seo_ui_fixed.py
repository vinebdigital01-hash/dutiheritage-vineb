with open("src/components/admin/ProductForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_components = """
function CharCounter({ current, max, recommended }: { current: number, max: number, recommended?: number }) {
  let color = "bg-neutral-200";
  let textColor = "text-neutral-500";
  const percentage = (current / max) * 100;
  
  if (recommended && current > 0) {
    if (current <= recommended) {
      color = "bg-emerald-500";
      textColor = "text-emerald-600";
    } else if (current <= max * 0.9) {
      color = "bg-amber-400";
      textColor = "text-amber-600";
    } else {
      color = "bg-red-500";
      textColor = "text-red-600";
    }
  } else if (current > 0) {
    if (percentage > 90) {
      color = "bg-red-500";
      textColor = "text-red-600";
    } else if (percentage > 75) {
      color = "bg-amber-400";
      textColor = "text-amber-600";
    } else {
      color = "bg-emerald-500";
      textColor = "text-emerald-600";
    }
  }

  return (
    <div className="flex flex-col gap-1 mt-1">
      <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${color}`} 
          style={{ width: `${Math.min(percentage, 100)}%` }} 
        />
      </div>
      <div className={`flex justify-between text-[10px] ${textColor}`}>
        <span>{current} / {max} chars</span>
        {recommended ? <span>Recommended: {recommended}</span> : null}
      </div>
    </div>
  );
}

function GooglePreview({ title, description, slug }: { title: string, description: string, slug: string }) {
  const displayTitle = title || "Product Title";
  const displayDesc = description || "No meta description provided. Google will try to find a relevant part of your page text to show here.";
  
  return (
    <div className="mt-4 p-4 border rounded-lg bg-white shadow-sm font-sans col-span-full">
      <p className="text-[12px] text-neutral-500 uppercase tracking-widest mb-3">Google Search Preview</p>
      <div className="max-w-[600px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-xs">DH</div>
          <div>
            <p className="text-[14px] text-[#202124] leading-tight">Duti Heritage</p>
            <p className="text-[12px] text-[#4d5156] leading-tight">https://www.dutiheritage.co.in › products › {slug || 'product-slug'}</p>
          </div>
        </div>
        <h3 className="text-[20px] text-[#1a0dab] cursor-pointer hover:underline leading-normal truncate">
          {displayTitle} | Duti Heritage
        </h3>
        <p className="text-[14px] text-[#4d5156] mt-1 leading-snug line-clamp-2">
          {displayDesc}
        </p>
      </div>
    </div>
  );
}
"""

if "function CharCounter" not in content:
    parts = content.split("export function ProductForm")
    content = parts[0] + new_components + "export function ProductForm" + parts[1]
    with open("src/components/admin/ProductForm.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Injected components")
else:
    print("Already injected")
