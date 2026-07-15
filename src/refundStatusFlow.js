import { LATEST_ORDER_REQUEST } from "./deliveryInstructionFlow.js";

const REFUND_RELEVANT_STATUSES = new Set([
  "Order Placed",
  "Restaurant Confirmed",
  "Kitchen Preparing",
  "Ready for Collection",
  "Out for Delivery",
  "Cancelled",
  "Cancelled (simulated)",
]);

export function isRefundStatusRequest(message) {
  return /\brefund(?:ed|s|ing)?\b/i.test(message);
}

export function isRefundRelevantOrder(order) {
  return Boolean(order && REFUND_RELEVANT_STATUSES.has(order.status));
}

export function validIsoTimestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return 0;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function recordedRefundInformation(order) {
  const refund = order?.refund;
  if (!refund || typeof refund !== "object") return null;
  const information = {
    status: typeof refund.status === "string" && refund.status.trim() ? refund.status.trim() : null,
    amount: typeof refund.amount === "string" || Number.isFinite(refund.amount) ? refund.amount : null,
    date: typeof refund.date === "string" && refund.date.trim() ? refund.date.trim() : null,
  };
  return Object.values(information).some((value) => value !== null) ? information : null;
}

export function latestCancellationActivity(order) {
  return [...(order?.activity || [])].reverse().find((activity) => activity?.type === "Cancellation") || null;
}

export function prepareRefundStatusStart({ message, orders }) {
  const latestOrderRequested = LATEST_ORDER_REQUEST.test(message.toLowerCase());
  const relevantOrders = orders.filter(isRefundRelevantOrder);
  if (!latestOrderRequested) return { mode: "select_order", latestOrderRequested, relevantOrders };

  const order = relevantOrders
    .sort((first, second) => validIsoTimestamp(second.createdAt) - validIsoTimestamp(first.createdAt))[0] ?? null;
  if (!order) return { mode: "unavailable", latestOrderRequested, relevantOrders, order: null };

  return {
    mode: "display",
    latestOrderRequested,
    relevantOrders,
    order,
    items: (order.items || []).map(({ name, quantity }) => ({ name, quantity })),
    cancellationActivity: latestCancellationActivity(order),
    refundInformation: recordedRefundInformation(order),
  };
}

export function refundStatusMessage(order) {
  const cancellationActivity = latestCancellationActivity(order);
  const refund = recordedRefundInformation(order);
  const cancellationText = cancellationActivity
    ? ` Recorded mock cancellation activity: ${cancellationActivity.status || "Cancelled"}${cancellationActivity.createdAt ? ` at ${cancellationActivity.createdAt}` : ""}.`
    : " No mock cancellation activity is recorded for this order.";
  const refundText = refund
    ? ` Recorded mock refund information:${refund.status !== null ? ` status ${refund.status};` : ""}${refund.amount !== null ? ` amount ${refund.amount};` : ""}${refund.date !== null ? ` date ${refund.date};` : ""}`.replace(/;$/, ".")
    : " No mock refund status or refund date is recorded for this order. Cancellation does not guarantee that a refund has been approved. BiteBuddy cannot calculate or promise a refund date.";
  return `Refund-status review for mock order ${order.id}.${cancellationText}${refundText} Payment and refund information in this prototype is simulated.`;
}
