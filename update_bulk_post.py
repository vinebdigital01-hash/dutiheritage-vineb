with open("src/app/api/reviews/bulk/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_loop = """    for (const row of reviews) {
      const { productId, userName, rating, comment } = row;
      if (!productId || !userName || !rating || !comment) {
        continue; // Skip invalid rows
      }
      
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) continue;

      const doc = await Review.create({
        productId: String(productId).trim(),
        userId: "MARKETING_REVIEW_BULK",
        userName: String(userName).trim(),
        rating: numRating,
        comment: String(comment).trim(),
        images: [],
        status: "approved",
        isVerifiedPurchase: true,
      });

      createdReviews.push(toReview(doc.toObject()));
    }"""

new_loop = """    for (const row of reviews) {
      const { productId, userName, rating, comment, date } = row;
      if (!productId || !userName || !rating || !comment) {
        continue; // Skip invalid rows
      }
      
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) continue;

      const reviewData: any = {
        productId: String(productId).trim(),
        userId: "MARKETING_REVIEW_BULK",
        userName: String(userName).trim(),
        rating: numRating,
        comment: String(comment).trim(),
        images: [],
        status: "approved",
        isVerifiedPurchase: true,
      };

      if (date) {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime()) && parsedDate <= new Date()) {
          reviewData.createdAt = parsedDate;
        }
      }

      const doc = await Review.create(reviewData);
      createdReviews.push(toReview(doc.toObject()));
    }"""

content = content.replace(old_loop, new_loop)

with open("src/app/api/reviews/bulk/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated bulk POST reviews")
