import { LATEST_ORDER_REQUEST } from "./deliveryInstructionFlow.js";

const PAYMENT_RELEVANT_STATUSES = new Set([
  "Order Placed",
  "Restaurant Confirmed",
  "Kitchen Preparing",
  "Ready for Collection",
  "Out for Delivery",
  "Cancelled",
  "Cancelled (simulated)",
]);

export function isPaymentFailureRequest(message) {
  return /\bpayment\s+(?:was\s+)?(?:fail(?:ed|ure)?|declin(?:ed|e))\b|\bcard\s+(?:was\s+)?declined\b|\b(?:failed|declined)\s+payment\b/i.test(message);
}

export function validPaymentOrderTimestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return 0;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function recordedPaymentInformation(order) {
  const payment = order?.payment;
  if (!payment || typeof payment !== "object") return null;
  const information = {
    status: typeof payment.status === "string" && payment.status.trim() ? payment.status.trim() : null,
    failureReason: typeof payment.failureReason === "string" && payment.failureReason.trim() ? payment.failureReason.trim() : null,
  };
  return Object.values(information).some((value) => value !== null) ? information : null;
}

export function isPaymentRelevantOrder(order) {
  return Boolean(order && (PAYMENT_RELEVANT_STATUSES.has(order.status) || recordedPaymentInformation(order)));
}

export function preparePaymentFailureStart({ message, orders }) {
  const latestOrderRequested = LATEST_ORDER_REQUEST.test(message.toLowerCase());
  const relevantOrders = orders.filter(isPaymentRelevantOrder);
  if (!latestOrderRequested) return { mode: "select_order", latestOrderRequested, relevantOrders };

  const order = relevantOrders
    .sort((first, second) => validPaymentOrderTimestamp(second.createdAt) - validPaymentOrderTimestamp(first.createdAt))[0] ?? null;
  if (!order) return { mode: "unavailable", latestOrderRequested, relevantOrders, order: null };

  return {
    mode: "display",
    latestOrderRequested,
    relevantOrders,
    order,
    items: (order.items || []).map(({ name, quantity }) => ({ name, quantity })),
    paymentInformation: recordedPaymentInformation(order),
  };
}

export function paymentFailureMessage(order) {
  const payment = recordedPaymentInformation(order);
  const recordedText = payment
    ? ` Recorded mock payment information:${payment.status !== null ? ` status ${payment.status};` : ""}${payment.failureReason !== null ? ` failure reason ${payment.failureReason};` : ""}`.replace(/;$/, ".")
    : " No mock payment-failure reason is recorded for this order.";
  return `Payment review for mock order ${order.id}.${recordedText} BiteBuddy cannot access real bank, card, wallet or payment-provider records. Check the payment details and the bank or wallet's decline or pending status. Check for pending or duplicate charges before retrying. Contact the bank or payment provider for the real reason. Never share a full card number, PIN, CVV, password or one-time code. All payment information shown in this prototype is simulated.`;
}
