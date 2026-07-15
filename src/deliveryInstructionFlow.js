export const LATEST_ORDER_REQUEST = /\b(?:latest|newest|last|most recent)\s+(?:active\s+)?order\b/;

export function canChangeDeliveryInstructions(order) {
  const isDelivery = !["Pickup", "Collection"].includes(order?.deliveryType);
  return Boolean(order && isDelivery && ["Order Placed", "Restaurant Confirmed", "Kitchen Preparing"].includes(order.status));
}

export function extractProposedDeliveryInstruction(message) {
  const match = message.match(/\bdelivery instructions?\b[\s\S]*?\bto\s*:?\s*([\s\S]+)$/i);
  return match?.[1]?.trim() || "";
}

export function formatDeliveryInstructionForDisplay(instruction) {
  const trimmed = instruction.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function deliveryInstructionConfirmationMessage({ orderReference, existingInstruction, proposedInstruction }) {
  return `Confirm delivery-instruction change. Mock order: ${orderReference}. Existing instruction: ${formatDeliveryInstructionForDisplay(existingInstruction)} Proposed instruction: ${formatDeliveryInstructionForDisplay(proposedInstruction)} The existing instruction remains unchanged until confirmation.`;
}

export function deliveryInstructionCompletionMessage({ orderReference, instruction }) {
  return `Action completed: delivery instructions for mock order ${orderReference} were updated locally to “${formatDeliveryInstructionForDisplay(instruction)}” A mock activity-history entry was recorded.`;
}

export function prepareDeliveryInstructionStart({ orders, selectLatestOrder, proposedInstruction }) {
  const eligibleOrders = orders.filter(canChangeDeliveryInstructions);
  if (!selectLatestOrder) return { mode: "select_order", eligibleOrders };

  const order = eligibleOrders
    .sort((first, second) => (Date.parse(second.createdAt || "") || 0) - (Date.parse(first.createdAt || "") || 0))[0] ?? null;
  if (!order) return { mode: "unavailable", eligibleOrders };

  const pendingInstruction = proposedInstruction.trim();
  return {
    mode: pendingInstruction ? "awaiting_confirmation" : "awaiting_instruction",
    eligibleOrders,
    order,
    existingInstruction: order.instructions || "None",
    pendingInstruction,
  };
}
