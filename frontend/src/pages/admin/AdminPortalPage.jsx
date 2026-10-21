import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getAdminConversationMessages,
  getAdminOverview,
  listAdminAudit,
  listAdminConversations,
  listAdminProducts,
  listAdminReports,
  listAdminUsers,
  moderateAdminProduct,
  updateAdminAccountStatus,
  updateAdminMembership,
  updateAdminReport
} from "../../api/adminApi.js";
import { Avatar } from "../../components/common/Avatar.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/formatCurrency.js";

const PAGE_SIZE = 25;

const sectionTitles = {
  overview: ["Overview", "A live view of marketplace activity and issues that need attention."],
  users: ["User management", "Review accounts, apply restrictions, and manage administrator access."],
  products: ["Product catalogue", "Inspect product images and descriptions, then hide unsafe listings."],
  conversations: ["Conversation monitor", "Review marketplace conversations when moderation requires it."],
  reports: ["Safety reports", "Triage user reports, preserve evidence, and record fair outcomes."],
  audit: ["Audit log", "A permanent trail of sensitive administrator actions and reasons."]
};

function formatDate(value, options = {}) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    ...options
  });
}

function humanize(value) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusPill({ value }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    visible: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    resolved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    open: "bg-red-50 text-red-800 ring-red-200",
    suspended: "bg-red-50 text-red-800 ring-red-200",
    hidden: "bg-red-50 text-red-800 ring-red-200",
    frozen: "bg-amber-50 text-amber-900 ring-amber-200",
    reviewing: "bg-amber-50 text-amber-900 ring-amber-200",
    sold_out: "bg-amber-50 text-amber-900 ring-amber-200",
    dismissed: "bg-slate-100 text-slate-700 ring-slate-200",
    archived: "bg-slate-100 text-slate-700 ring-slate-200",
    deleted: "bg-slate-100 text-slate-700 ring-slate-200",
    draft: "bg-blue-50 text-blue-800 ring-blue-200"
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ring-1 ring-inset ${styles[value] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      {humanize(value)}
    </span>
  );
}

function PageHeader({ section }) {
  const [title, description] = sectionTitles[section];
  return (
    <div className="mb-6">
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#4b8263]">Admin centre</p>
      <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#17372a]/60">{description}</p>
    </div>
  );
}

function LoadingCard() {
  return <div className="rounded-3xl border border-[#17372a]/8 bg-white p-10 text-center text-sm text-[#17372a]/50 shadow-sm">Loading admin data…</div>;
}

function ErrorCard({ error }) {
  return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-800" role="alert">{error?.message || "Admin data could not be loaded."}</div>;
}

function EmptyState({ children }) {
  return <div className="rounded-2xl border border-dashed border-[#17372a]/15 p-10 text-center text-sm text-[#17372a]/50">{children}</div>;
}

function Pagination({ offset, total, onChange }) {
  if (total <= PAGE_SIZE) return null;
  const start = offset + 1;
  const end = Math.min(offset + PAGE_SIZE, total);
  return (
    <div className="mt-5 flex items-center justify-between gap-4 text-sm">
      <p className="text-[#17372a]/55">Showing {start}–{end} of {total}</p>
      <div className="flex gap-2">
        <button className="rounded-xl border border-[#17372a]/15 bg-white px-4 py-2 font-bold disabled:opacity-40" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - PAGE_SIZE))} type="button">Previous</button>
        <button className="rounded-xl border border-[#17372a]/15 bg-white px-4 py-2 font-bold disabled:opacity-40" disabled={end >= total} onClick={() => onChange(offset + PAGE_SIZE)} type="button">Next</button>
      </div>
    </div>
  );
}

function FilterBar({ children }) {
  return <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#17372a]/8 bg-white p-4 shadow-sm sm:flex-row sm:items-center">{children}</div>;
}

function SearchInput({ value, onChange, placeholder }) {
  return <input className="form-input min-w-0 flex-1 !py-2.5 text-sm" type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />;
}

function ActionDialog({ action, onClose, onConfirm, pending, error }) {
  const [reason, setReason] = useState("");
  if (!action) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#102d21]/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-action-title">
      <form className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8" onSubmit={(event) => { event.preventDefault(); onConfirm(reason); }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-extrabold uppercase tracking-[.16em] ${action.danger ? "text-red-700" : "text-[#39704f]"}`}>Confirm admin action</p>
            <h2 className="mt-1 font-display text-2xl font-bold" id="admin-action-title">{action.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#17372a]/60">{action.description}</p>
          </div>
          <button className="grid size-9 shrink-0 place-items-center rounded-full bg-[#17372a]/5 text-xl" onClick={onClose} type="button" aria-label="Close">×</button>
        </div>
        <label className="mt-6 block text-sm font-bold">
          Reason
          <textarea className="form-input mt-2 min-h-28 resize-y" maxLength="500" minLength="5" required placeholder="Record a clear reason for the audit log." value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        {error ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700" role="alert">{error.message}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-xl border border-[#17372a]/15 px-4 py-2.5 text-sm font-bold" onClick={onClose} type="button">Cancel</button>
          <button className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${action.danger ? "bg-red-700" : "bg-[#1f6746]"}`} disabled={pending || reason.trim().length < 5} type="submit">{pending ? "Saving…" : action.confirmLabel}</button>
        </div>
      </form>
    </div>
  );
}

function OverviewSection() {
  const query = useQuery({ queryKey: ["admin", "overview"], queryFn: getAdminOverview });
  if (query.isLoading) return <LoadingCard />;
  if (query.isError) return <ErrorCard error={query.error} />;
  const data = query.data.data;
  const metrics = [
    ["Total users", data.metrics.totalUsers, `${data.metrics.newUsers7d} joined this week`],
    ["Products", data.metrics.totalProducts, `${data.metrics.activeProducts} visible now`],
    ["Conversations", data.metrics.conversations, `${data.metrics.newConversations7d} started this week`],
    ["Messages", data.metrics.messages, `${data.metrics.newMessages7d} sent this week`],
    ["Open reports", data.metrics.openReports, "Require moderation review"],
    ["Restricted", data.metrics.restrictedUsers, `${data.metrics.admins} active admins`]
  ];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([label, value, note], index) => (
          <article className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm ${index === 4 && Number(value) > 0 ? "border-red-200 bg-red-50" : "border-[#17372a]/8 bg-white"}`} key={label}>
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#17372a]/45">{label}</p>
            <p className="mt-3 font-display text-4xl font-bold">{Number(value).toLocaleString()}</p>
            <p className="mt-2 text-xs text-[#17372a]/55">{note}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-3xl border border-[#17372a]/8 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">Reports needing attention</h2>
              <p className="mt-1 text-xs text-[#17372a]/50">Newest open and reviewing reports</p>
            </div>
            <StatusPill value={data.metrics.openReports ? "open" : "resolved"} />
          </div>
          <div className="mt-5 divide-y divide-[#17372a]/8">
            {data.recentReports.length ? data.recentReports.map((report) => (
              <div className="py-4 first:pt-0 last:pb-0" key={report.id}>
                <div className="flex flex-wrap items-center gap-2"><StatusPill value={report.status} /><span className="text-xs font-bold text-red-700">{humanize(report.category)}</span></div>
                <p className="mt-2 text-sm font-bold">{report.reportedUser.name} reported by {report.reporter.name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[#17372a]/60">{report.details}</p>
              </div>
            )) : <EmptyState>No unresolved reports. The moderation queue is clear.</EmptyState>}
          </div>
        </section>

        <section className="rounded-3xl border border-[#17372a]/8 bg-[#153e2c] p-5 text-white shadow-sm sm:p-6">
          <h2 className="font-display text-xl font-bold">Platform health</h2>
          <div className="mt-5 space-y-5">
            <HealthBar label="Accounts in good standing" value={Number(data.metrics.activeUsers)} total={Number(data.metrics.totalUsers)} />
            <HealthBar label="Visible catalogue" value={Number(data.metrics.activeProducts)} total={Math.max(Number(data.metrics.totalProducts), 1)} />
            <HealthBar label="Products not hidden" value={Number(data.metrics.totalProducts) - Number(data.metrics.hiddenProducts)} total={Math.max(Number(data.metrics.totalProducts), 1)} />
          </div>
          <div className="mt-7 border-t border-white/10 pt-5">
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-white/50">Recent admin work</p>
            <div className="mt-3 space-y-3">
              {data.recentActions.length ? data.recentActions.slice(0, 4).map((item) => (
                <div key={item.id}>
                  <p className="text-sm font-bold">{humanize(item.action)}{item.targetName ? ` · ${item.targetName}` : ""}</p>
                  <p className="text-xs text-white/50">{item.actorName} · {formatDate(item.createdAt)}</p>
                </div>
              )) : <p className="text-sm text-white/55">No administrator actions yet.</p>}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function HealthBar({ label, value, total }) {
  const percentage = Math.min(100, Math.round((value / Math.max(total, 1)) * 100));
  return (
    <div>
      <div className="flex justify-between gap-4 text-sm"><span className="text-white/75">{label}</span><strong>{percentage}%</strong></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#8bd0a8]" style={{ width: `${percentage}%` }} /></div>
    </div>
  );
}

function UsersSection({ setAction }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [admin, setAdmin] = useState("all");
  const [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: ["admin", "users", search, status, role, admin, offset],
    queryFn: () => listAdminUsers({ search, status, role, admin, limit: PAGE_SIZE, offset })
  });
  const data = query.data?.data;
  return (
    <>
      <FilterBar>
        <SearchInput value={search} onChange={(value) => { setSearch(value); setOffset(0); }} placeholder="Search name, email, or phone" />
        <select className="form-input !w-auto !py-2.5 text-sm" value={status} onChange={(event) => { setStatus(event.target.value); setOffset(0); }}><option value="all">All statuses</option><option value="active">Active</option><option value="frozen">Frozen</option><option value="suspended">Suspended</option></select>
        <select className="form-input !w-auto !py-2.5 text-sm" value={role} onChange={(event) => { setRole(event.target.value); setOffset(0); }}><option value="all">All roles</option><option value="farmer">Farmers</option><option value="buyer">Buyers</option></select>
        <select className="form-input !w-auto !py-2.5 text-sm" value={admin} onChange={(event) => { setAdmin(event.target.value); setOffset(0); }}><option value="all">All access</option><option value="admin">Admins</option><option value="user">Standard users</option></select>
      </FilterBar>
      {query.isLoading ? <LoadingCard /> : query.isError ? <ErrorCard error={query.error} /> : (
        <section className="overflow-hidden rounded-3xl border border-[#17372a]/8 bg-white shadow-sm">
          {data.items.length ? <div className="divide-y divide-[#17372a]/8">{data.items.map((user) => <UserRow key={user.id} user={user} setAction={setAction} />)}</div> : <EmptyState>No users match these filters.</EmptyState>}
        </section>
      )}
      {data ? <Pagination offset={offset} total={Number(data.total)} onChange={setOffset} /> : null}
    </>
  );
}

function UserRow({ user, setAction }) {
  const auth = useAuth();
  const self = auth.user?.id === user.id;
  const statusAction = (nextStatus) => ({
    type: "account-status",
    item: user,
    value: nextStatus,
    title: nextStatus === "active" ? `Restore ${user.fullName}` : `${humanize(nextStatus)} ${user.fullName}`,
    description: nextStatus === "frozen" ? "The user can sign in and review existing information, but cannot send messages or change data." : nextStatus === "suspended" ? "The user will be blocked from signing in and their public listings will be hidden until restored." : "Full account access will be restored.",
    confirmLabel: nextStatus === "active" ? "Restore account" : `${humanize(nextStatus)} account`,
    danger: nextStatus === "suspended"
  });
  return (
    <article className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar className="size-12 shrink-0" name={user.fullName} src={user.avatarUrl} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-bold">{user.fullName}</h2>{user.isAdmin ? <span className="rounded-full bg-[#17372a] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">Admin</span> : null}<StatusPill value={user.accountStatus} /></div>
            <p className="mt-1 truncate text-xs text-[#17372a]/50">{user.email} · {user.phone}</p>
            <p className="mt-1 text-xs text-[#17372a]/50">{humanize(user.role)} · {user.city}, {user.state} · Joined {formatDate(user.createdAt)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-xs sm:flex sm:text-left">
          <StatMini label="Products" value={user.productCount} /><StatMini label="Chats" value={user.conversationCount} /><StatMini label="Reports" value={user.reportCount} />
        </div>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          {user.accountStatus !== "frozen" ? <button className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900 disabled:opacity-40" disabled={self} onClick={() => setAction(statusAction("frozen"))} type="button">Freeze</button> : null}
          {user.accountStatus !== "suspended" ? <button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-40" disabled={self} onClick={() => setAction(statusAction("suspended"))} type="button">Suspend</button> : null}
          {user.accountStatus !== "active" ? <button className="rounded-xl bg-[#1f6746] px-3 py-2 text-xs font-bold text-white" onClick={() => setAction(statusAction("active"))} type="button">Restore</button> : null}
          <button className="rounded-xl border border-[#17372a]/15 bg-[#f6f7f2] px-3 py-2 text-xs font-bold disabled:opacity-40" disabled={self && user.isAdmin} onClick={() => setAction({ type: "membership", item: user, value: !user.isAdmin, title: user.isAdmin ? `Remove ${user.fullName}'s admin access` : `Promote ${user.fullName} to admin`, description: user.isAdmin ? "Their farmer or buyer account will remain available, but the admin portal and tools will be removed." : "They will retain their current marketplace role and gain access to all admin tools and private moderation data.", confirmLabel: user.isAdmin ? "Remove admin access" : "Promote to admin", danger: user.isAdmin })} type="button">{user.isAdmin ? "Remove admin" : "Make admin"}</button>
        </div>
      </div>
      {user.restrictionReason ? <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900"><strong>Restriction reason:</strong> {user.restrictionReason}</p> : null}
    </article>
  );
}

function StatMini({ label, value }) {
  return <div className="min-w-16"><strong className="block text-sm">{Number(value).toLocaleString()}</strong><span className="text-[10px] uppercase tracking-wide text-[#17372a]/45">{label}</span></div>;
}

function ProductsSection({ setAction }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [moderation, setModeration] = useState("all");
  const [offset, setOffset] = useState(0);
  const query = useQuery({ queryKey: ["admin", "products", search, status, moderation, offset], queryFn: () => listAdminProducts({ search, status, moderation, limit: PAGE_SIZE, offset }) });
  const data = query.data?.data;
  return (
    <>
      <FilterBar><SearchInput value={search} onChange={(value) => { setSearch(value); setOffset(0); }} placeholder="Search product, description, or farmer" /><select className="form-input !w-auto !py-2.5 text-sm" value={status} onChange={(event) => { setStatus(event.target.value); setOffset(0); }}><option value="all">All lifecycle states</option><option value="active">Active</option><option value="sold_out">Sold out</option><option value="draft">Draft</option><option value="archived">Archived</option><option value="deleted">Deleted</option></select><select className="form-input !w-auto !py-2.5 text-sm" value={moderation} onChange={(event) => { setModeration(event.target.value); setOffset(0); }}><option value="all">All moderation</option><option value="visible">Not hidden</option><option value="hidden">Admin hidden</option></select></FilterBar>
      {query.isLoading ? <LoadingCard /> : query.isError ? <ErrorCard error={query.error} /> : data.items.length ? (
        <div className="grid gap-4 xl:grid-cols-2">{data.items.map((product) => (
          <article className="overflow-hidden rounded-3xl border border-[#17372a]/8 bg-white shadow-sm" key={product.id}>
            <div className="grid sm:grid-cols-[180px_1fr]">
              {product.images[0] ? <img className="h-48 w-full object-cover sm:h-full" src={product.images[0].url} alt={product.images[0].altText || product.title} /> : <div className="grid h-48 place-items-center bg-[#e9eee6] text-xs font-bold text-[#17372a]/40 sm:h-full">No image</div>}
              <div className="min-w-0 p-5">
                <div className="flex flex-wrap items-center gap-2"><StatusPill value={product.status} />{product.isHidden ? <StatusPill value="hidden" /> : null}</div>
                <h2 className="mt-3 font-display text-xl font-bold">{product.title}</h2>
                <p className="mt-1 text-sm font-bold text-[#286747]">{formatCurrency(product.price)} / {product.unit}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#17372a]/60">{product.description}</p>
                <p className="mt-3 text-xs text-[#17372a]/50">By <strong>{product.owner.name}</strong> · {product.city}, {product.state} · {product.images.length} images · {product.conversationCount} chats</p>
                {product.hiddenReason ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800"><strong>Hidden:</strong> {product.hiddenReason}</p> : null}
                {product.status !== "deleted" ? <button className={`mt-4 rounded-xl px-3 py-2 text-xs font-bold ${product.isHidden ? "bg-[#1f6746] text-white" : "border border-red-200 text-red-700"}`} onClick={() => setAction({ type: "product", item: product, value: !product.isHidden, title: product.isHidden ? `Restore “${product.title}”` : `Hide “${product.title}”`, description: product.isHidden ? "The listing can appear in the public marketplace again if its lifecycle status allows it." : "The listing and its images will immediately disappear from the public marketplace. Conversation history remains intact.", confirmLabel: product.isHidden ? "Restore product" : "Hide product", danger: !product.isHidden })} type="button">{product.isHidden ? "Restore listing" : "Hide listing"}</button> : null}
              </div>
            </div>
          </article>
        ))}</div>
      ) : <EmptyState>No products match these filters.</EmptyState>}
      {data ? <Pagination offset={offset} total={Number(data.total)} onChange={setOffset} /> : null}
    </>
  );
}

function ConversationsSection() {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const query = useQuery({ queryKey: ["admin", "conversations", search, offset], queryFn: () => listAdminConversations({ search, limit: PAGE_SIZE, offset }) });
  const messages = useQuery({ queryKey: ["admin", "conversation", selected], queryFn: () => getAdminConversationMessages(selected), enabled: Boolean(selected) });
  const data = query.data?.data;
  return (
    <>
      <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Privacy notice:</strong> inspect message content only for safety, dispute, or support needs. Conversation access is restricted to active administrators.</div>
      <FilterBar><SearchInput value={search} onChange={(value) => { setSearch(value); setOffset(0); }} placeholder="Search product or participant" /></FilterBar>
      {query.isLoading ? <LoadingCard /> : query.isError ? <ErrorCard error={query.error} /> : (
        <section className="overflow-hidden rounded-3xl border border-[#17372a]/8 bg-white shadow-sm">{data.items.length ? <div className="divide-y divide-[#17372a]/8">{data.items.map((conversation) => (
          <button className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-[#f6f8f3] sm:flex-row sm:items-center" key={conversation.id} onClick={() => setSelected(conversation.id)} type="button">
            <div className="flex -space-x-3"><Avatar className="size-11 ring-2 ring-white" name={conversation.buyer.name} src={conversation.buyer.avatarUrl} /><Avatar className="size-11 ring-2 ring-white" name={conversation.farmer.name} src={conversation.farmer.avatarUrl} /></div>
            <div className="min-w-0 flex-1"><p className="font-bold">{conversation.buyer.name} <span className="font-normal text-[#17372a]/35">↔</span> {conversation.farmer.name}</p><p className="mt-1 truncate text-xs font-bold text-[#39704f]">{conversation.productTitle}</p><p className="mt-1 truncate text-sm text-[#17372a]/55">{conversation.latestMessage?.body || (conversation.latestMessage?.type ? humanize(conversation.latestMessage.type) : "No messages yet")}</p></div>
            <div className="text-left sm:text-right"><p className="text-sm font-bold">{conversation.messageCount} messages</p><p className="mt-1 text-xs text-[#17372a]/45">{formatDate(conversation.lastMessageAt || conversation.createdAt)}</p></div>
          </button>
        ))}</div> : <EmptyState>No conversations match this search.</EmptyState>}</section>
      )}
      {data ? <Pagination offset={offset} total={Number(data.total)} onChange={setOffset} /> : null}
      {selected ? <ConversationDialog query={messages} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

function ConversationDialog({ query, onClose }) {
  const data = query.data?.data;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#102d21]/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Conversation messages">
      <div className="flex h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[85dvh] sm:rounded-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-[#17372a]/8 px-5 py-4">
          <div className="min-w-0"><p className="text-xs font-extrabold uppercase tracking-wider text-[#39704f]">Moderation view</p><h2 className="truncate font-display text-xl font-bold">{data?.conversation.productTitle || "Loading conversation…"}</h2>{data ? <p className="mt-1 text-xs text-[#17372a]/50">{data.conversation.buyer.name} and {data.conversation.farmer.name} · {data.total} messages</p> : null}</div>
          <button className="grid size-10 shrink-0 place-items-center rounded-full bg-[#17372a]/5 text-xl" onClick={onClose} type="button" aria-label="Close">×</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#eeeae1] p-4 sm:p-6">
          {query.isLoading ? <p className="text-center text-sm text-[#17372a]/50">Loading messages…</p> : query.isError ? <ErrorCard error={query.error} /> : data.messages.length ? <div className="space-y-3">{data.messages.map((message) => (
            <article className="max-w-[88%] rounded-2xl bg-white p-3 shadow-sm sm:max-w-[72%]" key={message.id}>
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#39704f]">{message.senderName}</p>
              {message.mediaUrl ? <img className="mb-2 max-h-72 rounded-xl object-contain" src={message.mediaUrl} alt={message.mediaOriginalName || "Shared evidence"} /> : null}
              {message.body ? <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p> : null}
              <time className="mt-2 block text-right text-[10px] text-[#17372a]/40">{formatDate(message.createdAt)}</time>
            </article>
          ))}</div> : <EmptyState>This conversation has no messages.</EmptyState>}
        </div>
      </div>
    </div>
  );
}

function ReportsSection({ setAction }) {
  const [status, setStatus] = useState("all");
  const [offset, setOffset] = useState(0);
  const query = useQuery({ queryKey: ["admin", "reports", status, offset], queryFn: () => listAdminReports({ status, limit: PAGE_SIZE, offset }) });
  const data = query.data?.data;
  const reportAction = (report, value) => ({ type: "report", item: report, value, title: `${humanize(value)} report about ${report.reportedUser.name}`, description: value === "reviewing" ? "Assign this report to yourself and mark it as under active review." : value === "resolved" ? "Close the report as valid and record the outcome or action taken." : "Close the report without enforcement and explain why it was dismissed.", confirmLabel: value === "reviewing" ? "Start review" : value === "resolved" ? "Resolve report" : "Dismiss report", danger: value === "dismissed" });
  return (
    <>
      <FilterBar><select className="form-input !w-auto !py-2.5 text-sm" value={status} onChange={(event) => { setStatus(event.target.value); setOffset(0); }}><option value="all">All reports</option><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select><p className="text-xs text-[#17372a]/45 sm:ml-auto">Reports include only evidence explicitly linked by the reporter.</p></FilterBar>
      {query.isLoading ? <LoadingCard /> : query.isError ? <ErrorCard error={query.error} /> : data.items.length ? <div className="grid gap-4 xl:grid-cols-2">{data.items.map((report) => (
        <article className="rounded-3xl border border-[#17372a]/8 bg-white p-5 shadow-sm sm:p-6" key={report.id}>
          <div className="flex flex-wrap items-center gap-2"><StatusPill value={report.status} /><span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-red-800">{humanize(report.category)}</span><span className="ml-auto text-xs text-[#17372a]/40">{formatDate(report.createdAt)}</span></div>
          <h2 className="mt-4 font-display text-xl font-bold">Report about {report.reportedUser.name}</h2>
          <p className="mt-1 text-xs text-[#17372a]/50">Submitted by {report.reporter.name}{report.productTitle ? ` · ${report.productTitle}` : ""}</p>
          <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#f4f6f1] p-4 text-sm leading-6">{report.details}</p>
          {report.evidence ? <div className="mt-3 rounded-2xl border border-[#17372a]/8 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wide text-[#17372a]/45">Linked message evidence</p>{report.evidenceMediaUrl ? <img className="mt-3 max-h-48 rounded-xl object-contain" src={report.evidenceMediaUrl} alt="Report evidence" /> : null}<p className="mt-2 text-sm">{report.evidence.body || humanize(report.evidence.type)}</p></div> : null}
          {report.resolutionNotes ? <p className="mt-3 text-sm text-[#17372a]/65"><strong>Resolution:</strong> {report.resolutionNotes}</p> : null}
          {!["resolved", "dismissed"].includes(report.status) ? <div className="mt-5 flex flex-wrap gap-2">{report.status === "open" ? <button className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900" onClick={() => setAction(reportAction(report, "reviewing"))} type="button">Review</button> : null}<button className="rounded-xl bg-[#1f6746] px-3 py-2 text-xs font-bold text-white" onClick={() => setAction(reportAction(report, "resolved"))} type="button">Resolve</button><button className="rounded-xl border border-[#17372a]/15 px-3 py-2 text-xs font-bold" onClick={() => setAction(reportAction(report, "dismissed"))} type="button">Dismiss</button></div> : null}
        </article>
      ))}</div> : <EmptyState>No reports match this status.</EmptyState>}
      {data ? <Pagination offset={offset} total={Number(data.total)} onChange={setOffset} /> : null}
    </>
  );
}

function AuditSection() {
  const [offset, setOffset] = useState(0);
  const query = useQuery({ queryKey: ["admin", "audit", offset], queryFn: () => listAdminAudit({ limit: PAGE_SIZE, offset }) });
  const data = query.data?.data;
  return (
    <>
      {query.isLoading ? <LoadingCard /> : query.isError ? <ErrorCard error={query.error} /> : (
        <section className="overflow-hidden rounded-3xl border border-[#17372a]/8 bg-white shadow-sm">{data.items.length ? <div className="divide-y divide-[#17372a]/8">{data.items.map((item) => (
          <article className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_auto]" key={item.id}>
            <div><div className="flex flex-wrap items-center gap-2"><StatusPill value={item.action.includes("suspend") || item.action.includes("hide") ? "suspended" : item.action.includes("freeze") ? "frozen" : "active"} /><h2 className="font-bold">{humanize(item.action)}</h2></div><p className="mt-2 text-sm text-[#17372a]/65">{item.reason}</p><p className="mt-2 text-xs text-[#17372a]/45">By <strong>{item.actor.name}</strong>{item.targetUser ? ` · Target: ${item.targetUser.name}` : ""}</p></div>
            <time className="text-xs text-[#17372a]/45">{formatDate(item.createdAt)}</time>
          </article>
        ))}</div> : <EmptyState>No administrator actions have been recorded.</EmptyState>}</section>
      )}
      {data ? <Pagination offset={offset} total={Number(data.total)} onChange={setOffset} /> : null}
    </>
  );
}

export function AdminPortalPage() {
  const { section: rawSection } = useParams();
  const section = sectionTitles[rawSection] ? rawSection : "overview";
  const queryClient = useQueryClient();
  const [action, setAction] = useState(null);

  const actionMutation = useMutation({
    mutationFn: (reason) => {
      if (action.type === "account-status") return updateAdminAccountStatus(action.item.id, { status: action.value, reason });
      if (action.type === "membership") return updateAdminMembership(action.item.id, { isAdmin: action.value, reason });
      if (action.type === "product") return moderateAdminProduct(action.item.id, { hidden: action.value, reason });
      if (action.type === "report") return updateAdminReport(action.item.id, { status: action.value, resolutionNotes: reason });
      throw new Error("Unknown admin action.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setAction(null);
    }
  });

  const content = useMemo(() => {
    if (section === "overview") return <OverviewSection />;
    if (section === "users") return <UsersSection setAction={setAction} />;
    if (section === "products") return <ProductsSection setAction={setAction} />;
    if (section === "conversations") return <ConversationsSection />;
    if (section === "reports") return <ReportsSection setAction={setAction} />;
    return <AuditSection />;
  }, [section]);

  return (
    <>
      <PageHeader section={section} />
      {content}
      <ActionDialog key={action ? `${action.type}-${action.item.id}-${action.value}` : "closed"} action={action} onClose={() => { actionMutation.reset(); setAction(null); }} onConfirm={(reason) => actionMutation.mutate(reason)} pending={actionMutation.isPending} error={actionMutation.error} />
    </>
  );
}
