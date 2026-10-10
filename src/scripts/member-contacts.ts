import {
  MEMBER_CONTACTS_BLOB_PATH,
  decryptContacts,
  type EncryptedContactsBlob,
  type MemberContactRow,
} from '../utils/member-contacts-crypto';
import {
  PLACE_STATUSES,
  PLACE_STATUS_LABELS,
  type PlaceStatus,
} from '../utils/place-status';

/** Unlocked rows kept in memory for client-side filtering (never in Pagefind). */
let unlockedRows: MemberContactRow[] | null = null;

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function setError(message: string | null): void {
  const el = $('member-contacts-error');
  if (!el) return;
  if (!message) {
    el.textContent = '';
    el.classList.add('hidden');
    return;
  }
  el.textContent = message;
  el.classList.remove('hidden');
}

function rowStatus(row: MemberContactRow): PlaceStatus {
  const status = row.status;
  if (status && (PLACE_STATUSES as readonly string[]).includes(status)) {
    return status;
  }
  return 'live';
}

function sortRows(rows: MemberContactRow[]): MemberContactRow[] {
  return [...rows].sort((a, b) => {
    const byBusiness = a.business.localeCompare(b.business);
    return byBusiness !== 0 ? byBusiness : a.name.localeCompare(b.name);
  });
}

function appendContactRow(tbody: HTMLTableSectionElement, row: MemberContactRow): void {
  const tr = document.createElement('tr');
  const cells = [row.business, row.name, row.email ?? '', row.phone ?? ''];
  for (const [index, value] of cells.entries()) {
    const td = document.createElement('td');
    td.className = 'px-4 py-3 align-top';
    if (index === 0 && row.placeId) {
      const a = document.createElement('a');
      a.href = `/places/${row.placeId}`;
      a.className = 'font-semibold text-rust underline-offset-4 hover:underline';
      a.textContent = row.business;
      td.appendChild(a);
      if (row.successorId && row.successorName) {
        const now = document.createElement('p');
        now.className = 'mt-1 text-xs text-muted';
        now.append('Now ');
        const successorLink = document.createElement('a');
        successorLink.href = `/places/${row.successorId}`;
        successorLink.className = 'font-semibold text-rust underline-offset-4 hover:underline';
        successorLink.textContent = row.successorName;
        now.appendChild(successorLink);
        td.appendChild(now);
      }
    } else if (index === 2 && row.email) {
      const a = document.createElement('a');
      a.href = `mailto:${row.email}`;
      a.className = 'text-rust underline-offset-4 hover:underline';
      a.textContent = row.email;
      td.appendChild(a);
    } else if (index === 3 && row.phone) {
      const a = document.createElement('a');
      a.href = `tel:${row.phone.replace(/[^\d+]/g, '')}`;
      a.className = 'text-rust underline-offset-4 hover:underline';
      a.textContent = row.phone;
      td.appendChild(a);
    } else {
      td.textContent = value;
    }
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
}

function rowMatchesFilter(row: MemberContactRow, query: string): boolean {
  if (!query) return true;
  const hay = [row.business, row.name, row.email ?? '', row.phone ?? '', row.successorName ?? '']
    .join(' ')
    .toLowerCase();
  return hay.includes(query);
}

function buildStatusSection(status: PlaceStatus, rows: MemberContactRow[]): HTMLElement {
  const section = document.createElement('section');

  const heading = document.createElement('div');
  heading.className = 'mb-3 flex flex-wrap items-baseline justify-between gap-2';

  const title = document.createElement('h2');
  title.className = 'font-serif text-2xl font-medium tracking-tight';
  title.textContent = PLACE_STATUS_LABELS[status];

  const meta = document.createElement('p');
  meta.className = 'text-sm text-muted';
  meta.textContent = rows.length === 1 ? '1 contact' : `${String(rows.length)} contacts`;

  heading.append(title, meta);

  const wrap = document.createElement('div');
  wrap.className = 'overflow-x-auto border border-line bg-surface';

  const table = document.createElement('table');
  table.className = 'min-w-full text-left text-sm';

  const thead = document.createElement('thead');
  thead.className = 'border-b border-line bg-paper text-xs uppercase tracking-[0.14em] text-muted';
  const headRow = document.createElement('tr');
  for (const label of ['Business', 'Name', 'Email', 'Phone']) {
    const th = document.createElement('th');
    th.className = 'px-4 py-3 font-semibold';
    th.scope = 'col';
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');
  tbody.className = 'divide-y divide-line';
  for (const row of sortRows(rows)) {
    appendContactRow(tbody, row);
  }

  table.append(thead, tbody);
  wrap.appendChild(table);
  section.append(heading, wrap);
  return section;
}

function filterQuery(): string {
  const input = document.getElementById('member-contacts-filter');
  if (!(input instanceof HTMLInputElement)) return '';
  return input.value.trim().toLowerCase();
}

function renderResults(): void {
  const form = $('member-contacts-form');
  const results = $('member-contacts-results');
  const sections = $('member-contacts-sections');
  const count = $('member-contacts-count');
  if (!(results instanceof HTMLElement) || !(sections instanceof HTMLElement)) return;
  if (!unlockedRows) return;

  const query = filterQuery();
  const rows = unlockedRows.filter((row) => rowMatchesFilter(row, query));

  sections.replaceChildren();

  const byStatus = new Map<PlaceStatus, MemberContactRow[]>();
  for (const status of PLACE_STATUSES) {
    byStatus.set(status, []);
  }
  for (const row of rows) {
    byStatus.get(rowStatus(row))?.push(row);
  }

  let visibleSections = 0;
  for (const status of PLACE_STATUSES) {
    const group = byStatus.get(status) ?? [];
    if (group.length === 0) continue;
    sections.appendChild(buildStatusSection(status, group));
    visibleSections += 1;
  }

  if (rows.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-sm text-muted';
    empty.textContent = query
      ? 'No contacts match that filter.'
      : 'No contacts in the directory.';
    sections.appendChild(empty);
  }

  if (count) {
    const total = unlockedRows.length;
    if (query) {
      count.textContent = `${String(rows.length)} of ${String(total)} contact${total === 1 ? '' : 's'}`;
    } else {
      const parts = [`${String(total)} contact${total === 1 ? '' : 's'}`];
      if (visibleSections > 1) {
        parts.push(`${String(visibleSections)} groups`);
      }
      count.textContent = parts.join(' · ');
    }
  }

  form?.classList.add('hidden');
  results.hidden = false;
  results.classList.remove('hidden');
}

function showResults(rows: MemberContactRow[]): void {
  unlockedRows = rows;
  const filter = document.getElementById('member-contacts-filter');
  if (filter instanceof HTMLInputElement) {
    filter.value = '';
  }
  renderResults();
  filter?.focus();
}

function lockAgain(): void {
  unlockedRows = null;
  const form = $('member-contacts-form');
  const results = $('member-contacts-results');
  const sections = $('member-contacts-sections');
  const password = document.getElementById('member-contacts-password');
  const filter = document.getElementById('member-contacts-filter');
  form?.classList.remove('hidden');
  if (results instanceof HTMLElement) {
    results.hidden = true;
    results.classList.add('hidden');
  }
  sections?.replaceChildren();
  if (filter instanceof HTMLInputElement) {
    filter.value = '';
  }
  if (password instanceof HTMLInputElement) {
    password.value = '';
    password.focus();
  }
  setError(null);
}

function isEncryptedBlob(value: unknown): value is EncryptedContactsBlob {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    record.v === 1 &&
    typeof record.salt === 'string' &&
    typeof record.iv === 'string' &&
    typeof record.ciphertext === 'string'
  );
}

async function onSubmit(event: Event): Promise<void> {
  event.preventDefault();
  setError(null);
  const passwordInput = document.getElementById('member-contacts-password');
  if (!(passwordInput instanceof HTMLInputElement)) return;
  const password = passwordInput.value;
  if (!password) {
    setError('Enter the members password.');
    return;
  }

  let response: Response;
  try {
    response = await fetch(MEMBER_CONTACTS_BLOB_PATH, { cache: 'no-store' });
  } catch {
    setError('Could not load the contact directory.');
    return;
  }

  if (!response.ok) {
    setError('Contact directory has not been published yet.');
    return;
  }

  let blob: unknown;
  try {
    blob = await response.json();
  } catch {
    setError('Contact directory file is invalid.');
    return;
  }

  if (!isEncryptedBlob(blob)) {
    setError('Contact directory file is invalid.');
    return;
  }

  try {
    const rows = await decryptContacts(password, blob);
    showResults(rows);
  } catch {
    setError('Wrong password, or the directory could not be unlocked.');
  }
}

const form = document.getElementById('member-contacts-form');
form?.addEventListener('submit', (event) => {
  void onSubmit(event);
});
document.getElementById('member-contacts-lock')?.addEventListener('click', lockAgain);

const filterInput = document.getElementById('member-contacts-filter');
if (filterInput instanceof HTMLInputElement) {
  filterInput.addEventListener('input', () => {
    if (unlockedRows) renderResults();
  });
}
