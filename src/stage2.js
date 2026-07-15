export const PROFILE_KEY = "bitebuddy-profile-v2";
export const TICKETS_KEY = "bitebuddy-support-tickets-v2";
export const ORDERS_KEY = "bitebuddy-active-orders-v2";

export const defaultProfile = {
  name: "Alex Morgan", customerId: "BB-CUST-2048", preferredDiet: "None", allergies: [],
  budgetMin: 10, budgetMax: 20, spicePreference: "Medium",
  favouriteCuisines: ["British Burgers", "British Curry House"],
  favouriteRestaurants: ["Borough Burger Co.", "Brick Lane Curry Club"],
  addressLabel: "Home", deliveryInstructions: "Leave at reception if busy.", paymentLabel: "Apple Pay",
};

export const orderHistory = [
  { id: "BB1042", date: "6 July 2026", restaurant: "Borough Burger Co.", status: "Delivered", rating: 5, addressLabel: "Home", total: 32.99, mock: true, items: [
    { itemId: "ember-burger", name: "Double Cheddar Smash Burger", quantity: 2, price: 13.5, customizations: ["Double patty", "No onions"] },
    { itemId: "unavailable-fries", name: "Loaded Truffle Fries", quantity: 1, price: 5.99, customizations: [] },
  ] },
  { id: "BB0988", date: "28 June 2026", restaurant: "Greenwich Greens", status: "Delivered", rating: 4, addressLabel: "Work", total: 20.9, mock: true, items: [
    { itemId: "green-vegan", name: "Vegan Supergreen Bowl", quantity: 1, price: 10.95, customizations: ["Add avocado"] },
    { itemId: "roast-vegan", name: "Vegan Sunday Roast", quantity: 1, price: 9.95, customizations: [] },
  ] },
  { id: "BB0917", date: "18 June 2026", restaurant: "Brick Lane Curry Club", status: "Delivered", rating: 5, addressLabel: "Home", total: 30.2, mock: true, items: [
    { itemId: "curry-tikka", name: "Chicken Tikka Masala", quantity: 1, price: 14.25, customizations: ["Medium", "Pilau rice"] },
    { itemId: "curry-balti", name: "Vegetable Balti", quantity: 1, price: 13.95, customizations: ["Hot", "Remove coriander"] },
  ] },
];

export const defaultActiveOrders = [
  { id: "BB2040", restaurant: "Greenwich Greens", status: "Order Placed", deliveryType: "Delivery", estimatedArrival: "5:10 PM", lastUpdate: "4:36 PM", etaState: "within", delayMinutes: 0, addressLabel: "Home", instructions: "Leave at reception.", items: [{ name: "Vegan Supergreen Bowl", quantity: 1 }] },
  { id: "BB2041", restaurant: "Brick Lane Curry Club", status: "Kitchen Preparing", deliveryType: "Delivery", estimatedArrival: "5:25 PM", lastUpdate: "4:42 PM", etaState: "late", delayMinutes: 24, addressLabel: "Home", instructions: "Leave at reception.", items: [{ name: "Chicken Tikka Masala", quantity: 1 }, { name: "Vegetable Balti", quantity: 1 }] },
  { id: "BB2042", restaurant: "Borough Burger Co.", status: "Restaurant Confirmed", deliveryType: "Delivery", estimatedArrival: "5:05 PM", lastUpdate: "4:38 PM", etaState: "within", delayMinutes: 0, addressLabel: "Work", instructions: "Call on arrival.", items: [{ name: "Double Cheddar Smash Burger", quantity: 2 }, { name: "Cola", quantity: 2 }] },
  { id: "BB1042", restaurant: "Borough Burger Co.", status: "Delivered", deliveryType: "Delivery", estimatedArrival: "Delivered 4:30 PM", lastUpdate: "4:30 PM", etaState: "delivered", delayMinutes: 0, addressLabel: "Home", instructions: "Leave at reception.", items: [{ name: "Double Cheddar Smash Burger", quantity: 2 }, { name: "Cola", quantity: 2 }] },
];

export const customizationOptions = {
  burger: [{ label: "Single patty", price: 0, group: "size" }, { label: "Double patty", price: 4, group: "size" }, { label: "Extra cheese", price: 1.5 }, { label: "No onions", price: 0 }, { label: "Burger sauce", price: 0, group: "sauce" }, { label: "BBQ sauce", price: 0, group: "sauce" }, { label: "Fries", price: 2.5, group: "side" }, { label: "Side salad", price: 2, group: "side" }],
  curry: [{ label: "Mild", price: 0, group: "spice" }, { label: "Medium", price: 0, group: "spice" }, { label: "Hot", price: 0, group: "spice" }, { label: "Pilau rice", price: 0, group: "side" }, { label: "Naan", price: 1.5, group: "side" }, { label: "Add poppadoms", price: 2 }, { label: "Remove coriander", price: 0 }],
  bowl: [{ label: "Chickpea protein", price: 0, group: "protein" }, { label: "Chicken protein", price: 3, group: "protein" }, { label: "Tahini dressing", price: 0, group: "dressing" }, { label: "Lemon dressing", price: 0, group: "dressing" }, { label: "Add avocado", price: 2.5 }, { label: "Remove seeds", price: 0 }],
  default: [{ label: "Regular portion", price: 0, group: "portion" }, { label: "Large portion", price: 3, group: "portion" }, { label: "No sauce", price: 0 }, { label: "Still water", price: 1.5 }],
};

export function safeLoad(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value && typeof value === "object" ? value : fallback; } catch { return fallback; }
}

export function itemCategory(item) {
  const text = `${item.name} ${item.cuisine}`.toLowerCase();
  if (text.includes("burger")) return "burger";
  if (/curry|masala|balti|rogan|saag/.test(text)) return "curry";
  if (/bowl|salad|greens/.test(text)) return "bowl";
  return "default";
}

export function supportIntent(text) {
  const value = text.toLowerCase();
  if (/\bpayment\s+(?:was\s+)?(?:fail(?:ed|ure)?|declin(?:ed|e))\b|\bcard\s+(?:was\s+)?declined\b|\b(?:failed|declined)\s+payment\b/.test(value)) return "Payment failure";
  if (/\brefund(?:ed|s|ing)?\b/.test(value)) return "Refund status";
  if (/\bcancel\b/.test(value)) return "Cancel order";
  if (/\blate\b|where is my food|delivery time has passed|driver is delayed/.test(value)) return "Late order";
  if (/missing|did not receive/.test(value)) return "Missing item";
  if (/wrong item|not what i ordered|different meal/.test(value)) return "Wrong item";
  if (/damaged|packaging|spilled/.test(value)) return "Damaged food";
  if (/cold/.test(value)) return "Cold food";
  if (/\b(?:change|update)\b.*\bdelivery address\b/.test(value)) return "Change delivery address";
  if (/cannot find|find the address/.test(value)) return "Courier cannot find address";
  if (/delivery instructions|call me|leave it at|side entrance/.test(value)) return "Change delivery instructions";
  if (/speak to|human|person|agent/.test(value)) return "Speak to a person";
  return null;
}

export function newestEligibleCancellationOrder(orders) {
  return orders
    .filter((order) => cancellationRule(order.status).allowed)
    .sort((first, second) => (Date.parse(second.createdAt || "") || 0) - (Date.parse(first.createdAt || "") || 0))[0] ?? null;
}

export function cancellationRule(status) {
  if (status === "Order Placed") return { allowed: true, confirm: true, reason: "Cancellation is available before restaurant confirmation." };
  if (status === "Restaurant Confirmed") return { allowed: true, confirm: true, reason: "The restaurant has confirmed this order, so cancellation needs explicit confirmation." };
  return { allowed: false, confirm: false, reason: status === "Kitchen Preparing" ? "This mock order is already being prepared, so self-service cancellation is unavailable." : `Self-service cancellation is unavailable because this mock order's status is ${status}.` };
}

export function createTicket({ profile, order, category, affectedItem = "Not specified", note = "", reason = "Customer requested support" }) {
  const reference = `BB-SUP-${Math.floor(10000 + Math.random() * 90000)}`;
  const summary = `${profile.name} reported ${category.toLowerCase()} for mock order ${order.id}${affectedItem !== "Not specified" ? ` affecting ${affectedItem}` : ""}. Order status: ${order.status}.${note ? ` Customer note: ${note}.` : ""}`;
  return { reference, customerName: profile.name, customerId: profile.customerId, orderNumber: order.id, category, affectedItem, note, summary, orderStatus: order.status, createdAt: new Date().toLocaleString(), priority: /late|courier|damaged/i.test(category) ? "High" : "Normal", reason, status: "New" };
}
