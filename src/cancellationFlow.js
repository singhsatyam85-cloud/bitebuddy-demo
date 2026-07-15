export const CANCELLATION_STAGES = Object.freeze({
  AWAITING_ORDER: "awaiting_order",
  CANCELLATION_REJECTED: "cancellation_rejected",
  AWAITING_CANCELLATION_CONFIRMATION: "awaiting_cancellation_confirmation",
  AWAITING_ESCALATION_CONFIRMATION: "awaiting_escalation_confirmation",
  TICKET_CREATED: "ticket_created",
});

export function cancellationSelectionState(order, rule) {
  if (!order) return { stage: CANCELLATION_STAGES.CANCELLATION_REJECTED, rejectionReason: "unknown_order" };
  if (rule.allowed) return { stage: CANCELLATION_STAGES.AWAITING_CANCELLATION_CONFIRMATION };
  if (["Delivered", "Cancelled", "Cancelled (simulated)"].includes(order.status)) {
    return { stage: CANCELLATION_STAGES.CANCELLATION_REJECTED, rejectionReason: "closed_order" };
  }
  return {
    stage: CANCELLATION_STAGES.AWAITING_ESCALATION_CONFIRMATION,
    previousStage: CANCELLATION_STAGES.CANCELLATION_REJECTED,
    rejectionReason: "self_service_ineligible",
  };
}

export function canCreateCancellationEscalation(flow, currentOrder, rule) {
  return Boolean(
    flow?.type === "support"
    && flow.category === "Cancel order"
    && flow.stage === CANCELLATION_STAGES.AWAITING_ESCALATION_CONFIRMATION
    && flow.previousStage === CANCELLATION_STAGES.CANCELLATION_REJECTED
    && flow.selectedOrderId === currentOrder?.id
    && currentOrder?.status === flow.selectedOrderStatus
    && !rule.allowed
    && !["Delivered", "Cancelled", "Cancelled (simulated)"].includes(currentOrder?.status),
  );
}
