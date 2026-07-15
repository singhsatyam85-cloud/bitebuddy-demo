import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bike,
  Bot,
  ChefHat,
  CheckCircle2,
  Clock3,
  CreditCard,
  Flame,
  HeartPulse,
  Home,
  Leaf,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import { PreferencesPanel, CustomisationPanel, OrderHistoryCards, SupportQueue } from "./Stage2Panels.jsx";
import { PROFILE_KEY, TICKETS_KEY, ORDERS_KEY, defaultProfile, orderHistory, defaultActiveOrders, safeLoad, supportIntent, cancellationRule, newestEligibleCancellationOrder, createTicket } from "./stage2.js";
import { assistantLabelForSource, enrichRuleBasedInput, interpretWithRuleBasedFallback } from "./aiClient.js";
import { CANCELLATION_STAGES, cancellationSelectionState, canCreateCancellationEscalation } from "./cancellationFlow.js";
import { LATEST_ORDER_REQUEST, canChangeDeliveryInstructions, deliveryInstructionCompletionMessage, deliveryInstructionConfirmationMessage, extractProposedDeliveryInstruction, prepareDeliveryInstructionStart } from "./deliveryInstructionFlow.js";
import { applyConfirmedDeliveryAddressUpdate, canChangeDeliveryAddress, prepareDeliveryAddressStart } from "./deliveryAddressFlow.js";
import { isRefundRelevantOrder, prepareRefundStatusStart, refundStatusMessage } from "./refundStatusFlow.js";
import { isPaymentRelevantOrder, paymentFailureMessage, preparePaymentFailureStart } from "./paymentFailureFlow.js";

const restaurants = [
  {
    id: "ember",
    name: "Borough Burger Co.",
    cuisine: "British Burgers",
    rating: 4.8,
    distance: 1.2,
    time: "22-28 min",
    price: "Mid",
    cover: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=900&q=80",
    items: [
      {
        id: "ember-burger",
        name: "Double Cheddar Smash Burger",
        description: "British beef patties, mature cheddar, burger sauce, toasted brioche.",
        price: 14.5,
        tags: ["Non-Veg", "Spicy"],
        image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "ember-bacon",
        name: "Bacon & Brown Sauce Burger",
        description: "Beef patty, smoked back bacon, cheddar, crispy onions, brown sauce.",
        price: 15.25,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "ember-halloumi",
        name: "Halloumi Burger",
        description: "Grilled halloumi, chilli jam, lettuce, cucumber, toasted bun.",
        price: 12.95,
        tags: ["Veg", "Spicy"],
        image: "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "ember-keto",
        name: "Peri-Peri Chicken Salad",
        description: "Grilled chicken, rocket, cucumber, pickled onion, lemon yoghurt.",
        price: 13.75,
        tags: ["Non-Veg", "Keto", "Gluten-Free", "Spicy"],
        image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=700&q=80",
      },
    ],
  },
  {
    id: "pie",
    name: "London Pie & Mash",
    cuisine: "Pie & Mash",
    rating: 4.7,
    distance: 2.1,
    time: "30-38 min",
    price: "Premium",
    cover: "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=900&q=80",
    items: [
      {
        id: "pie-mash",
        name: "Pie, Mash & Liquor",
        description: "Minced beef pie, creamy mash, parsley liquor.",
        price: 12.25,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "pie-shepherd",
        name: "Shepherd's Pie",
        description: "Lamb mince, carrots, peas, buttery mashed potato crust.",
        price: 16.9,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1604908176997-43172bde3b7d?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "pie-toad",
        name: "Toad in the Hole",
        description: "Cumberland sausages baked in Yorkshire pudding batter, gravy.",
        price: 14.95,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1604908177453-7462950a6a3b?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "pie-bubble",
        name: "Bubble & Squeak",
        description: "Crisped potato, cabbage, greens, fried egg, brown sauce.",
        price: 11.75,
        tags: ["Veg"],
        image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=700&q=80",
      },
    ],
  },
  {
    id: "green",
    name: "Greenwich Greens",
    cuisine: "Healthy Bowls",
    rating: 4.9,
    distance: 0.8,
    time: "18-24 min",
    price: "Mid",
    cover: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
    items: [
      {
        id: "green-vegan",
        name: "Vegan Supergreen Bowl",
        description: "Pearl barley, roasted chickpeas, kale, tahini, pomegranate.",
        price: 11.95,
        tags: ["Veg", "Gluten-Free"],
        image: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "green-keto",
        name: "Scottish Salmon Crunch",
        description: "Seared salmon, greens, cucumber, sesame avocado dressing.",
        price: 18.4,
        tags: ["Non-Veg", "Keto", "Gluten-Free"],
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "green-jacket",
        name: "Jacket Potato & Beans",
        description: "Oven-baked potato, baked beans, mature cheddar, chives.",
        price: 8.95,
        tags: ["Veg", "Gluten-Free"],
        image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "green-ploughman",
        name: "Ploughman's Lunch Bowl",
        description: "Cheddar, pickles, apple, salad leaves, crusty bread.",
        price: 10.95,
        tags: ["Veg"],
        image: "https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=700&q=80",
      },
    ],
  },
  {
    id: "curry",
    name: "Brick Lane Curry Club",
    cuisine: "British Curry House",
    rating: 4.6,
    distance: 2.6,
    time: "34-42 min",
    price: "Mid",
    cover: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80",
    items: [
      {
        id: "curry-tikka",
        name: "Chicken Tikka Masala",
        description: "Charred chicken tikka, creamy tomato masala, pilau rice.",
        price: 15.25,
        tags: ["Non-Veg", "Spicy"],
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "curry-balti",
        name: "Vegetable Balti",
        description: "Peppers, onion, tomato masala, coriander, basmati rice.",
        price: 13.95,
        tags: ["Veg", "Spicy"],
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "curry-rogan",
        name: "Lamb Rogan Josh",
        description: "Slow-cooked lamb, Kashmiri chilli, tomato gravy, pilau rice.",
        price: 16.75,
        tags: ["Non-Veg", "Spicy"],
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "curry-saag",
        name: "Saag Aloo & Naan",
        description: "Spinach, potatoes, garlic, warm naan, mango chutney.",
        price: 11.95,
        tags: ["Veg"],
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=700&q=80",
      },
    ],
  },
  {
    id: "pasta",
    name: "Proper Chippy",
    cuisine: "Fish & Chips",
    rating: 4.5,
    distance: 1.7,
    time: "26-32 min",
    price: "Mid",
    cover: "https://images.unsplash.com/photo-1579208030886-b937da0925dc?auto=format&fit=crop&w=900&q=80",
    items: [
      {
        id: "chippy-cod",
        name: "Cod & Triple-Cooked Chips",
        description: "Crisp battered cod, chunky chips, mushy peas, tartare.",
        price: 13.5,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1579208030886-b937da0925dc?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "chippy-pie",
        name: "Steak & Ale Pie",
        description: "Buttery pastry, slow-cooked beef, onion gravy, chips.",
        price: 12.75,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "chippy-sausage",
        name: "Battered Sausage & Chips",
        description: "Crisp battered sausage, chip-shop chips, curry sauce.",
        price: 8.95,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "chippy-haddock",
        name: "Haddock, Peas & Chips",
        description: "Golden battered haddock, mushy peas, chips, lemon.",
        price: 14.25,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1580217593608-61931cefc821?auto=format&fit=crop&w=700&q=80",
      },
    ],
  },
  {
    id: "taco",
    name: "Yorkshire Roast Co.",
    cuisine: "Roasts & Wraps",
    rating: 4.7,
    distance: 1.4,
    time: "20-27 min",
    price: "Budget",
    cover: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    items: [
      {
        id: "roast-vegan",
        name: "Vegan Sunday Roast",
        description: "Nut roast, roast potatoes, carrots, greens, onion gravy.",
        price: 9.95,
        tags: ["Veg", "Gluten-Free", "Spicy"],
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "roast-wrap",
        name: "Roast Chicken Yorkshire Wrap",
        description: "Roast chicken, potatoes, greens, gravy in a Yorkshire wrap.",
        price: 10.95,
        tags: ["Non-Veg", "Spicy"],
        image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "roast-beef",
        name: "Roast Beef Sunday Dinner",
        description: "Roast beef, Yorkshire pudding, roast potatoes, gravy.",
        price: 15.95,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "roast-bangers",
        name: "Bangers & Mash",
        description: "Cumberland sausages, buttery mash, onion gravy, peas.",
        price: 12.5,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1604908177453-7462950a6a3b?auto=format&fit=crop&w=700&q=80",
      },
    ],
  },
  {
    id: "bakery",
    name: "Cornish Bakehouse",
    cuisine: "Pasties & Bakes",
    rating: 4.8,
    distance: 0.9,
    time: "16-22 min",
    price: "Budget",
    cover: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    items: [
      {
        id: "bakery-pasty",
        name: "Cornish Steak Pasty",
        description: "Beef, potato, swede, onion, peppery shortcrust pastry.",
        price: 7.95,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "bakery-roll",
        name: "Sausage Roll",
        description: "Seasoned pork sausage meat wrapped in flaky puff pastry.",
        price: 4.5,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1606851094291-6efae152bb87?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "bakery-cheese",
        name: "Cheese & Onion Pasty",
        description: "Cheddar, potato, onion, buttery pastry, warm from the oven.",
        price: 6.95,
        tags: ["Veg"],
        image: "https://images.unsplash.com/photo-1604909052866-6a51f317a93c?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "bakery-scone",
        name: "Cream Tea Scone Box",
        description: "Two scones, clotted cream, strawberry jam, tea pairing.",
        price: 8.5,
        tags: ["Veg"],
        image: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=700&q=80",
      },
    ],
  },
  {
    id: "breakfast",
    name: "The Full English",
    cuisine: "Breakfast & Brunch",
    rating: 4.6,
    distance: 1.5,
    time: "19-26 min",
    price: "Mid",
    cover: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=80",
    items: [
      {
        id: "breakfast-full",
        name: "Full English Breakfast",
        description: "Eggs, bacon, sausage, beans, tomatoes, mushrooms, toast.",
        price: 13.95,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "breakfast-veggie",
        name: "Veggie English Breakfast",
        description: "Eggs, veggie sausage, beans, tomatoes, mushrooms, toast.",
        price: 12.25,
        tags: ["Veg"],
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "breakfast-butty",
        name: "Bacon Butty",
        description: "Smoked back bacon, soft white roll, brown sauce.",
        price: 6.95,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=700&q=80",
      },
      {
        id: "breakfast-eggs",
        name: "Eggs Royale",
        description: "Poached eggs, smoked salmon, hollandaise, toasted muffin.",
        price: 11.95,
        tags: ["Non-Veg"],
        image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=700&q=80",
      },
    ],
  },
];

const categories = [
  { name: "Burgers", icon: Utensils },
  { name: "Pies", icon: Sparkles },
  { name: "Healthy", icon: HeartPulse },
  { name: "Curry", icon: Flame },
  { name: "Vegan", icon: Leaf },
  { name: "Fast", icon: Bike },
];

const quickReplies = [
  "Healthy under £15",
  "Vegan options",
  "Allergy-friendly choices",
  "Cheap spicy chicken",
  "Track my order",
  "Reorder last meal",
  "My order is late",
  "Missing item",
];

const CART_STORAGE_KEY = "bitebuddy-cart-v1";
const ALLERGY_WARNING = "Food may be prepared in shared kitchens. Contact the restaurant directly if you have a severe allergy.";
const dietaryById = {
  "ember-burger": ["Non-Vegetarian", "Spicy"], "ember-bacon": ["Non-Vegetarian"], "ember-halloumi": ["Vegetarian", "Spicy"], "ember-keto": ["Non-Vegetarian", "Gluten-Free", "Keto", "Spicy", "Healthy"],
  "pie-mash": ["Non-Vegetarian"], "pie-shepherd": ["Non-Vegetarian"], "pie-toad": ["Non-Vegetarian"], "pie-bubble": ["Vegetarian"],
  "green-vegan": ["Vegan", "Vegetarian", "Healthy"], "green-keto": ["Non-Vegetarian", "Gluten-Free", "Keto", "Healthy"], "green-jacket": ["Vegetarian", "Gluten-Free", "Healthy"], "green-ploughman": ["Vegetarian", "Healthy"],
  "curry-tikka": ["Non-Vegetarian", "Spicy"], "curry-balti": ["Vegan", "Vegetarian", "Gluten-Free", "Spicy", "Healthy"], "curry-rogan": ["Non-Vegetarian", "Gluten-Free", "Spicy"], "curry-saag": ["Vegan", "Vegetarian", "Healthy"],
  "chippy-cod": ["Non-Vegetarian"], "chippy-pie": ["Non-Vegetarian"], "chippy-sausage": ["Non-Vegetarian"], "chippy-haddock": ["Non-Vegetarian"],
  "roast-vegan": ["Vegan", "Vegetarian", "Healthy"], "roast-wrap": ["Non-Vegetarian"], "roast-beef": ["Non-Vegetarian"], "roast-bangers": ["Non-Vegetarian"],
  "bakery-pasty": ["Non-Vegetarian"], "bakery-roll": ["Non-Vegetarian"], "bakery-cheese": ["Vegetarian"], "bakery-scone": ["Vegetarian"],
  "breakfast-full": ["Non-Vegetarian"], "breakfast-veggie": ["Vegetarian"], "breakfast-butty": ["Non-Vegetarian"], "breakfast-eggs": ["Non-Vegetarian"],
};
const allergensById = {
  "ember-burger": ["Milk", "Eggs", "Gluten", "Soy", "Sesame"], "ember-bacon": ["Milk", "Eggs", "Gluten", "Soy", "Sesame"], "ember-halloumi": ["Milk", "Gluten", "Sesame"], "ember-keto": ["Milk"],
  "pie-mash": ["Milk", "Gluten"], "pie-shepherd": ["Milk"], "pie-toad": ["Milk", "Eggs", "Gluten"], "pie-bubble": ["Eggs", "Soy"],
  "green-vegan": ["Gluten", "Sesame"], "green-keto": ["Fish", "Sesame", "Soy"], "green-jacket": ["Milk"], "green-ploughman": ["Milk", "Gluten"],
  "curry-tikka": ["Milk"], "curry-balti": [], "curry-rogan": [], "curry-saag": ["Gluten"],
  "chippy-cod": ["Eggs", "Gluten", "Fish"], "chippy-pie": ["Milk", "Gluten"], "chippy-sausage": ["Gluten"], "chippy-haddock": ["Gluten", "Fish"],
  "roast-vegan": ["Tree Nuts", "Gluten"], "roast-wrap": ["Milk", "Eggs", "Gluten"], "roast-beef": ["Eggs", "Gluten"], "roast-bangers": ["Milk", "Gluten"],
  "bakery-pasty": ["Milk", "Gluten"], "bakery-roll": ["Milk", "Gluten"], "bakery-cheese": ["Milk", "Gluten"], "bakery-scone": ["Milk", "Eggs", "Gluten"],
  "breakfast-full": ["Eggs", "Gluten"], "breakfast-veggie": ["Eggs", "Gluten", "Soy"], "breakfast-butty": ["Gluten"], "breakfast-eggs": ["Milk", "Eggs", "Gluten", "Fish"],
};

const driver = {
  name: "BiteBuddy courier",
  rating: 4.9,
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
};

const trackingSteps = [
  { label: "Order Placed", time: "4:02 PM" },
  { label: "Kitchen", time: "4:08 PM" },
  { label: "Out for Delivery", time: "4:18 PM" },
  { label: "Arrived", time: "ETA 4:30 PM" },
];

function allItems() {
  return restaurants.flatMap((restaurant) =>
    restaurant.items.map((item) => ({
      ...item,
      tags: dietaryById[item.id] || [],
      allergens: allergensById[item.id] || [],
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantRating: restaurant.rating,
      distance: restaurant.distance,
      time: restaurant.time,
      priceCategory: restaurant.price,
      cuisine: restaurant.cuisine,
    })),
  );
}

function money(value) {
  return `£${value.toFixed(2)}`;
}

function normaliseInput(input) {
  return input.toLowerCase().replace(/vegitarian|vegatarian/g, "vegetarian").replace(/glutan/g, "gluten").replace(/burgr/g, "burger").replace(/biriyani/g, "biryani").replace(/alergic/g, "allergic");
}

function parseFilters(input) {
  const text = normaliseInput(input);
  const budgetMatch = text.match(/(?:under|below|less than|maximum|max|budget(?: meal)?(?: of)?)[\s£$]*(\d+(?:\.\d+)?)(?:\s*pounds?)?/);
  const allergenMap = { peanut: "Peanuts", peanuts: "Peanuts", dairy: "Milk", milk: "Milk", gluten: "Gluten", nut: "Tree Nuts", nuts: "Tree Nuts", sesame: "Sesame", shellfish: "Shellfish", egg: "Eggs", eggs: "Eggs", soy: "Soy", fish: "Fish" };
  const allergens = Object.entries(allergenMap).filter(([word]) => new RegExp(`(?:allergic to|allergy|avoid|no|without|free|cannot eat)[^.!?]{0,18}\\b${word}\\b|\\b${word}[- ]free`).test(text)).map(([, value]) => value);
  const diet = /\bvegan\b/.test(text) ? "Vegan" : /\b(vegetarian|no meat|meat free)\b/.test(text) ? "Vegetarian" : /\bgluten[- ]free\b/.test(text) ? "Gluten-Free" : /\bketo\b/.test(text) ? "Keto" : null;
  const foodTypes = ["burger", "sushi", "biryani", "curry", "breakfast"].filter((word) => text.includes(word));
  const protein = ["chicken", "beef", "lamb", "fish", "salmon"].find((word) => new RegExp(`\\b${word}\\b`).test(text)) || null;
  const cuisine = ["British Burgers", "British Curry House", "Healthy Bowls", "Fish & Chips", "Breakfast & Brunch"].find((value) => text.includes(value.toLowerCase())) || null;
  const deliveryMatch = text.match(/(?:within|under|max(?:imum)?)\s*(\d+)\s*min/);
  return { text, budget: budgetMatch ? Number(budgetMatch[1]) : /\b(cheap|affordable|low cost|budget meal)\b/.test(text) ? 10 : null, diet, healthy: /healthy|low calorie/.test(text), spicy: /spicy|\bhot\b/.test(text), mild: /\bmild\b/.test(text), quick: /quick delivery|fastest delivery|arrives fastest/.test(text), nearby: /nearby|near me/.test(text), comfort: /comfort food|hungover/.test(text), allergens: [...new Set(allergens)], foodTypes, protein, cuisine, maxDelivery: deliveryMatch ? Number(deliveryMatch[1]) : null };
}

function matchesFoodType(item, type) {
  const haystack = `${item.name} ${item.description} ${item.cuisine}`.toLowerCase();
  if (type === "curry") return item.restaurantId === "curry" || /curry|masala|balti|rogan|saag/.test(haystack);
  if (type === "sushi" || type === "biryani") return haystack.includes(type);
  return haystack.includes(type);
}

function applyFilters(items, filters, relaxed = []) {
  return items.filter((item) => {
    if (filters.allergens.some((allergen) => item.allergens.includes(allergen))) return false;
    if (!relaxed.includes("diet") && filters.diet && !item.tags.includes(filters.diet)) return false;
    if (!relaxed.includes("healthy") && filters.healthy && !item.tags.includes("Healthy")) return false;
    if (!relaxed.includes("spicy") && filters.spicy && !item.tags.includes("Spicy")) return false;
    if (!relaxed.includes("mild") && filters.mild && item.tags.includes("Spicy")) return false;
    if (!relaxed.includes("food type") && filters.foodTypes.length && !filters.foodTypes.every((type) => matchesFoodType(item, type))) return false;
    if (!relaxed.includes("protein") && filters.protein && !`${item.name} ${item.description}`.toLowerCase().includes(filters.protein)) return false;
    if (!relaxed.includes("cuisine") && filters.cuisine && item.cuisine !== filters.cuisine) return false;
    if (!relaxed.includes("delivery") && filters.maxDelivery && parseInt(item.time) > filters.maxDelivery) return false;
    if (!relaxed.includes("budget") && filters.budget !== null && item.price > filters.budget) return false;
    if (!relaxed.includes("comfort") && filters.comfort && !["chippy-cod", "chippy-pie", "pie-mash", "breakfast-full", "bakery-roll"].includes(item.id)) return false;
    return true;
  });
}

function recommendationReason(item, filters, alternative = false, profile = defaultProfile) {
  const reasons = [];
  if (filters.diet && item.tags.includes(filters.diet)) reasons.push(`it is ${filters.diet.toLowerCase()}`);
  if (filters.healthy && item.tags.includes("Healthy")) reasons.push("it is marked healthy");
  if (filters.spicy && item.tags.includes("Spicy")) reasons.push("it is spicy");
  if (filters.budget !== null && item.price <= filters.budget) reasons.push(`it costs ${money(item.price)}`);
  if (filters.foodTypes.some((type) => matchesFoodType(item, type))) reasons.push("it matches your food choice");
  if (filters.protein && `${item.name} ${item.description}`.toLowerCase().includes(filters.protein)) reasons.push(`it contains ${filters.protein}`);
  if (profile?.preferredDiet && profile.preferredDiet !== "None" && item.tags.includes(profile.preferredDiet)) reasons.push("it matches your saved diet preference");
  if (filters.allergens.length) reasons.push(`it excludes ${filters.allergens.join(" and ")}`);
  if (filters.quick) reasons.push(`it delivers in ${item.time}`);
  if (filters.nearby) reasons.push(`it is ${item.distance} miles away`);
  if (!reasons.length) reasons.push(`it has a ${item.restaurantRating} rating`, `delivers in ${item.time}`);
  return `${alternative ? "Closest alternative" : "Recommended"} because ${reasons.join(", ")}.`;
}

function parseRecommendations(input, remembered = {}, profile = defaultProfile) {
  const parsed = parseFilters(input);
  const filters = {
    ...remembered,
    ...Object.fromEntries(Object.entries(parsed).filter(([key, value]) => key === "text" || value === true || (Array.isArray(value) && value.length) || (value !== null && value !== false && !Array.isArray(value)))),
  };
  filters.allergens = [...new Set([...(remembered.allergens || []), ...(parsed.allergens || []), ...(profile.allergies || [])])];
  filters.foodTypes = parsed.foodTypes.length ? parsed.foodTypes : remembered.foodTypes || [];
  if (!filters.diet && profile.preferredDiet !== "None") filters.diet = profile.preferredDiet;
  if (filters.budget === null || filters.budget === undefined) filters.budget = remembered.budget ?? profile.budgetMax;
  const sorter = filters.nearby ? (a, b) => a.distance - b.distance : filters.quick ? (a, b) => parseInt(a.time) - parseInt(b.time) : (a, b) => b.restaurantRating - a.restaurantRating;
  const exact = applyFilters(allItems(), filters).sort(sorter);
  if (exact.length) return { filters, items: exact.slice(0, 4).map((item) => ({ ...item, explanation: recommendationReason(item, filters, false, profile) })), exact: true };
  const active = [filters.budget !== null && "budget", filters.foodTypes.length && "food type", filters.protein && "protein", filters.spicy && "spicy", filters.healthy && "healthy", filters.diet && "diet", filters.comfort && "comfort"].filter(Boolean);
  const relaxed = active[0] ? [active[0]] : [];
  const alternatives = applyFilters(allItems(), filters, relaxed).sort(sorter).slice(0, 3).map((item) => ({ ...item, explanation: recommendationReason(item, filters, true, profile) }));
  return { filters, items: alternatives, exact: false, relaxed: relaxed[0] };
}

function buildBotReply(input, remembered = {}, profile = defaultProfile) {
  const text = normaliseInput(input);

  if (text.includes("where is") || text.includes("track") || text.includes("status")) {
    return {
      type: "tracking",
      text: "Your last order is moving nicely. It was placed at 4:02 PM, left the kitchen at 4:18 PM, and should arrive by 4:30 PM.",
    };
  }

  if (text.includes("add") && (text.includes("burger") || text.includes("patty"))) {
    const base = allItems().find((item) => item.id === "ember-burger");
    const customizations = [];
    if (text.includes("double")) customizations.push("+Double patty");
    if (text.includes("extra cheese")) customizations.push("+Extra cheese");
    if (text.includes("no onions") || text.includes("without onions")) customizations.push("-No onions");
    return {
      type: "customize",
      text: `Got it. ${base.name}${customizations.length ? ` with ${customizations.join(", ")}` : ""}. Would you like me to add this customized item to your cart?`,
      item: { ...base, customizations },
    };
  }

  const recommendations = parseRecommendations(input, remembered, profile);
  const { filters } = recommendations;
  const filterLabels = [filters.diet?.toLowerCase(), filters.healthy && "healthy", filters.spicy && "spicy", ...filters.foodTypes, filters.budget !== null && `under ${money(filters.budget)}`].filter(Boolean);
  const allergyText = filters.allergens.length ? ` ${ALLERGY_WARNING}` : "";
  if (!recommendations.exact) {
    const change = recommendations.relaxed === "budget" ? "Increase budget" : recommendations.relaxed ? `Clear ${recommendations.relaxed}` : "Reset search";
    return {
      type: "recommendations",
      text: `I could not find an exact match for ${filterLabels.join(", ") || "those filters"}. ${recommendations.items.length ? `These are the closest options after relaxing the ${recommendations.relaxed || "search"} filter.` : "No suitable alternatives avoid your stated allergens; try another cuisine or remove one dietary filter."}${allergyText}`,
      items: recommendations.items,
      actions: [change, "Reset search"], nextFilters: filters,
    };
  }
  return {
    type: "recommendations",
    text:
      text.includes("hungover") || text.includes("comfort")
        ? `For recovery mode, I found warm and satisfying matches.${allergyText}`
        : `I found matches using the menu's verified dietary, allergen, price and delivery data.${allergyText}`,
    items: recommendations.items, nextFilters: filters,
  };
}

function loadCart() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => item && typeof item.id === "string" && typeof item.name === "string" && Number.isFinite(item.basePrice) && Number.isInteger(item.quantity) && item.quantity > 0).map((item) => ({ ...allItems().find((menuItem) => menuItem.id === item.id), ...item, price: item.basePrice + (Number(item.customizationPrice) || 0), customizations: Array.isArray(item.customizations) ? item.customizations : [] })).filter((item) => item.image);
  } catch {
    return [];
  }
}

const TRACKABLE_STATUSES = ["Order Placed", "Restaurant Confirmed", "Kitchen Preparing", "Ready for Collection", "Out for Delivery"];

function App() {
  const items = useMemo(() => allItems(), []);
  const [cart, setCart] = useState(loadCart);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "bot",
      type: "text",
      text: "Hey, I am BiteBuddy. Tell me your mood, budget, dietary needs, or ask me to track your last order.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [toast, setToast] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [tip, setTip] = useState(2);
  const [profile, setProfile] = useState(() => safeLoad(PROFILE_KEY, defaultProfile));
  const [tickets, setTickets] = useState(() => safeLoad(TICKETS_KEY, []));
  const [activeOrders, setActiveOrders] = useState(() => safeLoad(ORDERS_KEY, defaultActiveOrders));
  const [activeFilters, setActiveFilters] = useState({ allergens: profile.allergies || [], foodTypes: [] });
  const [assistantSource, setAssistantSource] = useState("mock");
  const [flow, setFlow] = useState({ type: "discovery" });
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [supportQueueOpen, setSupportQueueOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState(null);
  const [reorderConfirm, setReorderConfirm] = useState(null);
  const [checkoutForm, setCheckoutForm] = useState({
    address: "221B Baker Street, London NW1",
    notes: "Ring the bell and leave at reception if busy.",
    deliverySlot: "ASAP - 25 to 35 min",
    payment: "Apple Pay",
  });
  const chatScrollRef = useRef(null);
  const latestMessageRef = useRef(null);
  const typingRef = useRef(null);
  const deliveryInstructionFlowRef = useRef(null);
  const deliveryAddressFlowRef = useRef(null);
  const humanSupportFlowRef = useRef(null);
  const cancellationFlowRef = useRef(null);

  const retainCancellationFlow = (nextFlow) => {
    cancellationFlowRef.current = nextFlow;
    setFlow(nextFlow);
  };

  useEffect(() => {
    if (!cart.length) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart.map(({ id, name, basePrice, price, quantity, customizations = [], customizationPrice = 0, image }) => ({ id, name, basePrice: basePrice ?? price, quantity, customizations, customizationPrice, lineTotal: ((basePrice ?? price) + customizationPrice) * quantity, image }))));
  }, [cart]);

  useEffect(() => { window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }, [profile]);
  useEffect(() => { window.localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets)); }, [tickets]);
  useEffect(() => { window.localStorage.setItem(ORDERS_KEY, JSON.stringify(activeOrders)); }, [activeOrders]);
  useEffect(() => {
    if (!orderPlaced) return undefined;
    const confirmationTimer = window.setTimeout(() => setOrderPlaced(null), 4000);
    return () => window.clearTimeout(confirmationTimer);
  }, [orderPlaced]);

  useEffect(() => {
    if (!chatOpen) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const container = chatScrollRef.current;
      const target = typing ? typingRef.current : latestMessageRef.current;
      if (!container || !target) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const top = typing
        ? container.scrollTop + Math.max(0, targetRect.bottom - containerRect.bottom + 12)
        : container.scrollTop + targetRect.top - containerRect.top - 8;
      container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, typing, chatOpen]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const fees = cart.length ? 2.99 : 0;
  const total = subtotal + fees + (cart.length ? tip : 0);

  const addToCart = (item) => {
    const customizationPrice = item.customizationPrice ?? (item.customizations || []).reduce((sum, option) => sum + (option === "+Double patty" ? 4 : option === "+Extra cheese" ? 1.5 : 0), 0);
    const prepared = { ...item, basePrice: item.basePrice ?? item.price, customizationPrice, price: (item.basePrice ?? item.price) + customizationPrice };
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.id === prepared.id && JSON.stringify(cartItem.customizations || []) === JSON.stringify(prepared.customizations || []));
      if (existing) {
        return current.map((cartItem) =>
          cartItem === existing ? { ...cartItem, quantity: cartItem.quantity + (item.quantity || 1) } : cartItem,
        );
      }
      return [...current, { ...prepared, quantity: item.quantity || 1 }];
    });
    setToast(`${item.name} added to cart`);
    window.setTimeout(() => setToast(""), 2200);
  };

  const updateQuantity = (item, delta) => {
    setCart((current) =>
      current
        .map((cartItem) => (cartItem === item ? { ...cartItem, quantity: cartItem.quantity + delta } : cartItem))
        .filter((cartItem) => cartItem.quantity > 0),
    );
  };

  const placeOrder = () => {
    if (!cart.length) {
      setToast("Add an item before checkout");
      window.setTimeout(() => setToast(""), 2200);
      return;
    }

    const order = {
      id: `BB-${Math.floor(1000 + Math.random() * 9000)}`,
      total,
      eta: "4:30 PM",
      address: checkoutForm.address,
      items: cart.reduce((sum, item) => sum + item.quantity, 0),
    };

    const createdAt = new Date().toISOString();
    const activeOrder = {
      id: order.id,
      restaurant: cart[0].restaurantName,
      status: "Order Placed",
      deliveryType: "Delivery",
      estimatedArrival: order.eta,
      lastUpdate: new Date().toLocaleString(),
      etaState: "within",
      delayMinutes: 0,
      addressLabel: order.address,
      instructions: checkoutForm.notes,
      items: cart.map(({ name, quantity }) => ({ name, quantity })),
      total: order.total,
      createdAt,
      mock: true,
    };

    setActiveOrders((current) => current.some((active) => active.id === activeOrder.id) ? current : [activeOrder, ...current]);
    setOrderPlaced(order);
    setCart([]);
    window.localStorage.removeItem(CART_STORAGE_KEY);
    setCheckoutOpen(false);
    setChatOpen(true);
    setToast(`Order ${order.id} placed`);
    setMessages((current) => [
      ...current,
      {
        id: Date.now() + 2,
        from: "bot",
        type: "tracking",
        text: `Order ${order.id} is confirmed. Your ${order.items} item order is headed to ${order.address} with ETA ${order.eta}.`,
      },
    ]);
    window.setTimeout(() => setToast(""), 2600);
  };

  const voteOnMessage = (id, vote) => {
    setMessages((current) => current.map((message) => message.id === id ? { ...message, feedback: vote, feedbackConfirmed: true } : message));
  };

  const runMessageAction = (action) => {
    if (action === "Clear conversation preferences") { setActiveFilters({ allergens: [...(profile.allergies || [])], foodTypes: [] }); setFlow({ type: "discovery" }); appendBot({ type: "text", text: "Conversation preferences cleared. Saved allergy restrictions remain active." }); return; }
    if (action.startsWith("Remove ")) { removeFilter(action.slice(7)); return; }
    if (action === "View Preferences") { setPreferencesOpen(true); return; }
    if (action === "View Support Queue") { setSupportQueueOpen(true); return; }
    if (action === "Exit Support" || action === "Start Over") { deliveryInstructionFlowRef.current = null; deliveryAddressFlowRef.current = null; humanSupportFlowRef.current = null; cancellationFlowRef.current = null; setFlow({ type: "discovery" }); appendBot({ type: "text", text: "Flow cancelled. You are back in food discovery." }); return; }
    if (action === "Record issue" && flow.category === "Missing item") { recordMissingIssue(); return; }
    if (action === "Record issue" && flow.category === "Wrong item") { recordWrongItemIssue(); return; }
    if (action === "Record issue" && ["Cold food", "Damaged food"].includes(flow.category)) { recordQualityIssue(); return; }
    if (action === "Create support ticket") {
      if (flow.category === "Speak to a person" || humanSupportFlowRef.current?.category === "Speak to a person") { createHumanSupportTicket(); return; }
      const cancellationFlow = cancellationFlowRef.current;
      if (flow.category === "Cancel order" || cancellationFlow?.category === "Cancel order") {
        const currentOrder = activeOrders.find((order) => order.id === cancellationFlow?.selectedOrderId);
        const rule = cancellationRule(currentOrder?.status);
        if (!canCreateCancellationEscalation(cancellationFlow, currentOrder, rule)) {
          appendBot({ type: "text", text: "Confirm an ineligible active mock order before creating a cancellation support ticket. No ticket has been created.", actions: ["Exit Support"] });
          return;
        }
        createCancellationSupportTicket(currentOrder);
        return;
      }
      if (["Cold food", "Damaged food"].includes(flow.category) && (flow.stage !== "recorded" || !flow.recordedIssue)) {
        appendBot({ type: "text", text: "Record the confirmed cold or damaged food issue before creating a simulated support ticket." });
        return;
      }
      createSupportTicket();
      return;
    }
    if (action === "Record issue") { appendBot({ type: "text", text: "The current support issue is not ready to be recorded." }); return; }
    if (action === "Confirm simulated cancellation") {
      const retainedCancellationFlow = cancellationFlowRef.current || flow;
      const currentOrder = activeOrders.find((order) => order.id === retainedCancellationFlow.selectedOrderId);
      const rule = cancellationRule(currentOrder?.status);
      if (!currentOrder || !rule.allowed || retainedCancellationFlow.stage !== CANCELLATION_STAGES.AWAITING_CANCELLATION_CONFIRMATION) { const transition = cancellationSelectionState(currentOrder, rule); if (currentOrder) retainCancellationFlow({ type: "support", category: "Cancel order", order: currentOrder, selectedOrderId: currentOrder.id, selectedOrderStatus: currentOrder.status, ...transition }); appendBot({ type: "text", text: currentOrder?.status === "Kitchen Preparing" ? "This mock order is already being prepared, so self-service cancellation is unavailable." : "Action rejected: this mock order is not eligible for self-service cancellation.", actions: currentOrder && transition.stage === CANCELLATION_STAGES.AWAITING_ESCALATION_CONFIRMATION ? ["Create support ticket", "Exit Support"] : ["Exit Support"] }); return; }
      const activity = { type: "Cancellation", status: "Cancelled", createdAt: new Date().toLocaleString(), mock: true };
      setActiveOrders((current) => current.map((order) => order.id === currentOrder.id ? { ...order, status: "Cancelled", activity: [...(order.activity || []), activity] } : order));
      const cancelledFlow = { ...retainedCancellationFlow, selectedOrderStatus: "Cancelled", stage: "cancelled", cancellationActivity: activity };
      cancellationFlowRef.current = cancelledFlow;
      setFlow(cancelledFlow);
      appendBot({ type: "text", text: `Action completed: mock order ${currentOrder.id} is now Cancelled. The cancellation was recorded locally. Any refund review is subject to the mock cancellation policy; no refund has been promised or approved.`, actions: ["Exit Support"] });
      return;
    }
    if (action === "Confirm instruction update") {
      const instructionFlow = deliveryInstructionFlowRef.current || flow;
      const currentOrder = activeOrders.find((order) => order.id === instructionFlow.selectedOrderId);
      if (!currentOrder || !canChangeDeliveryInstructions(currentOrder) || instructionFlow.stage !== "awaiting_confirmation" || !instructionFlow.pendingInstruction?.trim()) {
        appendBot({ type: "text", text: currentOrder?.status === "Out for Delivery" ? "This mock order has been dispatched, so delivery instructions can no longer be changed." : "Action rejected: this mock order is no longer eligible for delivery-instruction changes.", actions: currentOrder && !["Delivered", "Cancelled", "Cancelled (simulated)"].includes(currentOrder.status) ? ["Create support ticket", "Exit Support"] : ["Exit Support"] });
        return;
      }
      const activity = { type: "Delivery instructions updated", instructions: instructionFlow.pendingInstruction.trim(), createdAt: new Date().toLocaleString(), mock: true };
      setActiveOrders((current) => current.map((order) => order.id === currentOrder.id ? { ...order, instructions: instructionFlow.pendingInstruction.trim(), activity: [...(order.activity || []), activity] } : order));
      deliveryInstructionFlowRef.current = null;
      setFlow({ type: "support", category: "Change delivery instructions", selectedOrderId: currentOrder.id, stage: "updated", instructionActivity: activity });
      appendBot({ type: "text", text: deliveryInstructionCompletionMessage({ orderReference: currentOrder.id, instruction: instructionFlow.pendingInstruction }), actions: ["Exit Support"] });
      return;
    }
    if (action === "Confirm address update") {
      const addressFlow = deliveryAddressFlowRef.current || flow;
      const currentOrder = activeOrders.find((order) => order.id === addressFlow.selectedOrderId);
      if (!currentOrder || !canChangeDeliveryAddress(currentOrder) || addressFlow.stage !== "awaiting_confirmation" || !addressFlow.proposedAddress?.trim()) {
        appendBot({ type: "text", text: "Action rejected: this mock order is not eligible for a delivery-address update or no proposed address was confirmed.", actions: ["Exit Support"] });
        return;
      }
      const updatedOrder = applyConfirmedDeliveryAddressUpdate(currentOrder, addressFlow.proposedAddress);
      setActiveOrders((current) => current.map((order) => order.id === currentOrder.id ? updatedOrder : order));
      deliveryAddressFlowRef.current = null;
      setFlow({ type: "support", category: "Change delivery address", selectedOrderId: currentOrder.id, stage: "updated", addressActivity: updatedOrder.activity.at(-1) });
      appendBot({ type: "text", text: `Action completed: the delivery address for mock order ${currentOrder.id} was updated locally to ${updatedOrder.addressLabel}. A mock activity-history entry was recorded. No restaurant, courier or external platform was updated.`, actions: ["Exit Support"] });
      return;
    }
    if (action === "Reset search") sendMessage("Show popular food");
    else if (action === "Increase budget") sendMessage("Show the same options under £20");
    else sendMessage("Show closest matches");
  };

  const appendBot = (reply) => setMessages((current) => [...current, { id: Date.now() + Math.random(), from: "bot", ...reply }]);
  const removeFilter = (label) => {
    const keys = { Budget: "budget", Diet: "diet", Spicy: "spicy", Healthy: "healthy", "Food type": "foodTypes", Protein: "protein", Fastest: "quick", Nearby: "nearby" };
    const key = keys[label];
    if (!key) return;

    const nextFilters = { ...activeFilters, [key]: Array.isArray(activeFilters[key]) ? [] : null };
    const discoveryProfile = { ...defaultProfile, preferredDiet: "None", allergies: [], budgetMax: null };
    const refreshedReply = buildBotReply("Refresh matching food", nextFilters, discoveryProfile);
    setActiveFilters(refreshedReply.nextFilters || nextFilters);
    appendBot({
      ...refreshedReply,
      text: `${label} filter removed. Saved allergy restrictions were not changed. ${refreshedReply.text}`,
    });
  };
  const saveProfile = (next) => { setProfile(next); setActiveFilters((current) => ({ ...current, allergens: [...new Set([...(current.allergens || []), ...next.allergies])] })); setPreferencesOpen(false); setToast("Profile saved locally"); window.setTimeout(() => setToast(""), 2200); };
  const resetProfile = () => { setProfile(defaultProfile); setPreferencesOpen(false); setToast("Profile reset"); window.setTimeout(() => setToast(""), 2200); };
  const reviewReorder = (order) => { setReorderConfirm(order); setFlow({ type: "reorder", orderId: order.id }); };
  const confirmReorder = () => { reorderConfirm.items.forEach((old) => { const current = items.find((item) => item.id === old.itemId); if (current) { const valid = old.customizations.filter((option) => !option.toLowerCase().includes("double patty") || current.name.toLowerCase().includes("burger")); const customizationPrice = valid.reduce((sum, option) => sum + (option === "Double patty" ? 4 : option === "Add avocado" ? 2.5 : 0), 0); addToCart({ ...current, quantity: old.quantity, customizations: valid, customizationPrice }); } }); appendBot({ type: "text", text: `Action completed: available items from mock order ${reorderConfirm.id} were added at current prices. Unavailable items were skipped.` }); setReorderConfirm(null); setFlow({ type: "discovery" }); };
  const beginSupport = (category, { selectLatestOrder = false, proposedInstruction = "", deliveryAddressStart = null, refundStatusStart = null, paymentFailureStart = null } = {}) => {
    deliveryInstructionFlowRef.current = null;
    deliveryAddressFlowRef.current = null;
    if (category !== "Speak to a person") humanSupportFlowRef.current = null;
    if (category !== "Cancel order") cancellationFlowRef.current = null;
    setActiveFilters({ allergens: [...(profile.allergies || [])], foodTypes: [] });
    if (category === "Missing item") {
      const deliveredOrders = activeOrders.filter((order) => order.status === "Delivered");
      if (!deliveredOrders.length) {
        setFlow({ type: "support", category, stage: "unavailable" });
        appendBot({ type: "text", text: "A missing-item issue can only be reported after delivery. I could not find a delivered mock order.", actions: ["Exit Support"] });
        return;
      }
      if (deliveredOrders.length === 1) {
        const order = deliveredOrders[0];
        setFlow({ type: "support", category, order, step: "item", selectedItems: [] });
        appendBot({ type: "support-detail", text: `Missing item: select one or more items from delivered mock order ${order.id}.`, order, selectableItems: order.items, actions: ["Exit Support"] });
        return;
      }
      setFlow({ type: "support", category, step: "order" });
      appendBot({ type: "support", text: "Missing item support started. Select the relevant delivered mock order.", orders: deliveredOrders, actions: ["Exit Support"] });
      return;
    }
    if (category === "Wrong item") {
      const deliveredOrders = activeOrders.filter((order) => order.status === "Delivered");
      if (!deliveredOrders.length) {
        setFlow({ type: "support", category, step: "unavailable" });
        appendBot({ type: "text", text: "A wrong-item issue can only be reported after delivery. I could not find a delivered mock order.", actions: ["Exit Support"] });
        return;
      }
      if (deliveredOrders.length === 1) {
        const order = deliveredOrders[0];
        setFlow({ type: "support", category, order, step: "item" });
        appendBot({ type: "support-detail", text: `Wrong item: select the ordered item that was incorrect from delivered mock order ${order.id}.`, order, selectableItems: order.items, actions: ["Exit Support"] });
        return;
      }
      setFlow({ type: "support", category, step: "order" });
      appendBot({ type: "support", text: "Wrong item support started. Select the relevant delivered mock order.", orders: deliveredOrders, actions: ["Exit Support"] });
      return;
    }
    if (["Cold food", "Damaged food"].includes(category)) {
      const deliveredOrders = activeOrders.filter((order) => order.status === "Delivered");
      if (!deliveredOrders.length) {
        setFlow({ type: "support", category, stage: "unavailable" });
        appendBot({ type: "text", text: "A cold or damaged food issue can only be reported after delivery. I could not find a delivered mock order.", actions: ["Exit Support"] });
        return;
      }
      if (deliveredOrders.length === 1) {
        const order = deliveredOrders[0];
        setFlow({ type: "support", category, order, selectedOrderId: order.id, stage: "awaiting_item" });
        appendBot({ type: "support-detail", text: `${category}: select the affected item from delivered mock order ${order.id}.`, order, selectableItems: order.items, actions: ["Exit Support"] });
        return;
      }
      setFlow({ type: "support", category, stage: "awaiting_order" });
      appendBot({ type: "support", text: `${category} support started. Select the relevant delivered mock order.`, orders: deliveredOrders, actions: ["Exit Support"] });
      return;
    }
    if (category === "Cancel order") {
      const cancellationOrders = activeOrders.filter((order) => !["Delivered", "Cancelled", "Cancelled (simulated)"].includes(order.status)).map((order) => ({ ...order, cancellationEligibility: cancellationRule(order.status).allowed ? "Eligible for self-service cancellation" : "Ineligible — support escalation available" }));
      if (!cancellationOrders.length) { setFlow({ type: "support", category, stage: "unavailable" }); appendBot({ type: "text", text: "I could not find an active mock order available for cancellation review.", actions: ["Exit Support"] }); return; }
      if (selectLatestOrder) {
        const latestOrder = newestEligibleCancellationOrder(cancellationOrders);
        if (!latestOrder) { setFlow({ type: "support", category, stage: "unavailable" }); appendBot({ type: "text", text: "I could not find an eligible active mock order available for cancellation review.", actions: ["Exit Support"] }); return; }
        const rule = cancellationRule(latestOrder.status);
        const transition = cancellationSelectionState(latestOrder, rule);
        appendBot({ type: "support-detail", text: `${rule.reason} Review the newest eligible mock order below and confirm explicitly before any simulated cancellation is recorded.`, order: latestOrder, showOrderItems: true, actions: ["Confirm simulated cancellation", "Exit Support"] });
        retainCancellationFlow({ type: "support", category, order: latestOrder, selectedOrderId: latestOrder.id, selectedOrderStatus: latestOrder.status, ...transition });
        return;
      }
      retainCancellationFlow({ type: "support", category, selectedOrderId: null, selectedOrderStatus: null, stage: CANCELLATION_STAGES.AWAITING_ORDER });
      appendBot({ type: "support", text: "Select an active mock order. Eligible and ineligible self-service cancellation states are labelled below.", orders: cancellationOrders, actions: ["Exit Support"] });
      return;
    }
    if (category === "Change delivery instructions") {
      const instructionStart = prepareDeliveryInstructionStart({ orders: activeOrders, selectLatestOrder, proposedInstruction });
      const { eligibleOrders } = instructionStart;
      if (!eligibleOrders.length) { deliveryInstructionFlowRef.current = null; setFlow({ type: "support", category, stage: "unavailable" }); appendBot({ type: "text", text: "Delivery instructions can only be changed before the order is dispatched. I could not find an eligible mock delivery order.", actions: ["Exit Support"] }); return; }
      if (selectLatestOrder) {
        const { order, existingInstruction, pendingInstruction, mode } = instructionStart;
        const instructionFlow = { type: "support", category, order, selectedOrderId: order.id, existingInstruction, pendingInstruction, stage: mode };
        deliveryInstructionFlowRef.current = instructionFlow;
        setFlow(instructionFlow);
        if (mode === "awaiting_confirmation") {
          appendBot({ type: "support-detail", text: deliveryInstructionConfirmationMessage({ orderReference: order.id, existingInstruction, proposedInstruction: pendingInstruction }), order, showOrderItems: true, showDeliveryDetails: true, actions: ["Confirm instruction update", "Exit Support"] });
        } else {
          appendBot({ type: "support-detail", text: `Enter the new delivery instructions for the newest eligible mock order ${order.id}. Do not include access codes or sensitive address information.`, order, showOrderItems: true, showDeliveryDetails: true, actions: ["Exit Support"] });
        }
        return;
      }
      if (eligibleOrders.length === 1) {
        const order = eligibleOrders[0];
        const instructionFlow = { type: "support", category, order, selectedOrderId: order.id, existingInstruction: order.instructions || "None", pendingInstruction: "", stage: "awaiting_instruction" };
        deliveryInstructionFlowRef.current = instructionFlow;
        setFlow(instructionFlow);
        appendBot({ type: "support-detail", text: `Enter the new delivery instructions for eligible mock order ${order.id}. Do not include access codes or sensitive address information.`, order, showDeliveryDetails: true, actions: ["Exit Support"] });
        return;
      }
      const instructionFlow = { type: "support", category, stage: "awaiting_order" };
      deliveryInstructionFlowRef.current = instructionFlow;
      setFlow(instructionFlow);
      appendBot({ type: "support", text: "Select an eligible active mock delivery order to change its instructions.", orders: eligibleOrders, actions: ["Exit Support"] });
      return;
    }
    if (category === "Change delivery address") {
      const addressStart = deliveryAddressStart;
      const eligibleOrders = addressStart?.eligibleOrders || [];
      if (!eligibleOrders.length) { deliveryAddressFlowRef.current = null; setFlow({ type: "support", category, stage: "unavailable" }); appendBot({ type: "text", text: "Delivery addresses can only be changed for eligible pre-dispatch mock delivery orders. I could not find an eligible order.", actions: ["Exit Support"] }); return; }
      if (addressStart.latestOrderRequested) {
        const { order, existingAddress, proposedAddress, mode } = addressStart;
        const addressFlow = { type: "support", category, order, selectedOrderId: order.id, existingAddress, proposedAddress, stage: mode };
        deliveryAddressFlowRef.current = addressFlow;
        setFlow(addressFlow);
        if (mode === "awaiting_confirmation") {
          appendBot({ type: "support-detail", text: `Confirm delivery-address change. Mock order: ${order.id}. Current delivery address: ${existingAddress}. Proposed address: ${proposedAddress}. The current address remains unchanged until explicit confirmation. This is a local mock-order update only.`, order, showOrderItems: true, showDeliveryDetails: true, actions: ["Confirm address update", "Exit Support"] });
        } else {
          appendBot({ type: "support-detail", text: `Enter the new delivery address for the newest eligible mock order ${order.id}. The current address remains unchanged until explicit confirmation.`, order, showOrderItems: true, showDeliveryDetails: true, actions: ["Exit Support"] });
        }
        return;
      }
      const addressFlow = { type: "support", category, proposedAddress: addressStart.proposedAddress, stage: "awaiting_order" };
      deliveryAddressFlowRef.current = addressFlow;
      setFlow(addressFlow);
      appendBot({ type: "support", text: "Select an eligible active mock delivery order to change its delivery address.", orders: eligibleOrders, actions: ["Exit Support"] });
      return;
    }
    if (category === "Refund status") {
      const relevantOrders = refundStatusStart?.relevantOrders || [];
      if (!relevantOrders.length) { setFlow({ type: "support", category, stage: "unavailable" }); appendBot({ type: "text", text: "I could not find a relevant active or cancelled mock order for refund-status review. Payment and refund information in this prototype is simulated.", actions: ["Exit Support"] }); return; }
      if (refundStatusStart.mode === "display") {
        const order = refundStatusStart.order;
        setFlow({ type: "support", category, order, selectedOrderId: order.id, stage: "display" });
        appendBot({ type: "support-detail", text: refundStatusMessage(order), order, showOrderItems: true, actions: ["Exit Support"] });
        return;
      }
      setFlow({ type: "support", category, stage: "awaiting_order" });
      appendBot({ type: "support", text: "Select a relevant active or cancelled mock order to review recorded refund information. This is simulated payment and refund data.", orders: relevantOrders, actions: ["Exit Support"] });
      return;
    }
    if (category === "Payment failure") {
      const relevantOrders = paymentFailureStart?.relevantOrders || [];
      if (!relevantOrders.length) { setFlow({ type: "support", category, stage: "unavailable" }); appendBot({ type: "text", text: "I could not find a relevant mock order for payment review. BiteBuddy cannot access real bank, card, wallet or payment-provider records. All payment information shown in this prototype is simulated.", actions: ["Exit Support"] }); return; }
      if (paymentFailureStart.mode === "display") {
        const order = paymentFailureStart.order;
        setFlow({ type: "support", category, order, selectedOrderId: order.id, stage: "display" });
        appendBot({ type: "support-detail", text: paymentFailureMessage(order), order, showOrderItems: true, actions: ["Exit Support"] });
        return;
      }
      setFlow({ type: "support", category, stage: "awaiting_order" });
      appendBot({ type: "support", text: "Select a relevant mock order to review recorded payment information. BiteBuddy cannot access real payment-provider records, and all payment information shown here is simulated.", orders: relevantOrders, actions: ["Exit Support"] });
      return;
    }
    if (category === "Speak to a person") {
      const humanFlow = { type: "support", category, stage: "awaiting_order" };
      humanSupportFlowRef.current = humanFlow;
      setFlow(humanFlow);
      appendBot({ type: "support", text: "Select the relevant mock order before describing what you need help with.", orders: activeOrders, actions: ["Exit Support"] });
      return;
    }
    setFlow({ type: "support", category, step: "order" });
    appendBot({ type: "support", text: `${category} support started. Select the relevant mock order.`, orders: activeOrders, actions: ["Exit Support"] });
  };
  const startTracking = () => {
    const trackableOrders = activeOrders
      .filter((order) => TRACKABLE_STATUSES.includes(order.status))
      .sort((first, second) => (Date.parse(second.createdAt || "") || 0) - (Date.parse(first.createdAt || "") || 0));
    if (!trackableOrders.length) { setFlow({ type: "tracking", stage: "unavailable" }); appendBot({ type: "text", text: "I could not find an active mock order available for tracking." }); return; }
    const order = trackableOrders[0];
    setFlow({ type: "tracking", category: "Track order", order, stage: "display" });
    appendBot({ type: "tracking-order", text: `This is simulated tracking based on mock order data for ${order.id}.`, order });
  };
  const selectSupportOrder = (order) => {
    const category = flow.category;
    if (category === "Track order") { const currentOrder = activeOrders.find((candidate) => candidate.id === order.id); if (!currentOrder || !TRACKABLE_STATUSES.includes(currentOrder.status)) { appendBot({ type: "text", text: "I could not find that active mock order available for tracking." }); return; } setFlow({ type: "tracking", category, order: currentOrder, stage: "display" }); appendBot({ type: "tracking-order", text: `This is simulated tracking based on mock order data for ${currentOrder.id}.`, order: currentOrder }); return; }
    if (category === "Missing item" && order.status !== "Delivered") { appendBot({ type: "text", text: `Action unavailable: mock order ${order.id} is ${order.status}. A missing-item issue can only be reported after delivery.` }); return; }
    if (category === "Wrong item" && order.status !== "Delivered") { appendBot({ type: "text", text: `Action unavailable: mock order ${order.id} is ${order.status}. A wrong-item issue can only be reported after delivery.` }); return; }
    if (["Cold food", "Damaged food"].includes(category) && order.status !== "Delivered") { appendBot({ type: "text", text: `Action unavailable: mock order ${order.id} is ${order.status}. A cold or damaged food complaint can only be reported after delivery.` }); return; }
    if (["Cold food", "Damaged food"].includes(category)) { appendBot({ type: "support-detail", text: `${category}: select the affected item from delivered mock order ${order.id}.`, order, selectableItems: order.items, actions: ["Exit Support"] }); setFlow({ type: "support", category, order, selectedOrderId: order.id, stage: "awaiting_item" }); return; }
    if (category === "Late order") { const text = order.etaState === "within" ? `Mock order ${order.id} is still within its delivery window. Tracking is simulated and courier location is not live.` : order.etaState === "late" ? `Mock order ${order.id} is ${order.delayMinutes} minutes past its estimate. Updated mock tracking is available; escalation is offered after the configured 20-minute threshold. No compensation is promised.` : `Order ${order.id} has already been delivered.`; appendBot({ type: "support-detail", text, order, actions: order.delayMinutes >= 20 ? ["Create support ticket", "Exit Support"] : ["Exit Support"] }); setFlow({ type: "support", category, order, step: "detail" }); return; }
    if (category === "Cancel order") { const currentOrder = activeOrders.find((candidate) => candidate.id === order.id); const rule = cancellationRule(currentOrder?.status); const transition = cancellationSelectionState(currentOrder, rule); const canEscalate = transition.stage === CANCELLATION_STAGES.AWAITING_ESCALATION_CONFIRMATION; appendBot({ type: "support-detail", text: transition.rejectionReason === "closed_order" ? `Action unavailable: mock order ${order.id} has status ${currentOrder.status} and cannot be cancelled.` : rule.reason, order: currentOrder || order, showOrderItems: rule.allowed, actions: rule.allowed ? ["Confirm simulated cancellation", "Exit Support"] : canEscalate ? ["Create support ticket", "Exit Support"] : ["Exit Support"] }); retainCancellationFlow({ type: "support", category, order: currentOrder || order, selectedOrderId: currentOrder?.id || null, selectedOrderStatus: currentOrder?.status || null, ...transition }); return; }
    if (category === "Change delivery instructions") { const currentOrder = activeOrders.find((candidate) => candidate.id === order.id); if (!canChangeDeliveryInstructions(currentOrder)) { appendBot({ type: "text", text: currentOrder?.status === "Out for Delivery" ? "This mock order has been dispatched, so delivery instructions can no longer be changed." : "Action unavailable: this mock order is not eligible for delivery-instruction changes.", actions: currentOrder && !["Delivered", "Cancelled", "Cancelled (simulated)"].includes(currentOrder.status) ? ["Create support ticket", "Exit Support"] : ["Exit Support"] }); return; } const instructionFlow = { type: "support", category, order: currentOrder, selectedOrderId: currentOrder.id, existingInstruction: currentOrder.instructions || "None", pendingInstruction: "", stage: "awaiting_instruction" }; deliveryInstructionFlowRef.current = instructionFlow; setFlow(instructionFlow); appendBot({ type: "support-detail", text: `Enter the new delivery instructions for eligible mock order ${currentOrder.id}. Do not include access codes or sensitive address information.`, order: currentOrder, showDeliveryDetails: true, actions: ["Exit Support"] }); return; }
    if (category === "Change delivery address") { const currentOrder = activeOrders.find((candidate) => candidate.id === order.id); if (!canChangeDeliveryAddress(currentOrder)) { appendBot({ type: "text", text: "Action unavailable: this mock order is not eligible for a delivery-address change.", actions: ["Exit Support"] }); return; } const proposedAddress = deliveryAddressFlowRef.current?.proposedAddress?.trim() || ""; const addressFlow = { type: "support", category, order: currentOrder, selectedOrderId: currentOrder.id, existingAddress: currentOrder.addressLabel || "None", proposedAddress, stage: proposedAddress ? "awaiting_confirmation" : "awaiting_address" }; deliveryAddressFlowRef.current = addressFlow; setFlow(addressFlow); appendBot({ type: "support-detail", text: proposedAddress ? `Confirm delivery-address change. Mock order: ${currentOrder.id}. Current delivery address: ${addressFlow.existingAddress}. Proposed address: ${proposedAddress}. The current address remains unchanged until explicit confirmation. This is a local mock-order update only.` : `Enter the new delivery address for eligible mock order ${currentOrder.id}. The current address remains unchanged until explicit confirmation.`, order: currentOrder, showOrderItems: true, showDeliveryDetails: true, actions: proposedAddress ? ["Confirm address update", "Exit Support"] : ["Exit Support"] }); return; }
    if (category === "Refund status") { const currentOrder = activeOrders.find((candidate) => candidate.id === order.id); if (!isRefundRelevantOrder(currentOrder)) { appendBot({ type: "text", text: "I could not find that relevant active or cancelled mock order for refund-status review.", actions: ["Exit Support"] }); return; } setFlow({ type: "support", category, order: currentOrder, selectedOrderId: currentOrder.id, stage: "display" }); appendBot({ type: "support-detail", text: refundStatusMessage(currentOrder), order: currentOrder, showOrderItems: true, actions: ["Exit Support"] }); return; }
    if (category === "Payment failure") { const currentOrder = activeOrders.find((candidate) => candidate.id === order.id); if (!isPaymentRelevantOrder(currentOrder)) { appendBot({ type: "text", text: "I could not find that relevant mock order for payment review.", actions: ["Exit Support"] }); return; } setFlow({ type: "support", category, order: currentOrder, selectedOrderId: currentOrder.id, stage: "display" }); appendBot({ type: "support-detail", text: paymentFailureMessage(currentOrder), order: currentOrder, showOrderItems: true, actions: ["Exit Support"] }); return; }
    if (category === "Speak to a person") { const currentOrder = activeOrders.find((candidate) => candidate.id === order.id); if (!currentOrder) { appendBot({ type: "text", text: "Invalid mock order reference. Select an available order." }); return; } const humanFlow = { type: "support", category, order: currentOrder, selectedOrderId: currentOrder.id, stage: "awaiting_description", issueDescription: "" }; humanSupportFlowRef.current = humanFlow; setFlow(humanFlow); appendBot({ type: "support-detail", text: "Briefly describe what you need help with.", order: currentOrder, actions: ["Exit Support"] }); return; }
    if (category === "Courier cannot find address") { appendBot({ type: "support-detail", text: `Mock order ${order.id} selected. You can create a simulated support ticket for ${category.toLowerCase()}.`, order, actions: ["Create support ticket", "Exit Support"] }); setFlow({ type: "support", category, order, step: "detail" }); return; }
    appendBot({ type: "support-detail", text: `${category}: select the affected item from mock order ${order.id}.`, order, selectableItems: order.status === "Delivered" ? order.items : [], actions: ["Exit Support"] }); setFlow({ type: "support", category, order, step: "item", selectedItems: [] });
  };
  const selectAffectedItem = (name) => {
    if (!flow.order?.items.some((item) => item.name === name)) { appendBot({ type: "text", text: `Action rejected: ${name} is not contained in mock order ${flow.order?.id || "selected"}.` }); return; }
    if (flow.category === "Missing item") {
      const selectedItems = flow.selectedItems || [];
      if (selectedItems.includes(name)) { appendBot({ type: "text", text: `${name} is already selected and will only be recorded once.` }); return; }
      const nextSelected = [...selectedItems, name];
      setFlow((current) => ({ ...current, selectedItems: nextSelected, affectedItem: nextSelected.join(", "), step: "record" }));
      appendBot({ type: "support-note", text: `Confirm missing item selection: ${nextSelected.join(", ")}. Select another delivered item if needed, or confirm to record the issue. No refund is approved automatically.`, actions: ["Record issue", "Exit Support"] });
      return;
    }
    if (flow.category === "Wrong item") {
      if (flow.order.status !== "Delivered") { appendBot({ type: "text", text: "Action rejected: a wrong-item complaint can only be reported for a delivered order." }); return; }
      setFlow((current) => ({ ...current, affectedItem: name, step: "note" }));
      appendBot({ type: "support-note", text: `Expected item selected from delivered mock order ${flow.order.id}: ${name}. Describe what incorrect item was received instead.`, actions: ["Exit Support"] });
      return;
    }
    if (["Cold food", "Damaged food"].includes(flow.category)) {
      if (flow.order.status !== "Delivered") { appendBot({ type: "text", text: "Action rejected: a cold or damaged food complaint can only be reported for a delivered order." }); return; }
      setFlow((current) => ({ ...current, selectedOrderId: current.order.id, selectedItem: name, affectedItem: name, issueNote: "", stage: "awaiting_description" }));
      appendBot({ type: "support-note", text: `${name} selected from delivered mock order ${flow.order.id}. Add a short description of the ${flow.category.toLowerCase()} issue.`, actions: ["Exit Support"], photoPlaceholder: true });
      return;
    }
    setFlow((current) => ({ ...current, affectedItem: name, step: /wrong|damaged|cold/i.test(current.category) ? "note" : "record" }));
    appendBot({ type: "support-note", text: /wrong/i.test(flow.category) ? `Expected item selected: ${name}. Briefly describe what you received.` : /damaged|cold/i.test(flow.category) ? `${name} selected. Add a short note; an optional prototype photo placeholder is shown below.` : `${name} selected. Confirm to record this issue.`, actions: ["Record issue", "Exit Support"], photoPlaceholder: /damaged|cold/i.test(flow.category) });
  };
  const recordMissingIssue = () => { if (!flow.selectedItems?.length) { appendBot({ type: "text", text: "Select at least one item from the delivered mock order before recording the issue." }); return; } appendBot({ type: "text", text: `Support issue recorded for delivered mock order ${flow.order.id}: ${flow.selectedItems.join(", ")}. No refund has been approved.`, actions: ["Create support ticket", "Exit Support"] }); setFlow((current) => ({ ...current, step: "recorded" })); };
  const recordWrongItemIssue = () => { const validOrder = flow.order?.status === "Delivered"; const validItem = flow.order?.items.some((item) => item.name === flow.affectedItem); if (!validOrder || !validItem || !flow.receivedItem?.trim()) { appendBot({ type: "text", text: "Action rejected: confirm a delivered mock order, its expected item, and what was received before recording the issue." }); return; } appendBot({ type: "text", text: `Support issue recorded for delivered mock order ${flow.order.id}. Expected: ${flow.affectedItem}. Received: ${flow.receivedItem}. No refund, replacement or compensation has been approved.`, actions: ["Create support ticket", "Exit Support"] }); setFlow((current) => ({ ...current, step: "recorded" })); };
  const recordQualityIssue = () => {
    if (flow.stage !== "awaiting_confirmation") { appendBot({ type: "text", text: "Action rejected: confirm the cold or damaged food details before recording." }); return; }
    const validOrder = flow.order?.status === "Delivered";
    const validItem = flow.order?.items.some((item) => item.name === flow.selectedItem);
    if (!validOrder || !validItem || !flow.issueNote?.trim()) { appendBot({ type: "text", text: "Action rejected: confirm a delivered mock order, affected item, and short issue description before recording." }); return; }
    const recordedIssue = { category: flow.category, order: flow.order, affectedItem: flow.selectedItem, description: flow.issueNote.trim() };
    appendBot({ type: "text", text: `${recordedIssue.category} issue recorded locally for delivered mock order ${recordedIssue.order.id}. Affected item: ${recordedIssue.affectedItem}. Customer description: ${recordedIssue.description}. No refund, replacement or compensation has been approved.`, actions: ["Create support ticket", "Exit Support"] });
    setFlow((current) => ({ ...current, stage: "recorded", recordedIssue }));
  };
  const createSupportTicket = (note = "") => {
    if (flow.category === "Cancel order") { appendBot({ type: "text", text: "Cancellation escalation requires explicit confirmation for the selected ineligible mock order. No ticket has been created." }); return; }
    const recordedIssue = flow.recordedIssue;
    const order = recordedIssue?.order || flow.order || activeOrders[0];
    const ticket = createTicket({ profile, order, category: recordedIssue?.category || flow.category || "General support", affectedItem: recordedIssue?.affectedItem || flow.affectedItem, note: note || recordedIssue?.description || flow.receivedItem || flow.issueNote || "" });
    setTickets((current) => [...current, ticket]);
    appendBot({ type: "ticket", text: "Your request has been sent to a support agent. This is a simulated support ticket for the prototype.", ticket, actions: ["View Support Queue", "Exit Support"] });
    setFlow({ type: "escalation", category: ticket.category, stage: "ticket_created", ticket });
  };
  const createCancellationSupportTicket = (currentOrder) => {
    const ticket = createTicket({ profile, order: currentOrder, category: "Cancel order", affectedItem: "Not specified", reason: "Customer explicitly requested simulated escalation after self-service cancellation was rejected" });
    setTickets((current) => [...current, ticket]);
    retainCancellationFlow({ type: "support", category: "Cancel order", order: currentOrder, selectedOrderId: currentOrder.id, selectedOrderStatus: currentOrder.status, stage: CANCELLATION_STAGES.TICKET_CREATED, ticket });
    appendBot({ type: "ticket", text: "Your cancellation question has been sent to simulated support. No refund, compensation, cancellation or resolution has been approved.", ticket, actions: ["View Support Queue", "Exit Support"] });
  };
  const createHumanSupportTicket = () => {
    const humanFlow = humanSupportFlowRef.current;
    const currentOrder = activeOrders.find((order) => order.id === humanFlow?.selectedOrderId);
    if (!humanFlow || humanFlow.stage !== "awaiting_confirmation" || !currentOrder || !humanFlow.issueDescription?.trim()) { appendBot({ type: "text", text: "Submit and confirm a valid support description before creating a simulated ticket." }); return; }
    const ticket = createTicket({ profile, order: currentOrder, category: "Speak to a person", affectedItem: "Not specified", note: humanFlow.issueDescription.trim(), reason: humanFlow.issueDescription.trim() });
    setTickets((current) => [...current, ticket]);
    const ticketFlow = { ...humanFlow, order: currentOrder, stage: "ticket_created", ticket };
    humanSupportFlowRef.current = ticketFlow;
    setFlow(ticketFlow);
    appendBot({ type: "ticket", text: "Your request has been sent to a support agent. This is a simulated support ticket for the prototype; no live agent has joined this conversation.", ticket, actions: ["View Support Queue", "Exit Support"] });
  };

  const sendMessage = (value = input) => {
    const trimmed = value.trim();
    if (!trimmed) { if (humanSupportFlowRef.current?.stage === "awaiting_description") appendBot({ type: "text", text: "Briefly describe what you need help with before continuing." }); return; }
    if (typing) return;
    const submittedFlow = deliveryInstructionFlowRef.current?.stage === "awaiting_instruction" ? deliveryInstructionFlowRef.current : deliveryAddressFlowRef.current?.stage === "awaiting_address" ? deliveryAddressFlowRef.current : flow;
    const submittedHumanFlow = humanSupportFlowRef.current;

    const userMessage = { id: Date.now(), from: "user", type: "text", text: trimmed };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setTyping(true);

    window.setTimeout(async () => {
      const lower = normaliseInput(trimmed);
      if (/cancel (flow|support)|exit support|start over/.test(lower)) { setTyping(false); deliveryInstructionFlowRef.current = null; humanSupportFlowRef.current = null; cancellationFlowRef.current = null; setFlow({ type: "discovery" }); appendBot({ type: "text", text: "Flow cancelled. Temporary support state cleared." }); return; }
      if (submittedHumanFlow?.category === "Speak to a person" && submittedHumanFlow.stage === "awaiting_description") {
        const currentOrder = activeOrders.find((order) => order.id === submittedHumanFlow.selectedOrderId);
        setTyping(false);
        if (!currentOrder) { appendBot({ type: "text", text: "Invalid mock order reference. The support request was not recorded." }); return; }
        const confirmationFlow = { ...submittedHumanFlow, order: currentOrder, issueDescription: trimmed, stage: "awaiting_confirmation" };
        humanSupportFlowRef.current = confirmationFlow;
        setFlow(confirmationFlow);
        appendBot({ type: "support-detail", text: `Confirm simulated support request. Mock order: ${currentOrder.id}. Current status: ${currentOrder.status}. Customer issue summary: ${trimmed}. This is simulated support; no refund, compensation or resolution is promised.`, order: currentOrder, actions: ["Create support ticket", "Exit Support"] });
        return;
      }
      if (submittedFlow.type === "support" && submittedFlow.category === "Change delivery instructions" && submittedFlow.stage === "awaiting_instruction") {
        const currentOrder = activeOrders.find((order) => order.id === submittedFlow.selectedOrderId);
        setTyping(false);
        if (!canChangeDeliveryInstructions(currentOrder)) { appendBot({ type: "text", text: currentOrder?.status === "Out for Delivery" ? "This mock order has been dispatched, so delivery instructions can no longer be changed." : "Action rejected: this mock order is no longer eligible for delivery-instruction changes.", actions: currentOrder && !["Delivered", "Cancelled", "Cancelled (simulated)"].includes(currentOrder.status) ? ["Create support ticket", "Exit Support"] : ["Exit Support"] }); return; }
        const existingInstruction = currentOrder.instructions || "None";
        if (trimmed.toLocaleLowerCase() === existingInstruction.trim().toLocaleLowerCase()) {
          const resetFlow = { ...submittedFlow, order: currentOrder, existingInstruction, pendingInstruction: "", stage: "awaiting_instruction" };
          deliveryInstructionFlowRef.current = resetFlow;
          setFlow(resetFlow);
          appendBot({ type: "text", text: "That instruction is already saved. Enter a different instruction or exit support.", actions: ["Exit Support"] });
          return;
        }
        const confirmationFlow = { ...submittedFlow, order: currentOrder, existingInstruction, pendingInstruction: trimmed, stage: "awaiting_confirmation" };
        deliveryInstructionFlowRef.current = confirmationFlow;
        setFlow(confirmationFlow);
        setActiveFilters({ allergens: [...(profile.allergies || [])], foodTypes: [] });
        appendBot({ type: "support-detail", text: deliveryInstructionConfirmationMessage({ orderReference: currentOrder.id, existingInstruction: currentOrder.instructions || "None", proposedInstruction: trimmed }), order: currentOrder, showDeliveryDetails: true, actions: ["Confirm instruction update", "Exit Support"] });
        return;
      }
      if (submittedFlow.type === "support" && submittedFlow.category === "Change delivery address" && submittedFlow.stage === "awaiting_address") {
        const currentOrder = activeOrders.find((order) => order.id === submittedFlow.selectedOrderId);
        setTyping(false);
        if (!canChangeDeliveryAddress(currentOrder)) { appendBot({ type: "text", text: "Action rejected: this mock order is no longer eligible for a delivery-address change.", actions: ["Exit Support"] }); return; }
        const confirmationFlow = { ...submittedFlow, order: currentOrder, existingAddress: currentOrder.addressLabel || "None", proposedAddress: trimmed, stage: "awaiting_confirmation" };
        deliveryAddressFlowRef.current = confirmationFlow;
        setFlow(confirmationFlow);
        appendBot({ type: "support-detail", text: `Confirm delivery-address change. Mock order: ${currentOrder.id}. Current delivery address: ${confirmationFlow.existingAddress}. Proposed address: ${trimmed}. The current address remains unchanged until explicit confirmation. This is a local mock-order update only.`, order: currentOrder, showOrderItems: true, showDeliveryDetails: true, actions: ["Confirm address update", "Exit Support"] });
        return;
      }
      if (submittedFlow.type === "support" && ["Cold food", "Damaged food"].includes(submittedFlow.category) && submittedFlow.stage === "awaiting_description") {
        const selectedOrder = submittedFlow.order;
        const selectedItem = submittedFlow.selectedItem;
        const validSelection = selectedOrder?.id === submittedFlow.selectedOrderId && selectedOrder.status === "Delivered" && selectedOrder.items.some((item) => item.name === selectedItem);
        setTyping(false);
        if (!validSelection) { appendBot({ type: "text", text: "Action rejected: the delivered mock order or affected item is no longer valid." }); return; }
        setFlow({ ...submittedFlow, issueNote: trimmed, stage: "awaiting_confirmation" });
        appendBot({ type: "support-note", text: `Issue category: ${submittedFlow.category}. Mock order: ${submittedFlow.selectedOrderId}. Affected item: ${selectedItem}. Description: ${trimmed}. No refund, replacement or compensation will be approved automatically.`, actions: ["Record issue", "Exit Support"], photoPlaceholder: true });
        return;
      }
      const { interpretation, source } = await interpretWithRuleBasedFallback({
        message: trimmed,
        context: {
          recentHistory: messages.slice(-6).filter((message) => message.text).map((message) => ({ role: message.from === "user" ? "user" : "assistant", content: message.text.slice(0, 500) })),
          activeFilters: {
            budget: activeFilters.budget ?? null,
            diet: activeFilters.diet ?? null,
            spicy: Boolean(activeFilters.spicy),
            healthy: Boolean(activeFilters.healthy),
            foodTypes: activeFilters.foodTypes || [],
            protein: activeFilters.protein ?? null,
            quick: Boolean(activeFilters.quick),
            nearby: Boolean(activeFilters.nearby),
            allergens: activeFilters.allergens || [],
          },
          lockedAllergies: profile.allergies || [],
          selectedOrderReference: submittedFlow.selectedOrderId || submittedFlow.order?.id || null,
          supportFlowStage: submittedFlow.stage || submittedFlow.step || null,
        },
      }, {
        allowedItemIds: allItems().map((item) => item.id),
        allowedOrderReferences: [...new Set([...activeOrders.map((order) => order.id), ...orderHistory.map((order) => order.id)])],
      });
      setAssistantSource(source);
      const deterministicIntent = supportIntent(lower);
      const providerIntent = interpretation?.intent === "support" ? interpretation.entities.supportIssue : null;
      const intent = ["Cancel order", "Change delivery address", "Refund status", "Payment failure"].includes(deterministicIntent) ? deterministicIntent : providerIntent || deterministicIntent;
      if (intent) {
        const latestOrderRequested = LATEST_ORDER_REQUEST.test(lower);
        const proposedInstruction = intent === "Change delivery instructions" ? extractProposedDeliveryInstruction(trimmed) : "";
        const deliveryAddressStart = intent === "Change delivery address" ? prepareDeliveryAddressStart({ message: trimmed, orders: activeOrders }) : null;
        const refundStatusStart = intent === "Refund status" ? prepareRefundStatusStart({ message: trimmed, orders: activeOrders }) : null;
        const paymentFailureStart = intent === "Payment failure" ? preparePaymentFailureStart({ message: trimmed, orders: activeOrders }) : null;
        setTyping(false);
        beginSupport(intent, { selectLatestOrder: latestOrderRequested && ["Cancel order", "Change delivery instructions"].includes(intent), proposedInstruction, deliveryAddressStart, refundStatusStart, paymentFailureStart });
        return;
      }
      if (interpretation?.intent === "order_tracking" || /track( my)? order|order tracking|where is my order/.test(lower)) { setTyping(false); startTracking(); return; }
      if (interpretation?.intent === "preferences" || /view preferences|my preferences/.test(lower)) { setTyping(false); setPreferencesOpen(true); appendBot({ type: "text", text: "Your locally saved mock preference profile is open." }); return; }
      if (interpretation?.intent === "previous_orders" || /previous orders|reorder|repeat my usual|burger i had|favourite restaurant/.test(lower)) { setTyping(false); setFlow({ type: "reorder" }); appendBot({ type: "orders", text: "Here are your completed mock orders. Review availability, current prices and customisations before confirming.", orders: orderHistory }); return; }
      if (flow.type === "support" && flow.category === "Missing item" && flow.step === "record") { setTyping(false); appendBot({ type: "text", text: "Use the Record issue confirmation action to continue with the selected missing items.", actions: ["Record issue", "Exit Support"] }); return; }
      if (flow.type === "support" && flow.category === "Wrong item" && flow.step === "note") { setTyping(false); setFlow((current) => ({ ...current, receivedItem: trimmed, step: "confirm" })); appendBot({ type: "support-note", text: `Confirm wrong-item issue for delivered mock order ${flow.order.id}. Expected: ${flow.affectedItem}. Received instead: ${trimmed}. No refund, replacement or compensation will be approved automatically.`, actions: ["Record issue", "Exit Support"] }); return; }
      if (flow.type === "support" && ["note", "record"].includes(flow.step)) { setTyping(false); createSupportTicket(trimmed); return; }
      const reply = buildBotReply(enrichRuleBasedInput(trimmed, interpretation), activeFilters, profile);
      if (reply.nextFilters) setActiveFilters(reply.nextFilters);
      setMessages((current) => [...current, { id: Date.now() + 1, from: "bot", ...reply }]);
      setTyping(false);
    }, 1000);
  };

  const heroItem = items.find((item) => item.id === "chippy-cod");
  const activeFilterChips = [activeFilters.budget && ["Budget", `Under ${money(activeFilters.budget)}`], activeFilters.diet && ["Diet", activeFilters.diet], activeFilters.spicy && ["Spicy", "Spicy"], activeFilters.healthy && ["Healthy", "Healthy"], activeFilters.foodTypes?.length && ["Food type", activeFilters.foodTypes.join(", ")], activeFilters.protein && ["Protein", activeFilters.protein], activeFilters.quick && ["Fastest", "Fastest"], activeFilters.nearby && ["Nearby", "Nearby"], ...(activeFilters.allergens || []).map((value) => [null, `Avoid ${value}`])].filter(Boolean);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,79,24,0.19),transparent_34%),linear-gradient(135deg,#0C0F14_0%,#111720_46%,#0C0F14_100%)] p-2 pb-24 text-white sm:p-5">
      {toast && (
        <div className="fixed left-1/2 top-5 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#161B22]/95 px-4 py-3 text-sm font-semibold shadow-glow backdrop-blur-xl animate-float-in">
          <ShoppingBag size={16} className="text-bite-primary" />
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-[1500px]">
        <section className="min-h-[calc(100vh-40px)] rounded-[22px] border border-white/10 bg-white/[0.045] p-4 shadow-2xl backdrop-blur-2xl sm:rounded-[28px] sm:p-6">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-bite-primary">
                <Sparkles size={16} />
                BiteBuddy Prime
              </div>
              <h1 className="text-3xl font-extrabold tracking-normal sm:text-5xl">Dinner that reads the room.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 sm:text-base sm:leading-7">
                Rule-based discovery, persistent cart sync, smart filters, and mock order tracking woven into one food delivery flow.
              </p>
              <p className="mt-2 text-xs font-medium text-white/38">Prototype using mock restaurant and order data.</p>
              <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setPreferencesOpen(true)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold">View Preferences</button><button onClick={() => setSupportQueueOpen(true)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold">Prototype Support Queue</button></div>
            </div>
            <div className="flex h-12 w-full min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-[#0C0F14]/60 px-4 lg:w-auto lg:min-w-[330px]">
              <Search size={18} className="shrink-0 text-white/45" />
              <input
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                placeholder="Search curry, fish & chips, healthy bowls..."
              />
            </div>
          </header>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <article className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-[#161B22] shadow-glow">
                <img src={heroItem.image} alt={heroItem.name} className="h-[360px] w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 sm:h-72" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex max-w-lg flex-col justify-end p-6">
                  <div className="mb-3 flex w-fit items-center gap-2 rounded-full bg-bite-primary px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
                    <Flame size={14} />
                    Trending now
                  </div>
                  <h2 className="text-2xl font-bold sm:text-3xl">{heroItem.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">{heroItem.description}</p>
                  <button
                    onClick={() => addToCart(heroItem)}
                    className="mt-5 flex h-11 w-fit items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[#0C0F14] transition hover:scale-105"
                  >
                    Add best seller <ArrowRight size={16} />
                  </button>
                </div>
              </article>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Craving lanes</h2>
                  <span className="text-sm text-white/45">Curated by BiteBuddy</span>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  {categories.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      onClick={() => {
                        setChatOpen(true);
                        sendMessage(name === "Fast" ? "Show me food near me" : `Show me ${name} options`);
                      }}
                      className="group flex min-h-24 flex-col items-start justify-between rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-left transition duration-300 hover:-translate-y-1 hover:border-bite-primary/60 hover:bg-bite-primary/10 sm:p-4"
                    >
                      <Icon size={22} className="text-bite-primary transition group-hover:scale-110" />
                      <span className="text-sm font-semibold sm:text-base">{name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Trending restaurants</h2>
                  <button className="text-sm font-semibold text-bite-primary">View all</button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {restaurants.map((restaurant) => (
                    <article
                      key={restaurant.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] transition duration-300 hover:-translate-y-1 hover:border-bite-primary/50"
                    >
                      <img src={restaurant.cover} alt={`${restaurant.name} food`} className="h-36 w-full object-cover opacity-85 transition duration-500 group-hover:scale-105" />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold">{restaurant.name}</h3>
                            <p className="text-sm text-white/52">{restaurant.cuisine}</p>
                          </div>
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-300">
                            <Star size={12} fill="currentColor" />
                            {restaurant.rating}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-xs text-white/50">
                          <span className="flex items-center gap-1"><Clock3 size={13} />{restaurant.time}</span>
                          <span className="flex items-center gap-1"><MapPin size={13} />{restaurant.distance} km</span>
                          <span>{restaurant.price}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-[24px] border border-white/10 bg-[#0C0F14]/72 p-4 backdrop-blur-xl xl:sticky xl:top-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Active cart</h2>
                  <p className="text-sm text-white/45">{cart.length} item groups</p>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-bite-primary/15 text-bite-primary">
                  <ShoppingBag size={21} />
                </div>
              </div>

              <div className="space-y-3">
                {cart.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-white/45">Your cart is waiting for a craving.</p>}
                {cart.map((item) => (
                  <div key={`${item.id}-${(item.customizations || []).join("-")}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                    <div className="flex gap-3">
                      <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold">{item.name}</h3>
                        <p className="text-xs text-white/42">{item.restaurantName}</p>
                        {!!item.customizations?.length && <p className="mt-1 text-xs text-bite-primary">{item.customizations.join(", ")}</p>}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-bold">{money(item.price)}</span>
                          <div className="flex items-center gap-2 rounded-full bg-white/10 p-1">
                            <button onClick={() => updateQuantity(item, -1)} className="grid h-6 w-6 place-items-center rounded-full bg-white/10"><Minus size={13} /></button>
                            <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item, 1)} className="grid h-6 w-6 place-items-center rounded-full bg-bite-primary"><Plus size={13} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
                <div className="flex justify-between text-white/55"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                <div className="flex justify-between text-white/55"><span>Delivery + platform</span><span>{money(fees)}</span></div>
                {cart.length > 0 && <div className="flex justify-between text-white/55"><span>Courier tip</span><span>{money(tip)}</span></div>}
                <div className="flex justify-between text-lg font-extrabold"><span>Total</span><span>{money(total)}</span></div>
                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-bite-primary font-bold shadow-glow transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!cart.length}
                >
                  Checkout <WalletCards size={18} />
                </button>
              </div>
            </aside>
          </div>
        </section>

        {checkoutOpen && (
          <CheckoutModal
            cart={cart}
            subtotal={subtotal}
            fees={fees}
            tip={tip}
            total={total}
            form={checkoutForm}
            setForm={setCheckoutForm}
            setTip={setTip}
            placeOrder={placeOrder}
            onClose={() => setCheckoutOpen(false)}
          />
        )}

        {preferencesOpen && <PreferencesPanel profile={profile} onSave={saveProfile} onReset={resetProfile} onClose={() => setPreferencesOpen(false)} />}
        {supportQueueOpen && <SupportQueue tickets={tickets} onStatus={(reference, status) => setTickets((current) => current.map((ticket) => ticket.reference === reference ? { ...ticket, status } : ticket))} onClose={() => setSupportQueueOpen(false)} />}
        {customizingItem && <CustomisationPanel item={customizingItem} onClose={() => setCustomizingItem(null)} onConfirm={(item) => { addToCart(item); setCustomizingItem(null); appendBot({ type: "text", text: `Action completed: ${item.quantity} customised ${item.name} added to cart after confirmation.` }); }} />}
        {reorderConfirm && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#10151D] p-5"><h2 className="text-xl font-extrabold">Confirm reorder</h2><p className="mt-2 text-sm text-white/55">Available items from mock order {reorderConfirm.id} will use current menu prices. Unavailable items are excluded.</p><div className="mt-4 flex gap-2"><button onClick={confirmReorder} className="h-11 flex-1 rounded-xl bg-bite-primary font-bold">Confirm & add available items</button><button onClick={() => setReorderConfirm(null)} className="rounded-xl border border-white/10 px-4">Cancel</button></div></section></div>}

        {orderPlaced && (
          <div className="fixed left-3 right-3 top-4 z-50 mx-auto max-w-md rounded-2xl border border-emerald-400/20 bg-[#101820]/95 p-4 shadow-2xl backdrop-blur-xl animate-float-in sm:left-auto sm:right-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
                <CheckCircle2 size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold">Order {orderPlaced.id} confirmed</p>
                <p className="mt-1 text-sm text-white/55">{orderPlaced.items} items arriving by {orderPlaced.eta}</p>
              </div>
              <button onClick={() => setOrderPlaced(null)} className="ml-auto grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-white/55">
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {chatOpen && (
        <aside className="fixed inset-x-2 bottom-2 z-40 flex h-[92dvh] max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#161B22]/95 shadow-2xl backdrop-blur-2xl animate-float-in sm:inset-x-auto sm:bottom-6 sm:right-5 sm:h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-3rem)] sm:w-[min(500px,calc(100vw-2.5rem))] sm:max-w-[500px] lg:w-[540px] lg:max-w-[540px]">
          <div className="shrink-0 border-b border-white/10 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-bite-primary shadow-glow sm:h-12 sm:w-12">
                  <Bot size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold">BiteBuddy</h2>
                  <p className="truncate text-sm text-white/48">Taste, budget, cart, delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-2 rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-bold text-emerald-300 sm:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  {assistantLabelForSource(assistantSource)}
                </span>
                <button onClick={() => setChatOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-white/70 transition hover:text-white" aria-label="Close BiteBuddy chat">
                  <X size={17} />
                </button>
              </div>
            </div>
            {!!activeFilterChips.length && <div className="mt-3"><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/38">Active conversation filters</p><div className="flex flex-wrap gap-1.5">{activeFilterChips.map(([key, label]) => <button key={label} onClick={() => key && removeFilter(key)} disabled={!key} className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200 disabled:cursor-default">{label}{key ? " ×" : " 🔒"}</button>)}<button onClick={() => runMessageAction("Clear conversation preferences")} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-bold text-white/50">Clear preferences</button></div></div>}
            <div className="scrollbar-soft mt-4 flex max-w-full flex-nowrap gap-2 overflow-x-auto overflow-y-hidden pb-1">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => sendMessage(reply)}
                  className="max-w-full flex-none whitespace-nowrap rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-left text-xs font-semibold text-white/72 transition hover:border-bite-primary/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bite-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#161B22] sm:text-center"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          <div ref={chatScrollRef} className="scrollbar-soft min-h-0 w-full flex-1 space-y-4 overflow-x-hidden overflow-y-auto overscroll-contain p-4 sm:p-5">
            {messages.map((message, index) => (
              <div key={message.id} ref={index === messages.length - 1 ? latestMessageRef : null}>
                <ChatMessage message={message} addToCart={addToCart} onCustomize={setCustomizingItem} onVote={voteOnMessage} onAction={runMessageAction} menuItems={items} onReorder={reviewReorder} onSupportOrder={selectSupportOrder} onAffectedItem={selectAffectedItem} />
              </div>
            ))}
            {typing && (
              <div ref={typingRef} className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.055] px-4 py-3 text-white/60 animate-float-in">
                <span className="h-2 w-2 animate-pulse rounded-full bg-bite-primary" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-bite-primary [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-bite-primary [animation-delay:300ms]" />
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
            className="shrink-0 border-t border-white/10 p-3 sm:p-4"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0C0F14]/80 p-2">
              <MessageCircle size={19} className="ml-2 text-white/35" />
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/35"
                placeholder='Try "healthy vegan under £15" or "track order"'
              />
              <button className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-bite-primary transition hover:scale-105" type="submit">
                <Send size={18} />
              </button>
            </div>
          </form>
        </aside>
        )}

        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-5 right-4 z-40 flex h-14 items-center gap-2 rounded-2xl bg-bite-primary px-4 font-extrabold shadow-glow transition hover:scale-105 sm:bottom-6 sm:right-5 sm:h-16 sm:gap-3 sm:px-5"
          >
            <Bot size={22} />
            Ask BiteBuddy
          </button>
        )}
      </div>
    </main>
  );
}

function CheckoutModal({ cart, subtotal, fees, tip, total, form, setForm, setTip, placeOrder, onClose }) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const paymentOptions = ["Apple Pay", "Google Pay", "Card ending 4242"];

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/65 p-2 backdrop-blur-sm sm:place-items-center sm:p-5">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#10151D] p-5 shadow-2xl animate-float-in sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-bite-primary">
              <WalletCards size={16} />
              Secure checkout
            </div>
            <h2 className="text-2xl font-extrabold">Review your order</h2>
            <p className="mt-1 text-sm text-white/48">{itemCount} items from your BiteBuddy cart</p>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-white/70">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <label className="block rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/80">
                <Home size={16} className="text-bite-primary" />
                Delivery address
              </span>
              <input
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0C0F14] px-3 text-sm outline-none focus:border-bite-primary/70"
              />
            </label>

            <label className="block rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/80">
                <Clock3 size={16} className="text-bite-primary" />
                Delivery time
              </span>
              <select
                value={form.deliverySlot}
                onChange={(event) => setForm((current) => ({ ...current, deliverySlot: event.target.value }))}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0C0F14] px-3 text-sm outline-none focus:border-bite-primary/70"
              >
                <option>ASAP - 25 to 35 min</option>
                <option>Today 6:00 PM - 6:20 PM</option>
                <option>Today 7:00 PM - 7:20 PM</option>
              </select>
            </label>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <span className="mb-3 flex items-center gap-2 text-sm font-bold text-white/80">
                <CreditCard size={16} className="text-bite-primary" />
                Payment method
              </span>
              <div className="grid gap-2 sm:grid-cols-3">
                {paymentOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setForm((current) => ({ ...current, payment: option }))}
                    className={`min-h-11 rounded-xl border px-3 text-sm font-bold transition ${form.payment === option ? "border-bite-primary bg-bite-primary text-white" : "border-white/10 bg-white/[0.04] text-white/62"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <label className="block rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <span className="mb-2 block text-sm font-bold text-white/80">Delivery notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className="min-h-20 w-full resize-none rounded-xl border border-white/10 bg-[#0C0F14] p-3 text-sm outline-none focus:border-bite-primary/70"
              />
            </label>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-[#0C0F14]/80 p-4">
            <h3 className="mb-3 font-extrabold">Order summary</h3>
            <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={`${item.id}-checkout-${(item.customizations || []).join("-")}`} className="flex gap-3">
                  <img src={item.image} alt={item.name} className="h-12 w-12 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{item.quantity}x {item.name}</p>
                    <p className="text-xs text-white/42">{money(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-2 text-sm font-bold text-white/80">Courier tip</p>
              <div className="grid grid-cols-3 gap-2">
                {[0, 2, 4].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTip(amount)}
                    className={`h-10 rounded-xl border text-sm font-bold ${tip === amount ? "border-bite-primary bg-bite-primary" : "border-white/10 bg-white/[0.045] text-white/65"}`}
                  >
                    {money(amount)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
              <div className="flex justify-between text-white/55"><span>Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="flex justify-between text-white/55"><span>Fees</span><span>{money(fees)}</span></div>
              <div className="flex justify-between text-white/55"><span>Tip</span><span>{money(tip)}</span></div>
              <div className="flex justify-between text-lg font-extrabold"><span>Total</span><span>{money(total)}</span></div>
            </div>

            <button onClick={placeOrder} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-bite-primary font-extrabold shadow-glow transition hover:scale-[1.02]">
              Place order <CheckCircle2 size={18} />
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
}

function ChatMessage({ message, addToCart, onCustomize, onVote, onAction, menuItems, onReorder, onSupportOrder, onAffectedItem }) {
  const isUser = message.from === "user";

  if (isUser) {
    return (
      <div className="flex justify-end animate-float-in">
        <div className="max-w-[86%] rounded-2xl rounded-br-md bg-bite-primary px-4 py-3 text-sm font-medium shadow-glow">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full animate-float-in">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-bite-primary">
        <Bot size={14} />
        BiteBuddy
      </div>
      <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-white/78">
        {message.text}
      </div>
      {message.type === "recommendations" && (
        <div className="mt-3 grid gap-3">
          {message.items.map((item) => (
            <FoodCard key={item.id} item={item} addToCart={addToCart} onCustomize={onCustomize} />
          ))}
        </div>
      )}
      {message.type === "orders" && <OrderHistoryCards orders={message.orders} menuItems={menuItems} onConfirm={onReorder} />}
      {message.type === "support" && <div className="mt-3 grid gap-2">{message.orders.map((order) => <button key={order.id} onClick={() => onSupportOrder(order)} className="rounded-xl border border-white/10 bg-black/25 p-3 text-left text-xs"><b>{order.id} · {order.restaurant}</b><p className="mt-1 text-white/45">{order.status} · {order.addressLabel}</p>{order.cancellationEligibility && <p className={`mt-1 font-bold ${order.cancellationEligibility.startsWith("Eligible") ? "text-emerald-300" : "text-amber-300"}`}>{order.cancellationEligibility}</p>}</button>)}</div>}
      {message.order && <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs"><b>Mock order {message.order.id}</b><p className="mt-1 text-white/45">{message.order.restaurant} · {message.order.status}</p>{message.showOrderItems && <p className="mt-2 text-white/65">Items: {message.order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</p>}{message.showDeliveryDetails && <div className="mt-2 space-y-1 text-white/65"><p>Delivery address label: {message.order.addressLabel}</p><p>Current instructions: {message.order.instructions || "None"}</p></div>}</div>}
      {!!message.selectableItems?.length && <div className="mt-2 flex flex-wrap gap-2">{message.selectableItems.map((item) => <button key={item.name} onClick={() => onAffectedItem(item.name)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold">{item.quantity}x {item.name}</button>)}</div>}
      {message.photoPlaceholder && <button className="mt-2 w-full rounded-xl border border-dashed border-white/15 p-3 text-xs text-white/45" disabled>Optional prototype photo placeholder (no upload service)</button>}
      {message.type === "ticket" && <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs"><b>{message.ticket.reference} · {message.ticket.category}</b><p className="mt-1">Expected response window: within 2 mock business hours</p><p className="mt-2 text-white/60">{message.ticket.summary}</p></div>}
      {!!message.actions?.length && (
        <div className="mt-2 flex flex-wrap gap-2">
          {message.actions.map((action) => <button key={action} onClick={() => onAction(action)} className="rounded-full border border-bite-primary/35 bg-bite-primary/10 px-3 py-1.5 text-xs font-bold text-bite-primary">{action}</button>)}
        </div>
      )}
      {message.type === "customize" && (
        <div className="mt-3 rounded-2xl border border-bite-primary/30 bg-bite-primary/10 p-3">
          <FoodCard item={message.item} addToCart={addToCart} compact />
          <button
            onClick={() => addToCart(message.item)}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-bite-primary text-sm font-bold transition hover:scale-[1.02]"
          >
            Confirm & Add <ShoppingBag size={16} />
          </button>
        </div>
      )}
      {message.type === "tracking" && <OrderTracker />}
      {message.type === "tracking-order" && <MockOrderTracker order={message.order} />}
      <div className="mt-2 flex items-center gap-1 text-white/38" aria-label="Rate this response">
        <button onClick={() => onVote(message.id, "up")} aria-label="Helpful response" className={`rounded-lg p-1.5 transition hover:text-white ${message.feedback === "up" ? "bg-emerald-400/15 text-emerald-300" : ""}`}><ThumbsUp size={14} /></button>
        <button onClick={() => onVote(message.id, "down")} aria-label="Unhelpful response" className={`rounded-lg p-1.5 transition hover:text-white ${message.feedback === "down" ? "bg-bite-primary/15 text-bite-primary" : ""}`}><ThumbsDown size={14} /></button>
        {message.feedbackConfirmed && <span className="ml-1 text-[11px] text-white/45">Feedback saved locally</span>}
      </div>
    </div>
  );
}

function FoodCard({ item, addToCart, onCustomize, compact = false }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#0C0F14]/70 transition duration-300 hover:border-bite-primary/50">
      <div className="flex gap-3 p-3">
        <img src={item.image} alt={item.name} className={`${compact ? "h-16 w-16" : "h-20 w-20"} rounded-xl object-cover`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold leading-tight">{item.name}</h3>
              <p className="mt-1 text-xs text-white/45">{item.restaurantName} - {item.time}</p>
            </div>
            <span className="shrink-0 font-extrabold text-bite-primary">{money(item.price)}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/55">{item.description}</p>
          {!!item.customizations?.length && <p className="mt-1 text-xs font-semibold text-bite-primary">{item.customizations.join(", ")}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/62">
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-4 text-amber-200/65">Allergens: {item.allergens?.length ? item.allergens.join(", ") : "None recorded"}</p>
          {item.explanation && <p className="mt-2 text-xs leading-5 text-emerald-200/70">{item.explanation}</p>}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
        <button onClick={() => setExpanded((value) => !value)} className="text-xs font-bold text-white/54 transition hover:text-white">
          {expanded ? "Hide action" : "Select item"}
        </button>
        <span className="flex items-center gap-1 text-xs text-emerald-300">
          <Star size={12} fill="currentColor" />
          {item.restaurantRating}
        </span>
      </div>
      {expanded && (
        <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3">
          <button onClick={() => onCustomize?.(item)} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-bold">Customise</button>
          <button onClick={() => addToCart(item)} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-[#0C0F14] transition hover:scale-[1.02]">Add as shown <Plus size={16} /></button>
        </div>
      )}
    </article>
  );
}

function OrderTracker() {
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-[#0C0F14]/70 p-4">
      <div className="mb-4 flex items-center gap-3">
        <img src={driver.avatar} alt={`${driver.name} profile`} className="h-12 w-12 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold">{driver.name}</h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/48">
            <span className="rounded-full bg-white/10 px-2 py-1 font-semibold text-white/60">Contact via secure in-app chat</span>
            <span className="flex items-center gap-1 text-emerald-300"><Star size={12} fill="currentColor" />{driver.rating}</span>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-white/[0.055] p-3">
          <p className="text-white/42">Estimated arrival</p>
          <p className="mt-1 font-bold text-white">4:30 PM</p>
        </div>
        <div className="rounded-xl bg-white/[0.055] p-3">
          <p className="text-white/42">Time remaining</p>
          <p className="mt-1 font-bold text-bite-primary">12 min</p>
        </div>
      </div>

      <div className="relative mb-5 h-10">
        <div className="absolute left-2 right-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10" />
        <div className="absolute left-2 top-1/2 h-1 w-[67%] -translate-y-1/2 rounded-full bg-bite-primary shadow-glow" />
        <div className="driver-motion absolute top-0 grid h-9 w-9 place-items-center rounded-full bg-bite-primary shadow-glow">
          <Bike size={18} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {trackingSteps.map((step, index) => {
          const done = index < 3;
          return (
            <div key={step.label} className="text-center">
              <div className={`mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full border ${done ? "border-bite-primary bg-bite-primary" : "border-white/15 bg-white/5"}`}>
                {done ? <ChefHat size={13} /> : <X size={13} className="text-white/35" />}
              </div>
              <p className="text-[11px] font-semibold leading-tight text-white/58">{step.label}</p>
              <p className="mt-1 text-[10px] leading-tight text-white/35">{step.time}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MockOrderTracker({ order }) {
  const stages = ["Order Placed", "Restaurant Confirmed", "Kitchen Preparing", order.status === "Ready for Collection" ? "Ready for Collection" : "Out for Delivery"];
  const currentIndex = stages.indexOf(order.status);
  const dispatched = order.status === "Out for Delivery";
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-[#0C0F14]/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-bite-primary">Simulated tracking · Mock order {order.id}</p>
      <h3 className="mt-2 font-bold">{order.restaurant}</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-white/[0.055] p-3"><p className="text-white/42">Current mock status</p><p className="mt-1 font-bold">{order.status}</p></div>
        <div className="rounded-xl bg-white/[0.055] p-3"><p className="text-white/42">Mock estimated arrival</p><p className="mt-1 font-bold">{order.estimatedArrival || "Not available"}</p></div>
        <div className="col-span-2 rounded-xl bg-white/[0.055] p-3"><p className="text-white/42">Last mock update</p><p className="mt-1 font-bold">{order.lastUpdate || "Not available"}</p></div>
      </div>
      {Array.isArray(order.items) && order.items.length > 0 && (
        <div className="mt-4 rounded-xl bg-white/[0.055] p-3 text-xs">
          <p className="text-white/42">Order items</p>
          <div className="mt-2 space-y-1 font-bold text-white">
            {order.items.map((item, index) => <p key={`${item.name}-${index}`}>{item.quantity} × {item.name}</p>)}
          </div>
        </div>
      )}
      <div className="mt-4 space-y-2">{stages.slice(0, Math.max(0, currentIndex) + 1).map((stage) => <div key={stage} className="flex items-center gap-2 text-xs"><CheckCircle2 size={14} className="text-emerald-300"/><span>{stage}</span></div>)}</div>
      {dispatched ? <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/5 p-3 text-xs text-white/60"><b className="text-amber-200">Simulated courier details</b><p className="mt-1">Courier profile, location and timing are mock data—not live or real-time. No real chat connection is available.</p></div> : <p className="mt-4 rounded-xl bg-white/5 p-3 text-xs text-white/55">Courier details are unavailable until dispatch. This does not represent a live courier location or connection.</p>}
      <p className="mt-3 text-[11px] text-white/38">This is simulated tracking based on mock order data.</p>
    </div>
  );
}

export default App;
