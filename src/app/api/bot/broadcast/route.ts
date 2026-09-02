import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phones, message, type } = body;

    if (!phones || !message) {
      return NextResponse.json(
        { error: "Phones and message are required." },
        { status: 400 }
      );
    }

    // In a real scenario, this would call the bot's /api/notify or the WhatsApp API directly
    // for each phone in the array. Since this is an admin dashboard task, we'll simulate it.
    
    // Convert comma separated string to array if needed
    const phoneList = Array.isArray(phones) 
      ? phones 
      : phones.split(",").map((p: string) => p.trim()).filter(Boolean);

    let successCount = 0;
    
    // Simulate API calls
    for (const phone of phoneList) {
      // Mock call
      console.log(`Broadcasting to ${phone}: ${message}`);
      successCount++;
    }

    return NextResponse.json({ 
      success: true, 
      sent: successCount, 
      message: `Successfully broadcasted to ${successCount} recipients.` 
    });

  } catch (error) {
    console.error("Broadcast Error:", error);
    return NextResponse.json(
      { error: "Failed to send broadcast." },
      { status: 500 }
    );
  }
}
