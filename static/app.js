// Mock data is saved in this browser. No server or database is needed.
const doctors = [
  {id: 1, name: 'Dr Aisha Al Mansoori', speciality: 'General Medicine', description: 'General check-ups and everyday health concerns.'},
  {id: 2, name: 'Dr Khalid Al Mazrouei', speciality: 'Dermatology', description: 'Skin concerns and routine skin checks.'},
  {id: 3, name: 'Dr Mariam Al Nuaimi', speciality: 'Paediatrics', description: 'Appointments for children and young people.'},
  {id: 4, name: 'Dr Ahmed Al Falasi', speciality: 'Family Medicine', description: 'Health advice and care for the whole family.'}
];
const content = document.querySelector('#content');
const page = location.pathname.split('/').pop() || 'index.html';
const params = new URLSearchParams(location.search);
const read = (key) => JSON.parse(localStorage.getItem('clinic_' + key) || '[]');
const save = (key, value) => localStorage.setItem('clinic_' + key, JSON.stringify(value));
const patient = read('patients').find(item => item.id === sessionStorage.getItem('clinic_patient'));
const escape = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function go(url) { location.href = url; }
function message(text, type = 'error') {
  document.querySelector('.notice')?.remove();
  const box = document.createElement('div');
  box.className = 'notice ' + type;
  box.setAttribute('role', 'alert');
  box.textContent = text;
  content.prepend(box);
}
function upcoming(booking) {
  return booking.status === 'booked' && new Date(booking.date + 'T' + booking.time) > new Date();
}
function dates() {
  const result = [];
  for (let i = 1; i <= 14; i++) {
    const day = new Date();
    day.setDate(day.getDate() + i);
    if (day.getDay() !== 0 && day.getDay() !== 6) {
      result.push(`${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`);
    }
  }
  return result;
}
function available(doctorId, date, excludeId) {
  const taken = read('bookings').filter(b => b.doctorId === doctorId && b.date === date && b.status === 'booked' && b.id !== excludeId);
  return ['09:00','10:00','11:00','13:00','14:00','15:00'].filter(time => !taken.some(b => b.time === time));
}
if (page === 'index.html') go(patient ? 'doctors.html' : 'login.html');
else if (!patient && !['login.html','register.html'].includes(page)) go('login.html');
else if (patient && ['login.html','register.html'].includes(page)) go('doctors.html');
else render();

function render() {
  if (patient) {
    document.querySelector('#navigation').innerHTML = `<a href="doctors.html" class="${['doctors.html','booking.html'].includes(page) ? 'active' : ''}">Find a doctor</a><a href="appointments.html" class="${['appointments.html','change.html'].includes(page) ? 'active' : ''}">My appointments</a>`;
    document.querySelector('#user-area').innerHTML = `<span class="greeting">Hi, ${escape(patient.name.split(' ')[0])}</span><button class="text-button" id="logout">Log out</button>`;
    document.querySelector('#logout').onclick = () => { sessionStorage.removeItem('clinic_patient'); go('login.html'); };
  } else document.querySelector('#user-area').textContent = 'Patient booking system';
  if (page === 'login.html' || page === 'register.html') renderAccount();
  if (page === 'doctors.html') renderDoctors();
  if (page === 'appointments.html') renderAppointments();
  if (page === 'booking.html' || page === 'change.html') renderBooking();
  const notice = sessionStorage.getItem('clinic_notice');
  if (notice) { message(notice, 'success'); sessionStorage.removeItem('clinic_notice'); }
}
function renderAccount() {
  const register = page === 'register.html';
  document.title = (register ? 'Create account' : 'Log in') + ' · ClearClinic';
  content.innerHTML = `<div class="auth-layout"><section class="auth-intro"><h1>${register ? 'Register as a patient' : 'Patient appointments'}</h1><p>${register ? 'Create an account to book and manage your appointments.' : 'Log in to book a visit, change an appointment or cancel a booking.'}</p></section><section class="auth-card"><h2>${register ? 'Create your account' : 'Welcome back'}</h2><p class="muted">${register ? 'Just a few details to begin.' : 'Log in to see doctors and manage your bookings.'}</p><form class="form-stack" id="account-form">${register ? '<label for="name">Full name</label><input id="name" name="name" autocomplete="name" maxlength="100" required>' : ''}<label for="email">Email address</label><input id="email" name="email" type="email" autocomplete="email" required><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" ${register ? 'minlength="8"' : ''} required>${register ? '<p class="field-hint">Use at least 8 characters.</p>' : ''}<button class="button primary full">${register ? 'Create account' : 'Log in'}</button></form><p class="form-footer">${register ? 'Already have an account? <a href="login.html">Log in</a>' : 'New to ClearClinic? <a href="register.html">Create an account</a>'}</p></section></div>`;
  document.querySelector('#account-form').onsubmit = event => {
    event.preventDefault();
    const data = new FormData(event.target);
    const email = data.get('email').trim().toLowerCase();
    const password = data.get('password');
    const patients = read('patients');
    if (register) {
      const name = data.get('name').trim();
      if (!name) return message('Enter your full name.');
      if (patients.some(p => p.email === email)) return message('An account already uses this email.');
      patients.push({id: crypto.randomUUID(), name, email, password});
      save('patients', patients);
      sessionStorage.setItem('clinic_notice', 'Your account is ready. Please log in.');
      go('login.html');
    } else {
      const found = patients.find(p => p.email === email && p.password === password);
      if (!found) return message('Email or password is incorrect.');
      sessionStorage.setItem('clinic_patient', found.id);
      go('doctors.html');
    }
  };
}
function renderDoctors() {
  document.title = 'Find a doctor · ClearClinic';
  content.innerHTML = `<section class="page-head"><h1>Find a doctor</h1><p>Choose a doctor below to view available dates and times.</p></section><section class="section-head"><div><h2>Our doctors</h2><p>Choose a doctor to see available appointments.</p></div><span class="count-pill">4 doctors</span></section><div class="doctor-grid">${doctors.map(d => `<article class="doctor-card"><div class="avatar">${d.name.split(' ')[1][0]}</div><div class="doctor-speciality">${d.speciality}</div><h3>${d.name}</h3><p>${d.description}</p><div class="card-bottom"><span class="availability-dot">Appointments available</span><a class="button outline" href="booking.html?doctor=${d.id}">View times</a></div></article>`).join('')}</div><div class="tip-banner"><p><strong>Need to change your plans?</strong> You can change or cancel an upcoming booking from My appointments.</p></div>`;
}
function renderAppointments() {
  document.title = 'My appointments · ClearClinic';
  const bookings = read('bookings').filter(b => b.patientId === patient.id).sort((a,b) => (b.date+b.time).localeCompare(a.date+a.time));
  content.innerHTML = `<div class="page-head"><h1>My appointments</h1><p>See your visits and make changes when plans change.</p></div><div class="section-head"><div><h2>Appointment history</h2><p>Upcoming, past and cancelled appointments.</p></div><a class="button primary" href="doctors.html">+ Book new</a></div>${bookings.length ? `<div class="appointment-list">${bookings.map(b => {
    const doctor = doctors.find(d => d.id === b.doctorId);
    const status = b.status === 'cancelled' ? 'Cancelled' : upcoming(b) ? 'Upcoming' : 'Past';
    return `<article class="appointment-card"><div class="date-badge"><strong>${b.date.slice(8)}</strong><span>${b.date.slice(5,7)}/${b.date.slice(0,4)}</span></div><div class="appointment-detail"><h3>${doctor.name}</h3><p>${b.date} at ${b.time} · In-person</p></div><div class="appointment-actions"><span class="status ${status.toLowerCase()}">${status}</span>${upcoming(b) ? `<div class="action-buttons"><a class="button outline small-button" href="change.html?id=${b.id}">Change</a><button class="button quiet small-button" data-cancel="${b.id}">Cancel</button></div>` : ''}</div></article>`;
  }).join('')}</div>` : '<div class="empty-card"><h2>No appointments yet</h2><p>Your bookings will appear here once you have chosen a doctor and time.</p><a class="button primary" href="doctors.html">Find a doctor</a></div>'}`;
  document.querySelectorAll('[data-cancel]').forEach(button => button.onclick = () => {
    if (!confirm('Cancel this appointment?')) return;
    const all = read('bookings');
    const booking = all.find(b => b.id === button.dataset.cancel && b.patientId === patient.id);
    if (!booking || !upcoming(booking)) return message('This appointment cannot be cancelled.');
    booking.status = 'cancelled'; save('bookings', all); renderAppointments(); message('Appointment cancelled.', 'success');
  });
}
function renderBooking() {
  const changing = page === 'change.html';
  const booking = changing ? read('bookings').find(b => b.id === params.get('id') && b.patientId === patient.id) : null;
  if (changing && (!booking || !upcoming(booking))) { go('appointments.html'); return; }
  const doctor = doctors.find(d => d.id === (changing ? booking.doctorId : Number(params.get('doctor'))));
  if (!doctor) { go('doctors.html'); return; }
  const days = dates();
  let selected = params.get('date') || (booking ? booking.date : days[0]);
  if (!days.includes(selected)) selected = days[0];
  const times = available(doctor.id, selected, booking?.id);
  document.title = (changing ? 'Change appointment' : 'Book appointment') + ' · ClearClinic';
  content.innerHTML = `<a class="back-link" href="${changing ? 'appointments' : 'doctors'}.html">← Back to ${changing ? 'my appointments' : 'doctors'}</a><div class="page-head compact"><h1>${changing ? 'Change appointment' : 'Book an appointment'}</h1><p>${changing ? 'Your current booking stays unchanged until you confirm a new time.' : 'Select a date and time that works for you.'}</p></div><div class="two-column"><section class="main-card"><span class="step-label">STEP 1 OF 2</span><h2>${changing ? 'Choose a new date' : 'Pick a date'}</h2><label class="field-label" for="date">Available dates</label><select id="date">${days.map(day => `<option ${day === selected ? 'selected' : ''}>${day}</option>`).join('')}</select><hr><span class="step-label">STEP 2 OF 2</span><h2>${changing ? 'Choose a new time' : 'Choose a time'}</h2><form id="booking-form"><div class="time-grid">${times.length ? times.map(time => `<label class="time-option"><input type="radio" name="time" value="${time}" required><span>${time}</span></label>`).join('') : '<p class="muted">No times left for this date. Please choose another day.</p>'}</div><button class="button primary full" ${times.length ? '' : 'disabled'}>${changing ? 'Save changes' : 'Confirm appointment'}</button></form></section><aside class="summary-card"><h2>${changing ? 'Current appointment' : 'Your doctor'}</h2><h3>${doctor.name}</h3><p class="muted">${doctor.speciality}</p><hr>${changing ? `<div class="summary-line"><span>Date</span><strong>${booking.date}</strong></div><div class="summary-line"><span>Time</span><strong>${booking.time}</strong></div>` : '<div class="summary-line"><span>Visit type</span><strong>In-person appointment</strong></div><div class="summary-line"><span>Location</span><strong>Main clinic</strong></div>'}<p class="summary-note">${changing ? 'If the new time is unavailable, your original booking will remain in place.' : 'Your booking is only confirmed once you press Confirm appointment.'}</p></aside></div>`;
  document.querySelector('#date').onchange = event => { params.set('date', event.target.value); go(page + '?' + params.toString()); };
  document.querySelector('#booking-form').onsubmit = event => {
    event.preventDefault();
    const time = new FormData(event.target).get('time');
    if (!dates().includes(selected) || !available(doctor.id, selected, booking?.id).includes(time)) return message('That time is no longer available. Please choose another one.');
    const all = read('bookings');
    if (changing) {
      const original = all.find(b => b.id === booking.id && b.patientId === patient.id);
      if (!original || !upcoming(original)) return message('This appointment can no longer be changed.');
      original.date = selected; original.time = time;
    } else all.push({id: crypto.randomUUID(), patientId: patient.id, doctorId: doctor.id, date: selected, time, status: 'booked'});
    save('bookings', all);
    sessionStorage.setItem('clinic_notice', changing ? 'Appointment updated successfully.' : 'Appointment booked successfully.');
    go('appointments.html');
  };
}
