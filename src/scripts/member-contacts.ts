import {
  MEMBER_CONTACTS_BLOB_PATH,
  decryptContacts,
  type EncryptedContactsBlob,
  type MemberContactRow,
} from '../utils/member-contacts-crypto';

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

function showResults(rows: MemberContactRow[]): void {
  const form = $('member-contacts-form');
  const results = $('member-contacts-results');
  const tbody = $('member-contacts-tbody');
  const count = $('member-contacts-count');
  if (!(results instanceof HTMLElement) || !(tbody instanceof HTMLElement)) return;

  tbody.replaceChildren();
  const sorted = [...rows].sort((a, b) => {
    const byBusiness = a.business.localeCompare(b.business);
    return byBusiness !== 0 ? byBusiness : a.name.localeCompare(b.name);
  });

  for (const row of sorted) {
    const tr = document.createElement('tr');
    const cells = [row.business, row.name, row.email ?? '', row.phone ?? ''];
    for (const [index, value] of cells.entries()) {
      const td = document.createElement('td');
      td.className = 'px-4 py-3 align-top';
      if (index === 2 && row.email) {
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

  if (count) {
    count.textContent =
      sorted.length === 1 ? '1 contact' : `${String(sorted.length)} contacts`;
  }

  form?.classList.add('hidden');
  results.hidden = false;
  results.classList.remove('hidden');
}

function lockAgain(): void {
  const form = $('member-contacts-form');
  const results = $('member-contacts-results');
  const tbody = $('member-contacts-tbody');
  const password = document.getElementById('member-contacts-password');
  form?.classList.remove('hidden');
  if (results instanceof HTMLElement) {
    results.hidden = true;
    results.classList.add('hidden');
  }
  tbody?.replaceChildren();
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
