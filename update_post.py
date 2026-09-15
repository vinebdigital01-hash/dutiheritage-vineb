with open("src/app/api/reviews/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_create = """    const doc = await Review.create({
      productId,
      userId: isAdmin && body.isMarketing ? "MARKETING_REVIEW" : authUser.uid,
      userName: (isAdmin && body.userName) 
        ? String(body.userName).trim() 
        : (authUser.name || authUser.email?.split("@")[0] || "Customer"),
      rating,
      comment,
      images,
      status: isAdmin ? "approved" : "pending",
      isVerifiedPurchase: (isAdmin && body.isMarketing) ? true : !eligibility.isAdmin,
      orderId: eligibility.orderId,
    });"""

new_create = """    const reviewData: any = {
      productId,
      userId: isAdmin && body.isMarketing ? "MARKETING_REVIEW" : authUser.uid,
      userName: (isAdmin && body.userName) 
        ? String(body.userName).trim() 
        : (authUser.name || authUser.email?.split("@")[0] || "Customer"),
      rating,
      comment,
      images,
      status: isAdmin ? "approved" : "pending",
      isVerifiedPurchase: (isAdmin && body.isMarketing) ? true : !eligibility.isAdmin,
      orderId: eligibility.orderId,
    };
    
    // Backdating support for marketing reviews
    if (isAdmin && body.createdAt) {
      const parsedDate = new Date(body.createdAt);
      if (parsedDate <= new Date()) {
        reviewData.createdAt = parsedDate;
      } else {
        throw new ApiError("Review date cannot be in the future");
      }
    }

    const doc = await Review.create(reviewData);"""

content = content.replace(old_create, new_create)

with open("src/app/api/reviews/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated POST reviews")
