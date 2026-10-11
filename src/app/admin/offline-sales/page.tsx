"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { useToast } from "@/components/admin/ui";
import {
  FiSearch,
  FiCheck,
  FiDownload,
  FiUploadCloud,
  FiPrinter,
  FiCopy,
  FiShoppingBag,
  FiFileText,
  FiX,
  FiRefreshCw,
  FiPlus,
  FiMinus,
} from "react-icons/fi";

type InventoryItem = {
  size: string;
  color?: string;
  stock: number;
  sku?: string;
};

type ProductOpt = {
  id: string;
  name: string;
  slug?: string;
  image: string;
  price: number;
  salePrice?: number | null;
  sizes?: string[];
  colors?: string[];
  inventory?: InventoryItem[];
};

type ClaimResult = {
  claimId: string;
  productId: string;
  productName: string;
  size: string;
  color?: string;
  quantity?: number;
  price: number;
  paymentMethod?: string;
  waUrl: string;
};

type ParsedCsvRow = {
  productId: string;
  productName: string;
  color: string;
  size: string;
  currentStock: number;
  quantitySold: number;
  newStock: string;
  sellingPrice: number;
};

export default function OfflineSalesPage() {
  const { show, Toast } = useToast();
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pos" | "bulk_csv">("pos");

  // Search & Filter
  const [search, setSearch] = useState("");

  // Selected item state for POS
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priceOverride, setPriceOverride] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerPhone, setCustomerPhone] = useState("");
  const [busy, setBusy] = useState(false);

  // Result / Modal state
  const [qrResult, setQrResult] = useState<ClaimResult | null>(null);
  const [directSaleSuccess, setDirectSaleSuccess] = useState<string | null>(null);

  // Bulk CSV state
  const [csvFileName, setCsvFileName] = useState("");
  const [csvRows, setCsvRows] = useState<ParsedCsvRow[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load products catalog
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await adminFetch<{ products: ProductOpt[] }>(
        "/api/products?all=1&limit=100"
      );
      setProducts(data.products || []);
      if (data.products?.[0] && !selectedProductId) {
        handleSelectProduct(data.products[0]);
      }
    } catch (e) {
      show(
        e instanceof AdminApiError ? e.message : "Could not load products catalog",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Currently selected product
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Available colors for the selected product
  const availableColors = useMemo(() => {
    if (!selectedProduct) return [];
    const fromInv = (selectedProduct.inventory || [])
      .map((i) => (i.color || "").trim())
      .filter(Boolean);
    const fromProd = (selectedProduct.colors || [])
      .map((c) => c.trim())
      .filter(Boolean);
    return Array.from(new Set([...fromInv, ...fromProd]));
  }, [selectedProduct]);

  // Available sizes (deduplicated to prevent duplicate key warning!)
  const availableSizes = useMemo(() => {
    if (!selectedProduct) return [];
    let raw: string[] = [];

    if (selectedProduct.inventory?.length) {
      if (selectedColor) {
        raw = selectedProduct.inventory
          .filter(
            (i) =>
              !i.color ||
              i.color.trim().toLowerCase() === selectedColor.trim().toLowerCase()
          )
          .map((i) => (i.size || "").trim());
      }
      if (!raw.length) {
        raw = selectedProduct.inventory.map((i) => (i.size || "").trim());
      }
    }

    if (!raw.length && selectedProduct.sizes?.length) {
      raw = selectedProduct.sizes.map((s) => s.trim());
    }

    // Deduplicate array values
    return Array.from(new Set(raw.filter(Boolean)));
  }, [selectedProduct, selectedColor]);

  // Get real-time stock for the chosen variant
  const currentVariantStock = useMemo(() => {
    if (!selectedProduct?.inventory?.length) return null;
    const row = selectedProduct.inventory.find(
      (i) =>
        (i.size || "").trim().toLowerCase() === selectedSize.trim().toLowerCase() &&
        (!selectedColor ||
          (i.color || "").trim().toLowerCase() ===
            selectedColor.trim().toLowerCase())
    );
    return row ? row.stock : 0;
  }, [selectedProduct, selectedSize, selectedColor]);

  // Handle product click
  const handleSelectProduct = (p: ProductOpt) => {
    setSelectedProductId(p.id);
    const defaultPrice =
      p.salePrice && p.salePrice > 0 ? p.salePrice : p.price;
    setPriceOverride(String(defaultPrice));
    setQuantity(1);

    // Initial color
    const colors = Array.from(
      new Set(
        [
          ...(p.inventory || []).map((i) => (i.color || "").trim()),
          ...(p.colors || []).map((c) => c.trim()),
        ].filter(Boolean)
      )
    );
    const initialColor = colors[0] || "";
    setSelectedColor(initialColor);

    // Initial size
    let sizes: string[] = [];
    if (p.inventory?.length) {
      sizes = p.inventory
        .filter(
          (i) =>
            !initialColor ||
            (i.color || "").trim().toLowerCase() ===
              initialColor.toLowerCase()
        )
        .map((i) => (i.size || "").trim());
      if (!sizes.length) sizes = p.inventory.map((i) => (i.size || "").trim());
    }
    if (!sizes.length && p.sizes?.length) {
      sizes = p.sizes.map((s) => s.trim());
    }
    const uniqueSizes = Array.from(new Set(sizes.filter(Boolean)));
    setSelectedSize(uniqueSizes[0] || "Free Size");
  };

  // Filter products by search input
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.slug && p.slug.toLowerCase().includes(q))
    );
  }, [products, search]);

  // 1. Action: Direct Offline Sale (Deducts stock immediately)
  const handleDirectSale = async () => {
    if (!selectedProductId || !selectedSize) {
      show("Please select product and size", "error");
      return;
    }
    if (currentVariantStock !== null && currentVariantStock < quantity) {
      show(
        `Insufficient stock! Only ${currentVariantStock} left for ${selectedSize}`,
        "error"
      );
      return;
    }

    setBusy(true);
    try {
      const priceVal = Number(priceOverride) || selectedProduct?.price || 0;
      await adminFetch<ClaimResult>("/api/admin/offline-claims", {
        method: "POST",
        body: JSON.stringify({
          productId: selectedProductId,
          size: selectedSize,
          color: selectedColor,
          quantity,
          price: priceVal,
          customerPhone,
          paymentMethod,
          deductStock: true,
        }),
      });

      // Update local state inventory immediately
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== selectedProductId) return p;
          const updatedInv = (p.inventory || []).map((item) => {
            const matchSize =
              (item.size || "").trim().toLowerCase() ===
              selectedSize.trim().toLowerCase();
            const matchColor =
              !selectedColor ||
              (item.color || "").trim().toLowerCase() ===
                selectedColor.trim().toLowerCase();
            if (matchSize && matchColor) {
              return { ...item, stock: Math.max(0, item.stock - quantity) };
            }
            return item;
          });
          return { ...p, inventory: updatedInv };
        })
      );

      setDirectSaleSuccess(
        `Sale recorded for ${selectedProduct?.name} (${selectedSize})! Stock deducted.`
      );
      show(`Sale completed: ${selectedProduct?.name} (${selectedSize})`);
    } catch (e) {
      show(
        e instanceof AdminApiError ? e.message : "Failed to record sale",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  // 2. Action: Generate WhatsApp Claim QR
  const handleGenerateQR = async () => {
    if (!selectedProductId || !selectedSize) {
      show("Please select product and size", "error");
      return;
    }
    setBusy(true);
    try {
      const priceVal = Number(priceOverride) || selectedProduct?.price || 0;
      const data = await adminFetch<ClaimResult>("/api/admin/offline-claims", {
        method: "POST",
        body: JSON.stringify({
          productId: selectedProductId,
          size: selectedSize,
          color: selectedColor,
          quantity,
          price: priceVal,
          customerPhone,
          paymentMethod,
          deductStock: true,
        }),
      });

      // Deduct locally
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== selectedProductId) return p;
          const updatedInv = (p.inventory || []).map((item) => {
            const matchSize =
              (item.size || "").trim().toLowerCase() ===
              selectedSize.trim().toLowerCase();
            const matchColor =
              !selectedColor ||
              (item.color || "").trim().toLowerCase() ===
                selectedColor.trim().toLowerCase();
            if (matchSize && matchColor) {
              return { ...item, stock: Math.max(0, item.stock - quantity) };
            }
            return item;
          });
          return { ...p, inventory: updatedInv };
        })
      );

      setQrResult(data);
      show(`Claim QR ${data.claimId} generated!`);
    } catch (e) {
      show(
        e instanceof AdminApiError ? e.message : "Failed to create claim QR",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  // -------------------------------------------------------------
  // Bulk CSV Logic
  // -------------------------------------------------------------

  // Download pre-populated CSV template with all products & variants
  const handleDownloadCsvTemplate = () => {
    if (!products.length) {
      show("No products found to export", "error");
      return;
    }

    const headers = [
      "Product ID",
      "Product Name",
      "Color",
      "Size",
      "Current Stock",
      "Quantity Sold Offline",
      "New Stock Override",
      "Selling Price",
    ];

    const rows: string[][] = [];

    for (const p of products) {
      const price = p.salePrice && p.salePrice > 0 ? p.salePrice : p.price;
      if (p.inventory && p.inventory.length > 0) {
        for (const inv of p.inventory) {
          rows.push([
            p.id,
            `"${p.name.replace(/"/g, '""')}"`,
            inv.color || "",
            inv.size || "Free Size",
            String(inv.stock || 0),
            "0", // Quantity Sold Offline default
            "", // New Stock Override default
            String(price),
          ]);
        }
      } else if (p.sizes && p.sizes.length > 0) {
        for (const s of p.sizes) {
          rows.push([
            p.id,
            `"${p.name.replace(/"/g, '""')}"`,
            (p.colors && p.colors[0]) || "",
            s,
            "0",
            "0",
            "",
            String(price),
          ]);
        }
      } else {
        rows.push([
          p.id,
          `"${p.name.replace(/"/g, '""')}"`,
          "",
          "Free Size",
          "0",
          "0",
          "",
          String(price),
        ]);
      }
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `duti_inventory_sales_template_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    show("Template downloaded! Edit Quantity Sold or New Stock and upload back.");
  };

  // Parse uploaded CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || "");
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          show("CSV is empty or missing data rows", "error");
          return;
        }

        const parsed: ParsedCsvRow[] = [];
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          // Simple CSV line splitter that handles quoted strings
          const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
          const cols: string[] = [];
          let match;
          while ((match = regex.exec(line)) !== null && cols.length < 8) {
            let val = match[1] || "";
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1).replace(/""/g, '"');
            }
            cols.push(val.trim());
            if (regex.lastIndex === line.length) break;
          }

          if (cols.length >= 5) {
            const productId = cols[0];
            const productName = cols[1];
            const color = cols[2];
            const size = cols[3];
            const currentStock = Number(cols[4]) || 0;
            const quantitySold = Number(cols[5]) || 0;
            const newStock = cols[6] || "";
            const sellingPrice = Number(cols[7]) || 0;

            if (productId) {
              parsed.push({
                productId,
                productName,
                color,
                size,
                currentStock,
                quantitySold,
                newStock,
                sellingPrice,
              });
            }
          }
        }

        setCsvRows(parsed);
        show(`Loaded ${parsed.length} items from CSV`);
      } catch {
        show("Failed to parse CSV file. Please use the downloaded template.", "error");
      }
    };

    reader.readAsText(file);
  };

  // Submit Bulk Updates
  const handleApplyBulkUpdates = async () => {
    const changedRows = csvRows.filter(
      (r) => r.quantitySold > 0 || (r.newStock !== "" && !isNaN(Number(r.newStock)))
    );

    if (!changedRows.length) {
      show("No changes detected. Fill 'Quantity Sold Offline' or 'New Stock Override' in the CSV.", "error");
      return;
    }

    setBulkBusy(true);
    try {
      const itemsToUpdate = changedRows.map((r) => ({
        productId: r.productId,
        size: r.size,
        color: r.color,
        quantitySold: r.quantitySold > 0 ? r.quantitySold : undefined,
        newStock:
          r.newStock !== "" && !isNaN(Number(r.newStock))
            ? Number(r.newStock)
            : undefined,
        price: r.sellingPrice,
      }));

      const res = await adminFetch<{
        success: boolean;
        updatedCount: number;
        totalSold: number;
        errors?: string[];
      }>("/api/admin/offline-sales/bulk", {
        method: "POST",
        body: JSON.stringify({ items: itemsToUpdate }),
      });

      if (res.success) {
        show(`Successfully updated ${res.updatedCount} items! Sold: ${res.totalSold} units.`);
        setCsvRows([]);
        setCsvFileName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        await loadProducts();
      } else {
        show(res.errors?.join(", ") || "Errors occurred while updating", "error");
      }
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Failed to apply bulk updates", "error");
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="w-full pb-16">
      {Toast}

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif tracking-[1.5px] uppercase font-bold text-neutral-900">
            Offline POS & QR Receipt
          </h1>
          <p className="text-[13px] text-neutral-500 mt-1">
            Boutique walk-in billing, WhatsApp claim QR generation, and bulk stock adjustment
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-xl border border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveTab("pos")}
            className={`flex items-center gap-2 px-4 py-2 text-[12px] font-semibold tracking-wider uppercase rounded-lg transition-all ${
              activeTab === "pos"
                ? "bg-white text-black shadow-sm"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            <FiShoppingBag className="text-base" />
            POS & Walk-in Sale
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bulk_csv")}
            className={`flex items-center gap-2 px-4 py-2 text-[12px] font-semibold tracking-wider uppercase rounded-lg transition-all ${
              activeTab === "bulk_csv"
                ? "bg-white text-black shadow-sm"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            <FiFileText className="text-base" />
            Bulk CSV Update
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: POS & Manual Product Grid (Matching User Screenshot) */}
      {/* ========================================================= */}
      {activeTab === "pos" && (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="relative w-full">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-lg" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-300 rounded-xl text-[14px] text-neutral-800 placeholder-neutral-400 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black text-sm"
              >
                <FiX />
              </button>
            )}
          </div>

          {/* Main Layout: Product Grid + Active Configuration Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Products Grid (2 cols on mobile, 3-4 on tablet, 5 on desktop) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-500 font-medium px-1">
                <span>Showing {filteredProducts.length} Products</span>
                <span>Click a product to select variant & bill</span>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-neutral-100 animate-pulse rounded-2xl h-64 border border-neutral-200"
                    />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-16 text-center bg-white border border-dashed border-neutral-300 rounded-2xl">
                  <p className="text-neutral-500 text-sm">No products found matching “{search}”</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredProducts.map((p) => {
                    const isSelected = p.id === selectedProductId;
                    const displayPrice =
                      p.salePrice && p.salePrice > 0 ? p.salePrice : p.price;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className={`group relative bg-white rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col ${
                          isSelected
                            ? "border-black ring-2 ring-black shadow-md"
                            : "border-neutral-200 hover:border-neutral-400 hover:shadow-sm"
                        }`}
                      >
                        <div className="aspect-[3/4] w-full bg-neutral-100 overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.image || "/images/velvet.jpg"}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-black text-white p-1 rounded-full text-xs shadow">
                              <FiCheck />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3
                            className="font-semibold text-[14px] text-neutral-900 truncate"
                            title={p.name}
                          >
                            {p.name}
                          </h3>
                          <p className="text-[13px] text-neutral-700 font-medium mt-0.5">
                            ₹{displayPrice}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Product Checkout / Variant Selector */}
            <div className="lg:col-span-1 bg-white border border-neutral-200 rounded-2xl p-5 md:p-6 shadow-sm sticky top-6 space-y-5">
              {selectedProduct ? (
                <>
                  <div className="flex gap-4 items-center pb-4 border-b border-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedProduct.image || "/images/velvet.jpg"}
                      alt=""
                      className="w-16 h-20 object-cover rounded-xl bg-neutral-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Selected Product
                      </span>
                      <h3 className="font-serif font-bold text-base text-neutral-900 truncate">
                        {selectedProduct.name}
                      </h3>
                      <p className="text-sm font-semibold text-neutral-800 mt-0.5">
                        Base: ₹
                        {selectedProduct.salePrice && selectedProduct.salePrice > 0
                          ? selectedProduct.salePrice
                          : selectedProduct.price}
                      </p>
                    </div>
                  </div>

                  {/* Color Selector */}
                  {availableColors.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold tracking-wider uppercase text-neutral-500">
                        Color / Variant
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {availableColors.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSelectedColor(c)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              selectedColor === c
                                ? "bg-black text-white border-black"
                                : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size Selector */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold tracking-wider uppercase text-neutral-500">
                      <span>Select Size</span>
                      {currentVariantStock !== null && (
                        <span
                          className={`font-semibold ${
                            currentVariantStock > 0
                              ? "text-emerald-700"
                              : "text-red-600"
                          }`}
                        >
                          {currentVariantStock > 0
                            ? `In Stock: ${currentVariantStock}`
                            : "Out of Stock"}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {availableSizes.length === 0 ? (
                        <span className="text-xs text-neutral-400">
                          Free Size (Single Variant)
                        </span>
                      ) : (
                        availableSizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedSize(s)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                              selectedSize === s
                                ? "bg-black text-white border-black"
                                : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black"
                            }`}
                          >
                            {s}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quantity & Selling Price */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold tracking-wider uppercase text-neutral-500">
                        Qty Sold
                      </label>
                      <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="px-3 py-2 text-neutral-600 hover:bg-neutral-100"
                        >
                          <FiMinus />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={quantity}
                          onChange={(e) =>
                            setQuantity(Math.max(1, Number(e.target.value) || 1))
                          }
                          className="w-full text-center text-sm font-semibold outline-none py-1"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => q + 1)}
                          className="px-3 py-2 text-neutral-600 hover:bg-neutral-100"
                        >
                          <FiPlus />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold tracking-wider uppercase text-neutral-500">
                        Selling Price (₹)
                      </label>
                      <input
                        type="number"
                        value={priceOverride}
                        onChange={(e) => setPriceOverride(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-semibold outline-none focus:border-black"
                        placeholder="Price"
                      />
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-neutral-500">
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["cash", "upi", "card"].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPaymentMethod(mode)}
                          className={`py-1.5 text-xs font-bold uppercase rounded-lg border transition-all ${
                            paymentMethod === mode
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : "bg-white text-neutral-700 border-neutral-200 hover:border-black"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Phone (Optional) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-neutral-500">
                      Customer Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 9876543210 (for WhatsApp receipt)"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black"
                    />
                  </div>

                  {/* Direct Sale Alert / Notice */}
                  {directSaleSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
                      <span>✓ {directSaleSuccess}</span>
                      <button
                        type="button"
                        onClick={() => setDirectSaleSuccess(null)}
                        className="text-emerald-900 font-bold ml-2"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 space-y-2.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleDirectSale}
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FiCheck />
                      {busy ? "Processing..." : "Record Offline Sale (Deduct Stock)"}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleGenerateQR}
                      className="w-full py-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FiPrinter />
                      {busy ? "Generating..." : "Generate WhatsApp QR Receipt"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-neutral-400">
                  <FiShoppingBag className="text-3xl mx-auto mb-2 text-neutral-300" />
                  <p className="text-xs">Pick a product from the list to start sale</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: Bulk CSV Inventory & Sales Adjustment              */}
      {/* ========================================================= */}
      {activeTab === "bulk_csv" && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 space-y-6 max-w-4xl shadow-sm">
          <div>
            <h2 className="text-lg font-serif font-bold text-neutral-900">
              Bulk Inventory & Offline Sales Update
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Export all products with their colors and sizes into an Excel CSV sheet,
              fill in offline quantities sold or stock overrides, and re-upload to update in one click.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Download Template Box */}
            <div className="border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                  Step 1
                </span>
                <h3 className="font-semibold text-sm text-neutral-800 mt-0.5">
                  Download Pre-Filled Template
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Contains all {products.length} current products with their exact
                  sizes, colors, and live stock values.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <FiDownload /> Download Products CSV Template
              </button>
            </div>

            {/* Upload File Box */}
            <div className="border border-dashed border-neutral-300 rounded-xl p-5 bg-white space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                  Step 2
                </span>
                <h3 className="font-semibold text-sm text-neutral-800 mt-0.5">
                  Upload Updated CSV
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  {csvFileName
                    ? `Selected file: ${csvFileName}`
                    : "Upload the CSV with 'Quantity Sold Offline' or 'New Stock Override' filled."}
                </p>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  className="w-full py-2.5 border border-black hover:bg-neutral-50 text-black rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <FiUploadCloud /> {csvFileName ? "Choose Different CSV" : "Select CSV File"}
                </label>
              </div>
            </div>
          </div>

          {/* CSV Preview Table */}
          {csvRows.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    CSV Rows Preview ({csvRows.length} items found)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Rows with changes will be highlighted below.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={bulkBusy}
                  onClick={handleApplyBulkUpdates}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiCheck />
                  {bulkBusy ? "Applying..." : "Apply Bulk Updates to Inventory"}
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto border border-neutral-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-50 sticky top-0 border-b border-neutral-200 font-bold uppercase text-neutral-500 text-[10px]">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Color</th>
                      <th className="p-3">Size</th>
                      <th className="p-3">Current Stock</th>
                      <th className="p-3">Qty Sold Offline</th>
                      <th className="p-3">New Stock Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {csvRows.map((row, idx) => {
                      const hasSale = row.quantitySold > 0;
                      const hasOverride =
                        row.newStock !== "" && !isNaN(Number(row.newStock));
                      return (
                        <tr
                          key={idx}
                          className={`${
                            hasSale
                              ? "bg-emerald-50/60 font-medium"
                              : hasOverride
                              ? "bg-blue-50/60 font-medium"
                              : "hover:bg-neutral-50"
                          }`}
                        >
                          <td className="p-3 truncate max-w-[180px]">
                            {row.productName}
                          </td>
                          <td className="p-3">{row.color || "—"}</td>
                          <td className="p-3 font-semibold">{row.size}</td>
                          <td className="p-3">{row.currentStock}</td>
                          <td className="p-3">
                            {hasSale ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                                -{row.quantitySold} Sold
                              </span>
                            ) : (
                              0
                            )}
                          </td>
                          <td className="p-3">
                            {hasOverride ? (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">
                                Set to {row.newStock}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* QR Code Receipt Modal                                     */}
      {/* ========================================================= */}
      {qrResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-center animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setQrResult(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-black p-1 text-lg"
            >
              <FiX />
            </button>

            <div>
              <span className="text-[10px] font-bold tracking-[2px] uppercase text-neutral-400">
                Offline Boutique Receipt
              </span>
              <h3 className="text-xl font-serif font-bold text-neutral-900 mt-0.5">
                Scan to Claim on WhatsApp
              </h3>
              <p className="text-xs text-neutral-500">
                Customer can scan this QR code with their camera to get order confirmation on WhatsApp.
              </p>
            </div>

            <div className="p-4 bg-white border border-neutral-200 rounded-xl inline-block shadow-inner">
              <QRCodeSVG
                value={qrResult.waUrl}
                size={220}
                level="M"
                includeMargin
              />
            </div>

            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Claim ID:</span>
                <span className="font-mono font-bold tracking-widest text-black">
                  {qrResult.claimId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Product:</span>
                <span className="font-semibold text-neutral-800 truncate max-w-[200px]">
                  {qrResult.productName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Variant:</span>
                <span className="font-medium text-neutral-800">
                  Size: {qrResult.size}
                  {qrResult.color ? ` · Color: ${qrResult.color}` : ""}
                  {qrResult.quantity && qrResult.quantity > 1
                    ? ` · Qty: ${qrResult.quantity}`
                    : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Total Price:</span>
                <span className="font-bold text-black">₹{qrResult.price}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(qrResult.waUrl);
                  show("WhatsApp link copied to clipboard!");
                }}
                className="py-2.5 border border-neutral-300 hover:border-black text-black rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <FiCopy /> Copy Link
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <FiPrinter /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
