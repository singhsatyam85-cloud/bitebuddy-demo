import React, { useState } from "react";
import { CheckCircle2, Headphones, RotateCcw, Settings2, ShoppingBag, X } from "lucide-react";
import { customizationOptions, itemCategory } from "./stage2.js";

const fieldClass = "h-10 w-full rounded-xl border border-white/10 bg-[#0C0F14] px-3 text-sm outline-none focus:border-orange-500";

export function PreferencesPanel({ profile, onSave, onReset, onClose }) {
  const [draft, setDraft] = useState({ ...profile, allergies: profile.allergies.join(", "), favouriteCuisines: profile.favouriteCuisines.join(", ") });
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  return <Modal title="Your mock preferences" onClose={onClose}>
    <p className="mb-4 text-xs text-amber-200/65">Preferences improve suggestions but do not guarantee allergy safety. Severe allergies require restaurant confirmation.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Preferred diet"><select className={fieldClass} value={draft.preferredDiet} onChange={(e) => update("preferredDiet", e.target.value)}><option>None</option><option>Vegetarian</option><option>Vegan</option><option>Gluten-Free</option><option>Keto</option></select></Field>
      <Field label="Spice preference"><select className={fieldClass} value={draft.spicePreference} onChange={(e) => update("spicePreference", e.target.value)}><option>Mild</option><option>Medium</option><option>Hot</option></select></Field>
      <Field label="Allergies (comma separated)"><input className={fieldClass} value={draft.allergies} onChange={(e) => update("allergies", e.target.value)} /></Field>
      <Field label="Favourite cuisines"><input className={fieldClass} value={draft.favouriteCuisines} onChange={(e) => update("favouriteCuisines", e.target.value)} /></Field>
      <Field label="Budget minimum"><input type="number" className={fieldClass} value={draft.budgetMin} onChange={(e) => update("budgetMin", Number(e.target.value))} /></Field>
      <Field label="Budget maximum"><input type="number" className={fieldClass} value={draft.budgetMax} onChange={(e) => update("budgetMax", Number(e.target.value))} /></Field>
    </div>
    <Field label="Delivery instructions"><textarea className={`${fieldClass} mt-3 h-20 py-2`} value={draft.deliveryInstructions} onChange={(e) => update("deliveryInstructions", e.target.value)} /></Field>
    <div className="mt-5 flex gap-2"><button onClick={() => onSave({ ...draft, allergies: draft.allergies.split(",").map((v) => v.trim()).filter(Boolean), favouriteCuisines: draft.favouriteCuisines.split(",").map((v) => v.trim()).filter(Boolean) })} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 font-bold"><CheckCircle2 size={16}/>Save profile</button><button onClick={onReset} className="rounded-xl border border-white/10 px-4 text-sm font-bold"><RotateCcw size={16}/></button></div>
  </Modal>;
}

export function CustomisationPanel({ item, onConfirm, onClose }) {
  const options = customizationOptions[itemCategory(item)];
  const [selected, setSelected] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const toggle = (option) => setSelected((current) => {
    if (current.some((value) => value.label === option.label)) return current.filter((value) => value.label !== option.label);
    const withoutExclusiveAlternative = option.group ? current.filter((value) => value.group !== option.group) : current;
    return [...withoutExclusiveAlternative, option];
  });
  const extra = selected.reduce((sum, option) => sum + option.price, 0);
  return <Modal title={`Customise ${item.name}`} onClose={onClose}>
    <p className="mb-3 text-sm text-white/55">Only options compatible with this food category are shown.</p>
    <div className="grid gap-2 sm:grid-cols-2">{options.map((option) => <button key={option.label} onClick={() => toggle(option)} className={`rounded-xl border p-3 text-left text-sm ${selected.some((v) => v.label === option.label) ? "border-orange-500 bg-orange-500/15" : "border-white/10 bg-white/5"}`}><span className="font-bold">{option.label}</span><span className="float-right text-orange-300">{option.price ? `+£${option.price.toFixed(2)}` : "Included"}</span></button>)}</div>
    <div className="mt-4 flex items-center justify-between rounded-xl bg-white/5 p-3"><span className="font-bold">Quantity</span><input aria-label="Quantity" type="number" min="1" max="10" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className="w-20 rounded-lg bg-black/30 p-2 text-center" /></div>
    <button onClick={() => onConfirm({ ...item, customizations: selected.map((v) => v.label), customizationPrice: extra, quantity })} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 font-bold">Confirm {quantity} for £{((item.price + extra) * quantity).toFixed(2)} <ShoppingBag size={17}/></button>
  </Modal>;
}

export function OrderHistoryCards({ orders, menuItems, onConfirm }) {
  const [expanded, setExpanded] = useState(null);
  return <div className="mt-3 space-y-3">{orders.map((order) => <article key={order.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
    <div className="flex justify-between gap-2"><div><p className="font-bold">{order.restaurant}</p><p className="text-xs text-white/45">Mock order {order.id} · {order.date} · {order.status}</p></div><span className="text-sm font-bold text-orange-300">£{order.total.toFixed(2)}</span></div>
    {expanded === order.id && <div className="mt-3 space-y-2">{order.items.map((old) => { const current = menuItems.find((item) => item.id === old.itemId); return <div key={old.itemId} className="rounded-xl bg-white/5 p-2 text-xs"><b>{old.quantity}x {old.name}</b><p className="text-white/48">Previous: £{old.price.toFixed(2)} {old.customizations.length ? `· ${old.customizations.join(", ")}` : ""}</p><p className={current ? "text-emerald-300" : "text-red-300"}>{current ? `Available now: £${current.price.toFixed(2)}${current.price !== old.price ? " · Price changed" : ""}` : "Item unavailable"}</p></div>; })}</div>}
    <div className="mt-3 flex gap-2"><button onClick={() => setExpanded(expanded === order.id ? null : order.id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">{expanded === order.id ? "Hide details" : "View full order"}</button><button onClick={() => onConfirm(order)} className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold">Review reorder</button></div>
  </article>)}</div>;
}

export function SupportQueue({ tickets, onStatus, onClose }) {
  return <Modal title="Prototype support view" onClose={onClose} wide><p className="mb-4 text-xs text-white/45">Local simulated tickets. No real authentication or external support service.</p><div className="space-y-3">{tickets.length ? tickets.map((ticket) => <article key={ticket.reference} className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3 sm:grid-cols-[1fr_auto]"><div><p className="font-bold">{ticket.reference} · {ticket.category}</p><p className="text-xs text-white/45">Order {ticket.orderNumber} · {ticket.priority} · {ticket.createdAt}</p></div><select value={ticket.status} onChange={(e) => onStatus(ticket.reference, e.target.value)} className={fieldClass}><option>New</option><option>In Review</option><option>Resolved</option></select></article>) : <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/45">No simulated support tickets yet.</p>}</div></Modal>;
}

function Field({ label, children }) { return <label className="block text-xs font-bold text-white/60"><span className="mb-1.5 block">{label}</span>{children}</label>; }
function Modal({ title, children, onClose, wide = false }) { return <div className="fixed inset-0 z-[60] grid place-items-end bg-black/70 p-2 backdrop-blur-sm sm:place-items-center"><section className={`max-h-[92vh] w-full overflow-y-auto rounded-[26px] border border-white/10 bg-[#10151D] p-5 shadow-2xl ${wide ? "max-w-3xl" : "max-w-xl"}`}><header className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-xl font-extrabold"><Settings2 size={19} className="text-orange-500"/>{title}</h2><button onClick={onClose} aria-label="Close" className="rounded-xl border border-white/10 p-2"><X size={17}/></button></header>{children}</section></div>; }
