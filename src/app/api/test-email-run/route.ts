import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { Product } from "@/models/Product";
import { 
  sendWelcome, sendCartAbandoned, sendWinback, sendWishlistReminder 
} from "@/lib/automations";
import { AutomationSettings } from "@/models/AutomationSettings";

export async function GET(request: Request) {
  try {
    await connectDB();
    const targetEmail = "liveproject072@gmail.com";
    
    // Temporarily force automations to be enabled
    let settings = await AutomationSettings.findById("automations");
    let originalSettings = null;
    if (settings) {
      originalSettings = settings.toObject();
    } else {
      settings = new AutomationSettings({ _id: "automations" });
    }
    
    const flows = ["welcome", "cart_abandoned", "winback", "wishlist_reminder"];
    for (const flow of flows) {
      if (!settings[flow]) settings[flow] = {};
      settings[flow].enabled = true;
    }
    await settings.save();
    
    const customer = await Customer.findOne();
    const product = await Product.findOne();
    
    const results = [];
    
    // Generate some random suffix to avoid the "already_sent" lock in claimAutomationSend
    const rand = Math.floor(Math.random() * 1000000).toString();
    
    if (customer) {
      const res1 = await sendWelcome({ name: "Test User", email: targetEmail, customerId: customer._id.toString() + rand });
      results.push({ email: "Welcome", result: res1 });
      
      const res2 = await sendCartAbandoned({
        name: "Test User",
        email: targetEmail,
        stage: "24h",
        cartId: "dummy-cart-24h" + rand,
        itemSummary: "Awesome Silk Saree and more"
      });
      results.push({ email: "Cart Abandoned 24h", result: res2 });
      
      const res3 = await sendCartAbandoned({
        name: "Test User",
        email: targetEmail,
        stage: "72h",
        cartId: "dummy-cart-72h" + rand,
        itemSummary: "Awesome Silk Saree and more"
      });
      results.push({ email: "Cart Abandoned 72h", result: res3 });
      
      const res4 = await sendWinback({
        name: "Test User",
        email: targetEmail,
        stage: "30d",
        customerId: customer._id.toString() + rand
      });
      results.push({ email: "Winback", result: res4 });
    }
    
    if (customer && product) {
      const res5 = await sendWishlistReminder({
        name: "Test User",
        email: targetEmail,
        stage: "3d",
        productId: product._id.toString(),
        productName: product.name,
        productSlug: product.slug,
        customerId: customer._id.toString() + rand
      });
      results.push({ email: "Wishlist", result: res5 });
    }
    
    // Restore settings
    if (originalSettings) {
      await AutomationSettings.findByIdAndUpdate("automations", originalSettings);
    } else {
      await AutomationSettings.findByIdAndDelete("automations");
    }
    
    return NextResponse.json({ success: true, results });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
