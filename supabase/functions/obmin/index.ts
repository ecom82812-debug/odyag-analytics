// =====================================================================
// obmin — обміни й повернення
//   Форма менеджерів (секретне посилання, без входу):  x-form-token = private_config.obmin_token
//     { action: "lookup", phone }        — останні замовлення клієнта з CRM
//     { action: "create", ...поля }      — новий обмін/повернення → повідомлення в Telegram
//     { action: "list", q }              — пошук обмінів (телефон / ТТН / прізвище)
//   Дашборд власника (вхід у дашборд):
//     { action: "set_status", id, status, new_ttn? } — статус, витрати, оновлення повідомлення в Telegram
//     { action: "tg_find" } / { action: "tg_set", chat_id, thread_id }
//   Автозапуск (x-cron-secret): { action: "track" } — статуси ТТН Нової пошти
// Секрети лежать у таблиці private_config (tg_bot_token, np_api_key, obmin_token, cron_secret).
// =====================================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-form-token, x-cron-secret",
  "Content-Type": "application/json",
}
const STATUS: Record<string, string> = {
  new: "🆕 Нова", sent: "📤 Надіслано постачальнику", accepted: "✅ Постачальник прийняв",
  shipped: "🚚 Обмін відправлено", refunded: "💸 Кошти повернено", closed: "✔️ Закрито", cancelled: "✖️ Скасовано",
}
const digits = (s: unknown) => String(s ?? "").replace(/\D/g, "")
const esc = (s: unknown) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!))
const num = (v: unknown) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : 0 }
const clean = (v: unknown, max = 500) => { const s = String(v ?? "").trim(); return s ? s.slice(0, max) : null }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: cors })
  const { data: cfgRows } = await sb.from("private_config").select("key, value")
  const cfg: Record<string, string> = Object.fromEntries((cfgRows || []).map((r: any) => [r.key, r.value]))
  let body: any = {}
  try { body = await req.json() } catch { /* */ }
  const action = String(body.action || "")

  // ---------- хто викликає ----------
  const isCron = !!cfg.cron_secret && req.headers.get("x-cron-secret") === cfg.cron_secret
  const isForm = !!cfg.obmin_token && req.headers.get("x-form-token") === cfg.obmin_token
  let userEmail: string | null = null
  if (!isCron && !isForm) {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "")
    const { data } = token ? await sb.auth.getUser(token) : { data: null } as any
    userEmail = data?.user?.email || null
  }
  const isUser = !!userEmail
  if (!isCron && !isForm && !isUser) return json({ error: "Немає доступу" }, 401)

  // ---------- Telegram ----------
  const tg = async (method: string, payload: unknown) => {
    if (!cfg.tg_bot_token) return null
    const r = await fetch(`https://api.telegram.org/bot${cfg.tg_bot_token}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    return await r.json().catch(() => null)
  }
  const { data: setRows } = await sb.from("settings").select("key, value").in("key", ["obmin_tg_chat", "obmin_tg_thread"])
  const setv: Record<string, any> = Object.fromEntries((setRows || []).map((r: any) => [r.key, r.value]))
  const stores: Record<number, string> = {}
  for (const s of (await sb.from("stores").select("id, name")).data || []) stores[s.id] = s.name

  const npLine = (label: string, ttn: string | null, st: string | null) => ttn ? `${label}: <code>${esc(ttn)}</code>${st ? ` — <i>${esc(st)}</i>` : ""}` : null
  function message(x: any) {
    const lines = [
      `<b>${x.kind === "refund" ? "💸 ПОВЕРНЕННЯ КОШТІВ" : "🔁 ОБМІН"} №${x.id}</b>  ·  ${STATUS[x.status] || x.status}`,
      "",
      `👤 ${esc(x.client_name || "—")}  ·  <code>${esc(x.phone || "")}</code>${x.store_id ? `  ·  ${esc(stores[x.store_id] || "")}` : ""}`,
      x.order_id ? `Замовлення: #${x.order_id}${x.order_ttn ? `  ТТН <code>${esc(x.order_ttn)}</code>` : ""}` : null,
      x.items ? `Товар: ${esc(x.items)}` : null,
      npLine("↩️ ТТН повернення", x.ret_ttn, x.np_status),
      x.kind === "refund"
        ? `💳 Повернути: ${num(x.refund_amount) ? `<b>${num(x.refund_amount)} ₴</b>` : "суму уточнити"}${x.card ? `  ·  карта <code>${esc(x.card)}</code>` : ""}`
        : `🔄 Обмін на: <b>${esc(x.new_item || "—")}</b>`,
      x.reason ? `Причина: ${esc(x.reason)}` : null,
      x.delivery_paid ? `🚚 Доставку оплатила${num(x.delivery_refund) ? `, повернути <b>${num(x.delivery_refund)} ₴</b>` : ""}` : null,
      npLine("📦 ТТН обміну", x.new_ttn, x.np_new_status),
      x.comment ? `💬 ${esc(x.comment)}` : null,
      `Менеджер: ${esc(x.manager || "—")}`,
    ]
    return lines.filter((l) => l !== null).join("\n")
  }
  async function postOrEdit(x: any) {
    const chat = x.tg_chat || (setv.obmin_tg_chat != null ? String(setv.obmin_tg_chat) : null)
    if (!chat || !cfg.tg_bot_token) return
    const text = message(x)
    if (x.tg_msg_id && x.tg_chat) {
      await tg("editMessageText", { chat_id: x.tg_chat, message_id: x.tg_msg_id, text, parse_mode: "HTML", disable_web_page_preview: true })
    } else {
      const payload: any = { chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }
      if (setv.obmin_tg_thread) payload.message_thread_id = Number(setv.obmin_tg_thread)
      const r = await tg("sendMessage", payload)
      if (r?.ok) await sb.from("exchanges").update({ tg_chat: chat, tg_msg_id: r.result.message_id }).eq("id", x.id)
    }
  }

  // ---------- Нова пошта ----------
  async function npStatuses(ttns: string[]) {
    const out: Record<string, { status: string; code: string }> = {}
    const list = [...new Set(ttns.filter(Boolean))]
    for (let i = 0; i < list.length; i += 90) {
      const r = await fetch("https://api.novaposhta.ua/v2.0/json/", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: cfg.np_api_key, modelName: "TrackingDocument", calledMethod: "getStatusDocuments",
          methodProperties: { Documents: list.slice(i, i + 90).map((n) => ({ DocumentNumber: n, Phone: "" })) } }) })
      const j = await r.json().catch(() => null)
      for (const d of j?.data || []) out[String(d.Number)] = { status: String(d.Status || ""), code: String(d.StatusCode || "") }
    }
    return out
  }

  try {
    // ================= ФОРМА МЕНЕДЖЕРІВ =================
    if (action === "lookup" && (isForm || isUser)) {
      const p = digits(body.phone).slice(-9)
      if (p.length < 9) return json({ orders: [] })
      const { data } = await sb.from("orders").select("id, order_time, sajt, client_name, client_phone, ttn, payment_amount, status_id, items_text, manager_id")
        .like("client_phone", `%${p}`).order("order_time", { ascending: false }).limit(6)
      const st: Record<number, string> = {}
      for (const s of (await sb.from("statuses").select("id, name")).data || []) st[s.id] = s.name
      const mg: Record<number, string> = {}
      for (const m of (await sb.from("managers").select("id, name")).data || []) mg[m.id] = m.name
      const ids = (data || []).map((o: any) => o.id)
      const { data: items } = ids.length ? await sb.from("order_items").select("order_id, name, sku, descr, price, cost_price, amount").in("order_id", ids) : { data: [] } as any
      return json({ orders: (data || []).map((o: any) => ({ ...o, store: stores[o.sajt] || null, status: st[o.status_id] || null, manager: mg[o.manager_id] || null,
        items: (items || []).filter((i: any) => i.order_id === o.id) })) })
    }
    if (action === "create" && (isForm || isUser)) {
      const phone = digits(body.phone)
      if (phone.length < 9) return json({ error: "Вкажіть телефон клієнта" }, 400)
      if (!clean(body.ret_ttn, 40)) return json({ error: "Вкажіть ТТН повернення" }, 400)
      const kind = body.kind === "refund" ? "refund" : "exchange"
      if (kind === "exchange" && !clean(body.new_item)) return json({ error: "Вкажіть, на що обмін" }, 400)
      const row = {
        manager: clean(body.manager, 60), phone, order_id: Number(body.order_id) || null, client_name: clean(body.client_name, 120),
        store_id: Number(body.store_id) || null, order_ttn: clean(digits(body.order_ttn), 40), items: clean(body.items, 600), cost_price: num(body.cost_price) || null,
        kind, new_item: clean(body.new_item), reason: clean(body.reason), card: clean(body.card, 40), refund_amount: num(body.refund_amount),
        ret_ttn: clean(digits(body.ret_ttn), 40), delivery_paid: !!body.delivery_paid, delivery_refund: num(body.delivery_refund), comment: clean(body.comment, 1000),
        history: [{ at: new Date().toISOString(), status: "new", by: clean(body.manager, 60) || "форма" }],
      }
      const { data: x, error } = await sb.from("exchanges").insert(row).select().single()
      if (error) throw error
      const np = cfg.np_api_key ? await npStatuses([x.ret_ttn]) : {}
      if (np[x.ret_ttn]) { x.np_status = np[x.ret_ttn].status; x.np_code = np[x.ret_ttn].code; await sb.from("exchanges").update({ np_status: x.np_status, np_code: x.np_code, np_checked_at: new Date().toISOString() }).eq("id", x.id) }
      await postOrEdit(x)
      return json({ ok: true, id: x.id })
    }
    if (action === "list" && (isForm || isUser)) {
      const q = String(body.q || "").trim()
      let query = sb.from("exchanges").select("id, created_at, manager, phone, order_id, client_name, store_id, items, kind, new_item, reason, refund_amount, ret_ttn, np_status, delivery_paid, delivery_refund, comment, status, new_ttn, np_new_status")
        .order("created_at", { ascending: false }).limit(60)
      const d = digits(q)
      if (d.length >= 9) query = query.or(`phone.like.%${d.slice(-9)},ret_ttn.eq.${d},new_ttn.eq.${d},order_ttn.eq.${d}`)
      else if (q) query = query.ilike("client_name", `%${q.replace(/[%,()]/g, "")}%`)
      const { data } = await query
      return json({ list: (data || []).map((x: any) => ({ ...x, store: stores[x.store_id] || null, status_label: STATUS[x.status] || x.status })) })
    }

    // ================= ДАШБОРД ВЛАСНИКА =================
    if (action === "set_status" && isUser) {
      const { data: x } = await sb.from("exchanges").select("*").eq("id", Number(body.id)).single()
      if (!x) return json({ error: "Не знайдено" }, 404)
      const status = String(body.status)
      if (!STATUS[status]) return json({ error: "Невідомий статус" }, 400)
      const patch: any = { status, updated_at: new Date().toISOString(), history: [...(x.history || []), { at: new Date().toISOString(), status, by: userEmail }] }
      if (body.new_ttn !== undefined) patch.new_ttn = clean(digits(body.new_ttn), 40)
      if (body.refund_amount !== undefined) patch.refund_amount = num(body.refund_amount)
      // Витрати магазину: повернення коштів і доставка
      const today = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)
      const exp: any[] = []
      const refund = body.refund_amount !== undefined ? num(body.refund_amount) : num(x.refund_amount)
      if (status === "refunded" && !x.expense_ids?.length) {
        if (refund) exp.push({ date: today, category: "Повернення коштів", amount: refund, currency: "UAH", rate: 1, comment: `Повернення №${x.id}: ${x.client_name || x.phone}`, store_id: x.store_id, created_by: userEmail })
        if (num(x.delivery_refund)) exp.push({ date: today, category: "Доставка обмінів", amount: num(x.delivery_refund), currency: "UAH", rate: 1, comment: `Доставка, повернення №${x.id}: ${x.client_name || x.phone}`, store_id: x.store_id, created_by: userEmail })
      }
      if (status === "shipped" && !x.expense_ids?.length && num(x.delivery_refund)) {
        exp.push({ date: today, category: "Доставка обмінів", amount: num(x.delivery_refund), currency: "UAH", rate: 1, comment: `Доставка, обмін №${x.id}: ${x.client_name || x.phone}`, store_id: x.store_id, created_by: userEmail })
      }
      if (exp.length) { const { data: ins, error } = await sb.from("expenses").insert(exp).select("id"); if (error) throw error; patch.expense_ids = (ins || []).map((r: any) => r.id) }
      if (status === "cancelled" && x.expense_ids?.length) { await sb.from("expenses").delete().in("id", x.expense_ids); patch.expense_ids = [] }
      if (patch.new_ttn && cfg.np_api_key) { const np = await npStatuses([patch.new_ttn]); if (np[patch.new_ttn]) patch.np_new_status = np[patch.new_ttn].status }
      const { data: y, error } = await sb.from("exchanges").update(patch).eq("id", x.id).select().single()
      if (error) throw error
      await postOrEdit(y)
      return json({ ok: true, exchange: y })
    }
    if (action === "resend" && isUser) {
      const { data: x } = await sb.from("exchanges").select("*").eq("id", Number(body.id)).single()
      if (x) await postOrEdit({ ...x, tg_msg_id: null, tg_chat: null })
      return json({ ok: true })
    }
    if (action === "tg_find" && isUser) {
      const r = await tg("getUpdates", { allowed_updates: ["message", "my_chat_member"] })
      const chats: Record<string, any> = {}
      for (const u of r?.result || []) {
        const m = u.message || u.my_chat_member
        const c = m?.chat
        if (!c || c.type === "private") continue
        const k = String(c.id)
        chats[k] = chats[k] || { id: k, title: c.title, threads: {} }
        if (u.message?.message_thread_id) chats[k].threads[u.message.message_thread_id] = u.message?.reply_to_message?.forum_topic_created?.name || `тема ${u.message.message_thread_id}`
      }
      return json({ chats: Object.values(chats), current: { chat: setv.obmin_tg_chat ?? null, thread: setv.obmin_tg_thread ?? null } })
    }
    if (action === "tg_set" && isUser) {
      await sb.from("settings").upsert([{ key: "obmin_tg_chat", value: String(body.chat_id || "") || null }, { key: "obmin_tg_thread", value: body.thread_id ? Number(body.thread_id) : null }])
      const r = await tg("sendMessage", { chat_id: String(body.chat_id), ...(body.thread_id ? { message_thread_id: Number(body.thread_id) } : {}), text: "✅ Бот обмінів підключено. Сюди приходитимуть нові обміни й повернення." })
      return json({ ok: !!r?.ok, error: r?.ok ? null : r?.description })
    }
    if (action === "form_link" && isUser) return json({ token: cfg.obmin_token })

    // ================= АВТОЗАПУСК: статуси ТТН =================
    if (action === "track" && (isCron || isUser)) {
      const { data } = await sb.from("exchanges").select("*").not("status", "in", "(closed,cancelled)").gte("created_at", new Date(Date.now() - 60 * 86400e3).toISOString())
      const list = data || []
      const np = await npStatuses(list.flatMap((x: any) => [x.ret_ttn, x.new_ttn]))
      let changed = 0
      for (const x of list) {
        const a = x.ret_ttn ? np[x.ret_ttn] : null, b = x.new_ttn ? np[x.new_ttn] : null
        const patch: any = { np_checked_at: new Date().toISOString() }
        if (a && a.status !== x.np_status) { patch.np_status = a.status; patch.np_code = a.code }
        if (b && b.status !== x.np_new_status) patch.np_new_status = b.status
        await sb.from("exchanges").update(patch).eq("id", x.id)
        if (patch.np_status !== undefined || patch.np_new_status !== undefined) { changed++; await postOrEdit({ ...x, ...patch }) }
      }
      return json({ ok: true, checked: list.length, changed })
    }
    return json({ error: "Невідома дія" }, 400)
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 500)
  }
})
