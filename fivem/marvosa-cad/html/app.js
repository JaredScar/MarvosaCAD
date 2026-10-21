const statuses = ['available', 'busy', 'enroute', 'onscene', 'offduty'];

const demo = {
  session: { callsign: '1A-12', officerName: 'Jordan Blake', department: 'LSPD', status: 'available' },
  calls: [
    { id: '1', number: 1042, title: 'Vehicle pursuit northbound', location: 'Great Ocean Hwy, Chumash', priority: 1, status: 'enroute', posX: -3196, posY: 1284 },
    { id: '2', number: 1043, title: 'Armed robbery, 24/7', location: 'Strawberry Ave', priority: 1, status: 'onscene', posX: 28, posY: -1348 },
    { id: '3', number: 1046, title: 'Two-car collision, non injury', location: 'Alta St / Power St', priority: 3, status: 'pending' },
  ],
  bolos: [
    { id: 'b1', title: 'Stolen Oracle, felony evading', plate: '84KPL221', risk: 'armed', description: 'Black Ubermacht Oracle. Driver is Diego Navarro.' },
    { id: 'b2', title: 'Marcus Hale, armed and dangerous', risk: 'armed', description: 'Male, 38, grey hoodie. Wanted for armed robbery.' },
  ],
};

function post(name, body) {
  if (window.invokeNative || window.GetParentResourceName) {
    const resource = window.GetParentResourceName ? GetParentResourceName() : 'marvosa-cad';
    return fetch(`https://${resource}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
  }
  return Promise.resolve();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function render(data) {
  const session = data.session || {};
  document.getElementById('identity').textContent = `${session.callsign || 'No call sign'} · ${session.officerName || ''} · ${session.department || ''}`;
  document.getElementById('statuses').innerHTML = statuses
    .map((status) => `<button class="ghost" data-status="${status}" type="button">${status}</button>`)
    .concat('<button class="danger" id="panic" type="button">Panic</button>')
    .join('');
  document.getElementById('calls').innerHTML = (data.calls || [])
    .map(
      (call) => `<article class="card">
        <strong>#${call.number} ${escapeHtml(call.title)}</strong>
        <span class="muted">${escapeHtml(call.location)} · P${call.priority} · ${escapeHtml(call.status)}</span>
        ${call.posX != null ? `<div><button class="ghost" data-x="${call.posX}" data-y="${call.posY}" type="button">Set waypoint</button></div>` : ''}
      </article>`,
    )
    .join('') || '<p class="muted">No active calls.</p>';
  document.getElementById('bolos').innerHTML = (data.bolos || [])
    .map(
      (bolo) => `<article class="card">
        <strong>${escapeHtml(bolo.title)}</strong>
        <span class="tag">${escapeHtml(bolo.risk)}</span>
        ${bolo.plate ? `<span class="tag">${escapeHtml(bolo.plate)}</span>` : ''}
        <p>${escapeHtml(bolo.description)}</p>
      </article>`,
    )
    .join('') || '<p class="muted">No active BOLOs.</p>';
}

function renderPlate(data) {
  const slot = document.getElementById('plate-result');
  if (!data || !data.found || !data.vehicle) {
    slot.innerHTML = `<div class="result">No record for ${escapeHtml(data && data.plate)}.</div>`;
    return;
  }
  const vehicle = data.vehicle;
  const owner = vehicle.owner ? `${vehicle.owner.firstName} ${vehicle.owner.lastName}` : 'No owner';
  const warrants = (vehicle.owner && vehicle.owner.warrants) || [];
  slot.innerHTML = `<div class="result">
    <strong>${escapeHtml(vehicle.plate)} · ${escapeHtml(vehicle.color)} ${escapeHtml(vehicle.model)}</strong>
    <div>Owner: ${escapeHtml(owner)}</div>
    <div>Insurance ${escapeHtml(vehicle.insurance)} · Registration ${escapeHtml(vehicle.registration)}</div>
    ${vehicle.flags ? `<div class="tag">${escapeHtml(vehicle.flags)}</div>` : ''}
    ${warrants.map((warrant) => `<div class="tag">${escapeHtml(warrant.charge)}</div>`).join('')}
  </div>`;
}

function renderPeople(rows) {
  const slot = document.getElementById('person-result');
  const list = Array.isArray(rows) ? rows.slice(0, 5) : [];
  slot.innerHTML = list.length
    ? list
        .map((person) => {
          const warrants = (person.warrants || []).filter((warrant) => warrant.active);
          return `<article class="result"><strong>${escapeHtml(person.lastName)}, ${escapeHtml(person.firstName)}</strong><div class="muted">${escapeHtml(person.dob)} · license ${escapeHtml(person.license)}</div>${warrants.map((warrant) => `<span class="tag">${escapeHtml(warrant.charge)}</span>`).join('')}</article>`;
        })
        .join('')
    : '<p class="muted">No matching people.</p>';
}

document.body.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.id === 'close') {
    document.body.classList.remove('open');
    post('close');
  }
  if (target.id === 'panic') post('panic');
  if (target.dataset.status) post('status', { status: target.dataset.status });
  if (target.dataset.x) post('waypoint', { x: Number(target.dataset.x), y: Number(target.dataset.y) });
});

document.getElementById('plate-form').addEventListener('submit', (event) => {
  event.preventDefault();
  post('plate', { plate: document.getElementById('plate').value.trim() });
});

document.getElementById('person-form').addEventListener('submit', (event) => {
  event.preventDefault();
  post('person', { query: document.getElementById('person').value.trim() });
});

window.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.action === 'open') {
    document.body.classList.add('open');
    render(data.payload || {});
  }
  if (data.action === 'close') document.body.classList.remove('open');
  if (data.action === 'plate') renderPlate(data.payload);
  if (data.action === 'people') renderPeople(data.payload);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.body.classList.remove('open');
    post('close');
  }
});

const params = new URLSearchParams(location.search);
if (params.has('demo')) {
  document.body.classList.add('open');
  render(demo);
  renderPlate({
    found: true,
    plate: '84KPL221',
    vehicle: {
      plate: '84KPL221',
      color: 'Black',
      model: 'Ubermacht Oracle',
      insurance: 'expired',
      registration: 'expired',
      flags: 'Stolen, Felony evading',
      owner: { firstName: 'Diego', lastName: 'Navarro', warrants: [{ charge: 'Grand theft auto' }] },
    },
  });
}
