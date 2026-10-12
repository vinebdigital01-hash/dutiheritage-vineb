/**
 * Indian Pincode to State & City mapping utility
 * Combines an instant synchronous prefix resolver with the India Post postal API.
 */

export type PincodeLocation = {
  valid: boolean;
  state: string;
  city: string;
  district?: string;
  pincode: string;
};

// Comprehensive prefix to State mapping for India (28 states, 8 UTs)
const PIN_PREFIX_MAP: Record<string, { state: string; defaultCity: string }> = {
  // Delhi (11)
  "11": { state: "Delhi", defaultCity: "Delhi" },

  // Haryana (12, 13)
  "12": { state: "Haryana", defaultCity: "Gurugram" },
  "13": { state: "Haryana", defaultCity: "Ambala" },

  // Punjab (14, 15)
  "14": { state: "Punjab", defaultCity: "Ludhiana" },
  "15": { state: "Punjab", defaultCity: "Bathinda" },

  // Chandigarh (16)
  "16": { state: "Chandigarh", defaultCity: "Chandigarh" },

  // Himachal Pradesh (17)
  "17": { state: "Himachal Pradesh", defaultCity: "Shimla" },

  // Jammu and Kashmir & Ladakh (18, 19)
  "18": { state: "Jammu and Kashmir", defaultCity: "Jammu" },
  "19": { state: "Jammu and Kashmir", defaultCity: "Srinagar" },

  // Uttar Pradesh & Uttarakhand (20-28)
  "20": { state: "Uttar Pradesh", defaultCity: "Aligarh" },
  "21": { state: "Uttar Pradesh", defaultCity: "Allahabad" },
  "22": { state: "Uttar Pradesh", defaultCity: "Lucknow" },
  "23": { state: "Uttar Pradesh", defaultCity: "Varanasi" },
  "24": { state: "Uttar Pradesh", defaultCity: "Bareilly" },
  "25": { state: "Uttar Pradesh", defaultCity: "Meerut" },
  "26": { state: "Uttar Pradesh", defaultCity: "Pilibhit" },
  "27": { state: "Uttar Pradesh", defaultCity: "Gorakhpur" },
  "28": { state: "Uttar Pradesh", defaultCity: "Jhansi" },

  // Rajasthan (30-34)
  "30": { state: "Rajasthan", defaultCity: "Jaipur" },
  "31": { state: "Rajasthan", defaultCity: "Udaipur" },
  "32": { state: "Rajasthan", defaultCity: "Kota" },
  "33": { state: "Rajasthan", defaultCity: "Bikaner" },
  "34": { state: "Rajasthan", defaultCity: "Jodhpur" },

  // Gujarat & Daman/Diu (36-39)
  "36": { state: "Gujarat", defaultCity: "Rajkot" },
  "37": { state: "Gujarat", defaultCity: "Bhuj" },
  "38": { state: "Gujarat", defaultCity: "Ahmedabad" },
  "39": { state: "Gujarat", defaultCity: "Surat" },

  // Maharashtra & Goa (40-44)
  "40": { state: "Maharashtra", defaultCity: "Mumbai" },
  "41": { state: "Maharashtra", defaultCity: "Pune" },
  "42": { state: "Maharashtra", defaultCity: "Nashik" },
  "43": { state: "Maharashtra", defaultCity: "Aurangabad" },
  "44": { state: "Maharashtra", defaultCity: "Nagpur" },

  // Madhya Pradesh & Chhattisgarh (45-49)
  "45": { state: "Madhya Pradesh", defaultCity: "Indore" },
  "46": { state: "Madhya Pradesh", defaultCity: "Bhopal" },
  "47": { state: "Madhya Pradesh", defaultCity: "Gwalior" },
  "48": { state: "Madhya Pradesh", defaultCity: "Jabalpur" },
  "49": { state: "Chhattisgarh", defaultCity: "Raipur" },

  // Andhra Pradesh & Telangana (50-53)
  "50": { state: "Telangana", defaultCity: "Hyderabad" },
  "51": { state: "Andhra Pradesh", defaultCity: "Tirupati" },
  "52": { state: "Andhra Pradesh", defaultCity: "Vijayawada" },
  "53": { state: "Andhra Pradesh", defaultCity: "Visakhapatnam" },

  // Karnataka (56-59)
  "56": { state: "Karnataka", defaultCity: "Bengaluru" },
  "57": { state: "Karnataka", defaultCity: "Mangaluru" },
  "58": { state: "Karnataka", defaultCity: "Hubballi" },
  "59": { state: "Karnataka", defaultCity: "Belagavi" },

  // Tamil Nadu & Puducherry (60-64)
  "60": { state: "Tamil Nadu", defaultCity: "Chennai" },
  "61": { state: "Tamil Nadu", defaultCity: "Thanjavur" },
  "62": { state: "Tamil Nadu", defaultCity: "Madurai" },
  "63": { state: "Tamil Nadu", defaultCity: "Salem" },
  "64": { state: "Tamil Nadu", defaultCity: "Coimbatore" },

  // Kerala & Lakshadweep (67-69)
  "67": { state: "Kerala", defaultCity: "Kozhikode" },
  "68": { state: "Kerala", defaultCity: "Kochi" },
  "69": { state: "Kerala", defaultCity: "Thiruvananthapuram" },

  // West Bengal & Andaman/Nicobar (70-74)
  "70": { state: "West Bengal", defaultCity: "Kolkata" },
  "71": { state: "West Bengal", defaultCity: "Howrah" },
  "72": { state: "West Bengal", defaultCity: "Midnapore" },
  "73": { state: "West Bengal", defaultCity: "Siliguri" },
  "74": { state: "West Bengal", defaultCity: "North 24 Parganas" },

  // Odisha (75-77)
  "75": { state: "Odisha", defaultCity: "Bhubaneswar" },
  "76": { state: "Odisha", defaultCity: "Cuttack" },
  "77": { state: "Odisha", defaultCity: "Sambalpur" },

  // Assam (78)
  "78": { state: "Assam", defaultCity: "Guwahati" },

  // Northeast States (79)
  "79": { state: "Northeast", defaultCity: "Agartala" },

  // Bihar & Jharkhand (80-85)
  "80": { state: "Bihar", defaultCity: "Patna" },
  "81": { state: "Jharkhand", defaultCity: "Deoghar" },
  "82": { state: "Jharkhand", defaultCity: "Dhanbad" },
  "83": { state: "Jharkhand", defaultCity: "Ranchi" },
  "84": { state: "Bihar", defaultCity: "Muzaffarpur" },
  "85": { state: "Bihar", defaultCity: "Purnia" },
};

// Sub-prefix refinements (3 digits) for special states & territories
const PIN_SUB_PREFIX_MAP: Record<string, { state: string; defaultCity: string }> = {
  // NCR details
  "122": { state: "Haryana", defaultCity: "Gurugram" },
  "121": { state: "Haryana", defaultCity: "Faridabad" },
  "201": { state: "Uttar Pradesh", defaultCity: "Ghaziabad" },
  "202": { state: "Uttar Pradesh", defaultCity: "Noida" },

  // Goa
  "403": { state: "Goa", defaultCity: "Panaji" },

  // Uttarakhand
  "248": { state: "Uttarakhand", defaultCity: "Dehradun" },
  "249": { state: "Uttarakhand", defaultCity: "Haridwar" },
  "263": { state: "Uttarakhand", defaultCity: "Nainital" },

  // Ladakh
  "194": { state: "Ladakh", defaultCity: "Leh" },

  // Andaman & Nicobar
  "744": { state: "Andaman and Nicobar Islands", defaultCity: "Port Blair" },

  // Northeast 3-digit breakdowns
  "790": { state: "Arunachal Pradesh", defaultCity: "Itanagar" },
  "791": { state: "Arunachal Pradesh", defaultCity: "Itanagar" },
  "792": { state: "Arunachal Pradesh", defaultCity: "Pasighat" },
  "793": { state: "Meghalaya", defaultCity: "Shillong" },
  "794": { state: "Meghalaya", defaultCity: "Tura" },
  "795": { state: "Manipur", defaultCity: "Imphal" },
  "796": { state: "Mizoram", defaultCity: "Aizawl" },
  "797": { state: "Nagaland", defaultCity: "Kohima" },
  "798": { state: "Nagaland", defaultCity: "Dimapur" },
  "799": { state: "Tripura", defaultCity: "Agartala" },
  "737": { state: "Sikkim", defaultCity: "Gangtok" },

  // Puducherry
  "605": { state: "Puducherry", defaultCity: "Puducherry" },
};

export const ALL_INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
  "Puducherry",
] as const;

/**
 * Synchronous, instant fallback lookup for any 6-digit PIN code.
 */
export function getSyncLocationFromPincode(pin: string): PincodeLocation | null {
  const cleaned = pin.replace(/\D/g, "").slice(0, 6);
  if (cleaned.length !== 6) return null;

  const subPrefix = cleaned.slice(0, 3);
  if (PIN_SUB_PREFIX_MAP[subPrefix]) {
    const loc = PIN_SUB_PREFIX_MAP[subPrefix];
    return {
      valid: true,
      state: loc.state,
      city: loc.defaultCity,
      district: loc.defaultCity,
      pincode: cleaned,
    };
  }

  const prefix = cleaned.slice(0, 2);
  if (PIN_PREFIX_MAP[prefix]) {
    const loc = PIN_PREFIX_MAP[prefix];
    return {
      valid: true,
      state: loc.state,
      city: loc.defaultCity,
      district: loc.defaultCity,
      pincode: cleaned,
    };
  }

  return null;
}

/**
 * Full lookup with India Post postal API + instant fallback
 */
export async function lookupPincode(pin: string): Promise<PincodeLocation> {
  const cleaned = pin.replace(/\D/g, "").slice(0, 6);
  if (cleaned.length !== 6) {
    return { valid: false, state: "", city: "", pincode: cleaned };
  }

  // 1. Try India Post API with 2 second timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (
        Array.isArray(data) &&
        data[0]?.Status === "Success" &&
        Array.isArray(data[0]?.PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const po = data[0].PostOffice[0];
        const state = (po.State || "").trim();
        const district = (po.District || "").trim();
        const city = (po.District || po.Block || po.Name || "").trim();

        if (state) {
          return {
            valid: true,
            state,
            city: city || district,
            district,
            pincode: cleaned,
          };
        }
      }
    }
  } catch {
    // API failed or aborted — proceed to instant local fallback
  }

  // 2. Fall back to prefix dictionary
  const fallback = getSyncLocationFromPincode(cleaned);
  if (fallback) {
    return fallback;
  }

  return { valid: false, state: "", city: "", pincode: cleaned };
}

export type StateShippingRate = {
  id?: string;
  name: string;
  states: string[];
  cities?: string[];
  flatShippingFee: number;
  freeShippingAbove: number;
};

export function getShippingForLocation(
  subtotal: number,
  settings: {
    flatShippingFee?: number;
    freeShippingAbove?: number;
    stateShippingRates?: StateShippingRate[];
  },
  state?: string,
  city?: string
): {
  flatShippingFee: number;
  freeShippingAbove: number;
  isFreeShipping: boolean;
  shipping: number;
  appliedRuleName?: string;
} {
  const defaultFlat = Number(settings.flatShippingFee ?? 99);
  const defaultFree = Number(settings.freeShippingAbove ?? 999);

  if (subtotal <= 0) {
    return {
      flatShippingFee: defaultFlat,
      freeShippingAbove: defaultFree,
      isFreeShipping: true,
      shipping: 0,
    };
  }

  let matchedRate: StateShippingRate | undefined;
  const normState = (state || "").trim().toLowerCase();
  const normCity = (city || "").trim().toLowerCase();

  const rules = settings.stateShippingRates || [];
  if (normState && rules.length > 0) {
    matchedRate = rules.find((r) => {
      if (normCity && r.cities && r.cities.length > 0) {
        if (r.cities.some((c) => c.trim().toLowerCase() === normCity)) return true;
      }
      return r.states.some((s) => s.trim().toLowerCase() === normState);
    });
  }

  const effectiveFlat = matchedRate ? matchedRate.flatShippingFee : defaultFlat;
  const effectiveFree = matchedRate ? matchedRate.freeShippingAbove : defaultFree;
  const isFree = subtotal >= effectiveFree;
  const shippingFee = isFree ? 0 : effectiveFlat;

  return {
    flatShippingFee: effectiveFlat,
    freeShippingAbove: effectiveFree,
    isFreeShipping: isFree,
    shipping: shippingFee,
    appliedRuleName: matchedRate?.name,
  };
}
