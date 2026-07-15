import { LATEST_ORDER_REQUEST, canChangeDeliveryInstructions } from "./deliveryInstructionFlow.js";

export function extractProposedDeliveryAddress(message) {
  const match = message.match(/\bdelivery address\b[\s\S]*?\bto\s*:\s*([\s\S]+)$/i);
  return match?.[1]?.trim() || "";
}

export function canChangeDeliveryAddress(order) {
  return canChangeDeliveryInstructions(order);
}

export function prepareDeliveryAddressStart({ message, orders }) {
  const latestOrderRequested = LATEST_ORDER_REQUEST.test(message.toLowerCase());
  const proposedAddress = extractProposedDeliveryAddress(message);
  const eligibleOrders = orders.filter(canChangeDeliveryAddress);
  if (!latestOrderRequested) return { mode: "select_order", latestOrderRequested, proposedAddress, eligibleOrders };

  const order = eligibleOrders
    .sort((first, second) => (Date.parse(second.createdAt || "") || 0) - (Date.parse(first.createdAt || "") || 0))[0] ?? null;
  if (!order) return { mode: "unavailable", latestOrderRequested, proposedAddress, eligibleOrders, order: null };

  return {
    mode: proposedAddress ? "awaiting_confirmation" : "awaiting_address",
    latestOrderRequested,
    proposedAddress,
    eligibleOrders,
    order,
    existingAddress: order.addressLabel || "None",
  };
}

export function applyConfirmedDeliveryAddressUpdate(order, proposedAddress, createdAt = new Date().toLocaleString()) {
  const address = proposedAddress.trim();
  const activity = { type: "Delivery address updated", address, createdAt, mock: true };
  return { ...order, addressLabel: address, lastUpdate: createdAt, activity: [...(order.activity || []), activity] };
}
