import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { Order, Event, Cart, Customer, Product, Collection } from '@/models';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { handleApiError, jsonOk, requireMongo } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    await requireMongo();
    await requireAuth(req);

    const searchParams = req.nextUrl.searchParams;
    const daysParam = searchParams.get('days') || '30';
    const days = parseInt(daysParam, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Initializing response object
    const result = {
      overview: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, conversionRate: 0, totalCustomers: 0, newCustomers: 0, returningCustomers: 0, abandonedCarts: 0, abandonedCartValue: 0 },
      productPerformance: [] as any[],
      collectionPerformance: [] as any[],
      customerInsights: { topCustomers: [] as any[], cityDistribution: [] as any[], stateDistribution: [] as any[] },
      timeInsights: { bestDayOfWeek: [] as any[], bestHourOfDay: [] as any[], dailyTrends: [] as any[] },
      paymentInsights: { cod: 0, prepaid: 0, partial: 0 },
      funnel: { productViews: 0, addToCarts: 0, checkoutStarts: 0, purchases: 0 },
      adsRecommendations: [] as any[]
    };

    const dateMatch = { createdAt: { $gte: startDate } };
    const orderMatch = { createdAt: { $gte: startDate }, status: { $ne: 'Cancelled' as const } };

    // 1. Overview & Payment Insights
    try {
      const orders = await Order.find(orderMatch as any).select('total paymentMethod customer createdAt').lean();
      let revenue = 0;
      let cod = 0, prepaid = 0, partial = 0;
      const uniqueCustomers = new Set();
      
      orders.forEach((o: any) => {
        revenue += o.total || 0;
        const pm = o.paymentMethod?.toLowerCase() || '';
        if (pm.includes('cod') || pm.includes('cash')) cod++;
        else if (pm.includes('prepaid') || pm.includes('razorpay') || pm.includes('upi') || pm.includes('card')) prepaid++;
        else partial++;
        
        if (o.customer) {
          if (typeof o.customer === 'string') uniqueCustomers.add(o.customer);
          else if (o.customer._id) uniqueCustomers.add(o.customer._id.toString());
          else if (o.customer.email) uniqueCustomers.add(o.customer.email);
        }
      });

      result.overview.totalOrders = orders.length;
      result.overview.totalRevenue = revenue;
      result.overview.avgOrderValue = orders.length > 0 ? revenue / orders.length : 0;
      
      result.paymentInsights = { cod, prepaid, partial };

      const totalCustomers = await Customer.countDocuments({});
      const newCustomers = await Customer.countDocuments(dateMatch);
      result.overview.totalCustomers = totalCustomers;
      result.overview.newCustomers = newCustomers;
      result.overview.returningCustomers = Math.max(0, uniqueCustomers.size - newCustomers);

      const carts = await Cart.find({ ...dateMatch, status: 'abandoned' }).select('totalPrice').lean();
      result.overview.abandonedCarts = carts.length;
      result.overview.abandonedCartValue = carts.reduce((sum: number, cart: any) => sum + (cart.totalPrice || 0), 0);
    } catch (e) {
      console.error('Overview aggregation error', e);
    }

    // 2. Funnel & Events
    try {
      const events = await Event.aggregate([
        { $match: dateMatch },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);
      
      events.forEach((e: any) => {
        if (['product_view', 'view', 'page_view'].includes(e._id)) result.funnel.productViews += e.count;
        if (['add_to_cart', 'cart_add'].includes(e._id)) result.funnel.addToCarts += e.count;
        if (['checkout_start', 'begin_checkout'].includes(e._id)) result.funnel.checkoutStarts += e.count;
      });
      result.funnel.purchases = result.overview.totalOrders;

      if (result.funnel.productViews > 0) {
        result.overview.conversionRate = (result.funnel.purchases / result.funnel.productViews) * 100;
      }
    } catch (e) {
      console.error('Funnel aggregation error', e);
    }

    // 3. Product Performance
    try {
      const productStats = await Order.aggregate([
        { $match: orderMatch },
        { $unwind: '$items' },
        { 
          $group: { 
            _id: '$items.productId',
            name: { $first: '$items.name' },
            purchases: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 30 }
      ]);
      
      const validProductIds = productStats
        .map((p: any) => p._id)
        .filter((id: any) => id && mongoose.isValidObjectId(id))
        .map((id: any) => new mongoose.Types.ObjectId(id));

      const productViewsMap = new Map();
      const productAddsMap = new Map();
      
      if (validProductIds.length > 0) {
          const productEvents = await Event.aggregate([
            { $match: { ...dateMatch, productId: { $in: validProductIds } } },
            { 
              $group: { 
                _id: { productId: '$productId', type: '$type' },
                count: { $sum: 1 } 
              } 
            }
          ]);
          
          productEvents.forEach((ev: any) => {
            const pId = ev._id.productId?.toString();
            if (!pId) return;
            if (['product_view', 'view'].includes(ev._id.type)) {
              productViewsMap.set(pId, (productViewsMap.get(pId) || 0) + ev.count);
            }
            if (['add_to_cart', 'cart_add'].includes(ev._id.type)) {
              productAddsMap.set(pId, (productAddsMap.get(pId) || 0) + ev.count);
            }
          });
      }

      result.productPerformance = productStats.map((ps: any) => {
        const pIdStr = ps._id?.toString() || '';
        const v = productViewsMap.get(pIdStr) || 0;
        const a = productAddsMap.get(pIdStr) || 0;
        
        return {
          productId: pIdStr,
          name: ps.name || 'Unknown Product',
          views: v,
          addToCarts: a,
          purchases: ps.purchases || 0,
          revenue: ps.revenue || 0,
          conversionRate: v > 0 ? (ps.purchases / v) * 100 : 0,
          avgOrderValue: ps.purchases > 0 ? ps.revenue / ps.purchases : 0
        };
      });
    } catch (e) {
      console.error('Product performance error', e);
    }

    // 4. Collection Performance
    try {
      const collections = await Collection.find().select('_id name').lean();
      const products = await Product.find().select('_id collectionId').lean();
      
      const productToCollection = new Map();
      products.forEach((p: any) => {
        if (p.collectionId) {
          productToCollection.set(p._id.toString(), p.collectionId.toString());
        }
      });

      const collectionStats = new Map();
      collections.forEach((c: any) => {
        collectionStats.set(c._id.toString(), {
          collectionId: c._id.toString(),
          name: c.name || 'Unnamed',
          views: 0,
          revenue: 0,
          orders: 0,
          conversionRate: 0,
          abandonedCarts: 0
        });
      });

      // Map product stats up to their parent collections
      result.productPerformance.forEach((prod: any) => {
        const cId = productToCollection.get(prod.productId);
        if (cId && collectionStats.has(cId)) {
          const cStats = collectionStats.get(cId);
          cStats.views += prod.views || 0;
          cStats.revenue += prod.revenue || 0;
          cStats.orders += prod.purchases || 0;
        }
      });

      result.collectionPerformance = Array.from(collectionStats.values()).map((c: any) => ({
        ...c,
        conversionRate: c.views > 0 ? (c.orders / c.views) * 100 : 0
      })).sort((a: any, b: any) => b.views - a.views);

    } catch (e) {
      console.error('Collection performance error', e);
    }

    // 5. Customer Insights
    try {
      const topCustomers = await Customer.find()
        .sort({ totalSpent: -1 })
        .limit(10)
        .select('firstName lastName name email phone address totalSpent totalOrders')
        .lean();
        
      result.customerInsights.topCustomers = topCustomers.map((c: any) => ({
        name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown',
        email: c.email || '',
        phone: c.phone || '',
        city: c.address?.city || 'Unknown',
        totalSpent: c.totalSpent || 0,
        totalOrders: c.totalOrders || 0
      }));

      const cityDist = await Order.aggregate([
        { $match: orderMatch },
        { $match: { 'customer.city': { $exists: true, $ne: '' } } },
        { $group: { _id: '$customer.city', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]);
      result.customerInsights.cityDistribution = cityDist.map((c: any) => ({ city: c._id, count: c.count, revenue: c.revenue }));

      const stateDist = await Order.aggregate([
        { $match: orderMatch },
        { $match: { 'customer.state': { $exists: true, $ne: '' } } },
        { $group: { _id: '$customer.state', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]);
      result.customerInsights.stateDistribution = stateDist.map((s: any) => ({ state: s._id, count: s.count, revenue: s.revenue }));
    } catch (e) {
      console.error('Customer insights error', e);
    }

    // 6. Time Insights
    try {
      const dayOfWeekStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      const timeAgg = await Order.aggregate([
        { $match: orderMatch },
        { 
          $group: { 
            _id: {
              dayOfWeek: { $dayOfWeek: '$createdAt' },
              hour: { $hour: '$createdAt' },
              dateString: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            orders: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        }
      ]);

      const daysMap = new Map();
      const hoursMap = new Map();
      const datesMap = new Map();

      // Pad datesMap so the chart shows all days, including today
      const sd = new Date(startDate);
      sd.setHours(0, 0, 0, 0);
      for (let i = 0; i <= days; i++) {
        const d = new Date(sd);
        d.setDate(d.getDate() + i);
        datesMap.set(d.toISOString().split("T")[0], { orders: 0, revenue: 0 });
      }

      timeAgg.forEach((t: any) => {
        const d = t._id.dayOfWeek;
        if (!daysMap.has(d)) daysMap.set(d, { orders: 0, revenue: 0 });
        const dObj = daysMap.get(d);
        dObj.orders += t.orders;
        dObj.revenue += t.revenue;
        
        const h = t._id.hour;
        if (!hoursMap.has(h)) hoursMap.set(h, { orders: 0 });
        hoursMap.get(h).orders += t.orders;

        const dt = t._id.dateString;
        if (!datesMap.has(dt)) datesMap.set(dt, { orders: 0, revenue: 0 });
        const dtObj = datesMap.get(dt);
        dtObj.orders += t.orders;
        dtObj.revenue += t.revenue;
      });

      result.timeInsights.bestDayOfWeek = Array.from(daysMap.entries()).map(([dayIdx, data]) => ({
        day: dayOfWeekStr[dayIdx - 1] || 'Unknown',
        orders: data.orders,
        revenue: data.revenue
      })).sort((a, b) => b.revenue - a.revenue);

      result.timeInsights.bestHourOfDay = Array.from(hoursMap.entries()).map(([hour, data]) => ({
        hour,
        orders: data.orders
      })).sort((a, b) => b.orders - a.orders);

      result.timeInsights.dailyTrends = Array.from(datesMap.entries()).map(([date, data]) => ({
        date,
        orders: data.orders,
        revenue: data.revenue
      })).sort((a, b) => a.date.localeCompare(b.date));
      
    } catch (e) {
      console.error('Time insights error', e);
    }

    // 7. Ads Recommendations
    try {
      result.productPerformance.forEach((p: any) => {
        if (p.views > 50 && p.purchases === 0) {
          result.adsRecommendations.push({
            type: 'cut',
            title: `Cut spend on ${p.name}`,
            description: `High views (${p.views}) but zero purchases. Re-evaluate targeting or landing page.`,
            metric: `${p.views} views, 0 conv`
          });
        }
        
        if (p.conversionRate > 5 && p.views < 20 && p.views > 0) {
          result.adsRecommendations.push({
            type: 'push',
            title: `Scale ads for ${p.name}`,
            description: `Excellent conversion rate (${p.conversionRate.toFixed(1)}%) but low traffic.`,
            metric: `${p.conversionRate.toFixed(1)}% CVR`
          });
        }
      });

      const cartStart = result.funnel.addToCarts;
      const cartComplete = result.funnel.purchases;
      if (cartStart > 0) {
        const abandonRate = ((cartStart - cartComplete) / cartStart) * 100;
        if (abandonRate > 50) {
          result.adsRecommendations.push({
            type: 'retarget',
            title: `Increase retargeting budget`,
            description: `Cart abandonment is high (${abandonRate.toFixed(1)}%). Consider a discount offer.`,
            metric: `${abandonRate.toFixed(1)}% Abandonment`
          });
        }
      }

      if (result.timeInsights.bestDayOfWeek.length > 0 && result.timeInsights.bestHourOfDay.length > 0) {
        const bestDay = result.timeInsights.bestDayOfWeek[0].day;
        const bestHour = result.timeInsights.bestHourOfDay[0].hour;
        const ampm = bestHour >= 12 ? 'PM' : 'AM';
        const hour12 = bestHour % 12 || 12;
        
        result.adsRecommendations.push({
          type: 'schedule',
          title: `Focus ads on ${bestDay}s at ${hour12} ${ampm}`,
          description: `This is your peak converting time window. Increase bid modifiers here.`,
          metric: `Peak Time`
        });
      }

      if (result.customerInsights.cityDistribution.length > 0) {
        const topCity = result.customerInsights.cityDistribution[0];
        result.adsRecommendations.push({
          type: 'geo',
          title: `Double down on ${topCity.city}`,
          description: `Top performing city driving the most revenue. Create location-specific campaigns.`,
          metric: `${topCity.count} orders`
        });
      }
    } catch (e) {
      console.error('Recommendations error', e);
    }

    return jsonOk(result);
  } catch (error) {
    console.error('Analytics Insights API Error:', error);
    return handleApiError(error);
  }
}
