// Basic refs
const yearEl = document.getElementById('year'); 
yearEl.textContent = new Date().getFullYear();

const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if(window.scrollY > 40) header.classList.add('scrolled'); 
  else header.classList.remove('scrolled');
}, {passive:true});

// Section IDs & friendly messages (short & playful tone)
const sectionMessages = {
  'home': 'Hi there! Welcome to my data world 🌍',
  'about': 'Let me tell you about the human behind the data 🤖',
  'projects': 'Here\'s where the magic of analysis happens ✨',
  'dashboards': 'Crunching visuals... complete ✅',
  'courses': 'Always learning something new 📘',
  'resume': 'Plotting career trajectory 📈',
  'contact': 'Let\'s connect and collaborate 💬'
};

const speech = document.getElementById('speech');
const robot = document.getElementById('robot');
const robotWrap = document.getElementById('robotWrap');
const transitionOverlay = document.getElementById('transitionOverlay');
const trail = document.getElementById('robotTrail');

// IntersectionObserver to update speech when section is in view
const sections = document.querySelectorAll('section[id]');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      const id = entry.target.id;
      const msg = sectionMessages[id] || 'Hi — explore around!';
      setSpeech(msg);
    }
  });
}, {threshold: 0.55});
sections.forEach(s => io.observe(s));

function setSpeech(text){
  speech.textContent = text;
  speech.classList.add('visible');
  // hide after a while unless updated
  clearTimeout(speech._timer);
  speech._timer = setTimeout(() => speech.classList.remove('visible'), 5000);
}

// Hover & click: wave + new playful message
robotWrap.addEventListener('mouseenter', () => {
  robot.classList.add('hover-glow');
  robot.classList.add('robot-waving');
  // short message
  setSpeech('Hey! Tap me to see a surprise 👋');
  setTimeout(() => robot.classList.remove('robot-waving'), 900);
});
robotWrap.addEventListener('mouseleave', () => {
  robot.classList.remove('hover-glow');
});
robotWrap.addEventListener('click', () => {
  // wave + random short greeting
  const greets = ['Analyzing smiles... ✔️','You look data-ready 😎','Ready to explore more?'];
  const g = greets[Math.floor(Math.random()*greets.length)];
  robot.classList.add('robot-waving');
  setSpeech(g);
  setTimeout(() => robot.classList.remove('robot-waving'), 900);
});

// Animated counters when stats enter view
const statEls = document.querySelectorAll('.stat .val');
const statWrap = document.querySelector('.stats');
if(statWrap){
  const statObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        statEls.forEach(el => animateCounter(el, el.dataset.target));
        obs.disconnect();
      }
    });
  }, {threshold:0.4});
  statObserver.observe(statWrap);
}

function animateCounter(el, target){
  const to = parseInt(target,10) || 0; 
  let start = null; 
  const dur = 1200;
  function step(ts){
    if(!start) start = ts;
    const p = Math.min(1, (ts - start)/dur);
    el.textContent = Math.floor(easeOutCubic(p)*to);
    if(p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function easeOutCubic(t){ 
  return 1 - Math.pow(1 - t, 3); 
}

// Staggered project reveal
document.querySelectorAll('.project').forEach((p, i) => {
  const delay = Number(p.dataset.delay || 0);
  setTimeout(() => { 
    p.style.opacity = 1; 
    p.style.transform = 'none'; 
  }, delay + 120);
});

// Timeline / items reveal using IntersectionObserver
document.querySelectorAll('.tl-item, .dash-frame, .bio, .course-item').forEach(el => {
  el.style.opacity = 0; 
  el.style.transform = 'translateY(12px)';
  const o = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if(e.isIntersecting){ 
        el.style.opacity = 1; 
        el.style.transform = 'none'; 
        obs.unobserve(el); 
      }
    });
  }, {threshold:0.2});
  o.observe(el);
});

// Course expand/collapse
document.querySelectorAll('.course-item').forEach(item => {
  const detail = item.querySelector('.course-detail');
  const arrow = item.querySelector('.arrow');
  let open = false;
  item.addEventListener('click', () => toggle());
  item.addEventListener('keypress', e => { 
    if(e.key === 'Enter' || e.key === ' ') toggle(); 
  });
  
  function toggle(){
    open = !open;
    if(open){ 
      detail.style.maxHeight = (detail.scrollHeight + 24) + 'px'; 
      detail.setAttribute('aria-hidden','false'); 
      arrow.textContent = '▾'; 
    } else { 
      detail.style.maxHeight = '0'; 
      detail.setAttribute('aria-hidden','true'); 
      arrow.textContent = '▸'; 
    }
  }
});

// Page transition + robot flight path
// When clicking nav anchors, show overlay and animate robot flying across
const navLinks = document.querySelectorAll('.navlink');
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').replace('#','');
    // start overlay
    transitionOverlay.classList.add('active');
    // compute robot flight: start at current robotWrap position -> target anchor location (center-top of target section)
    flyRobotToSection(targetId).then(() => {
      // navigate to section
      document.getElementById(targetId).scrollIntoView({behavior:'smooth'});
      // hide overlay after short delay
      setTimeout(() => transitionOverlay.classList.remove('active'), 700);
    });
  });
});

// Helper: get absolute center position of an element
function getCenter(el){
  const r = el.getBoundingClientRect();
  return {
    x: r.left + r.width/2 + window.scrollX, 
    y: r.top + r.height/2 + window.scrollY
  };
}

// animate robot flight by translating the robotWrap with JS (using transform)
let isFlying = false;
async function flyRobotToSection(targetId){
  if(isFlying) return;
  isFlying = true;
  const startRect = robotWrap.getBoundingClientRect();
  const startX = startRect.left + startRect.width/2;
  const startY = startRect.top + startRect.height/2;
  const targetEl = document.getElementById(targetId);
  const targetRect = targetEl.getBoundingClientRect();
  // choose a point near the top-center of the target section
  const destX = targetRect.left + targetRect.width*0.75; // slightly right to show diagonal
  const destY = targetRect.top + 60; // near top of section
  // convert to viewport-relative transforms
  // We'll animate using CSS transform translate on robotWrap
  robotWrap.style.transition = 'transform 900ms cubic-bezier(.22,.9,.26,1), opacity 700ms';
  // show trail
  trail.style.opacity = 1;
  trail.style.transition = 'opacity 400ms';
  // compute delta
  const deltaX = destX - startX;
  const deltaY = destY - startY;
  // add flying class to robot to disable pointer events temporarily
  robot.classList.add('robot-fly'); 
  robot.classList.remove('robot-idle');
  robotWrap.style.zIndex = 3000;
  // apply transform
  robotWrap.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(12deg) scale(1.05)`;
  robotWrap.style.opacity = '0.98';
  robot.classList.add('hover-glow');
  // small wave mid-flight
  setTimeout(() => robot.classList.add('robot-waving'), 200);
  setTimeout(() => robot.classList.remove('robot-waving'), 800);
  // after flight, return robot to original place with a gentle bounce
  await new Promise(res => setTimeout(res, 920));
  // hide trail
  trail.style.opacity = 0;
  // return
  robotWrap.style.transform = `translate(0px, 0px) rotate(0deg) scale(1)`;
  robotWrap.style.transition = 'transform 800ms cubic-bezier(.22,.9,.26,1), opacity 400ms';
  // restore
  setTimeout(() => {
    robot.classList.remove('robot-fly'); 
    robot.classList.add('robot-idle');
    robot.classList.remove('hover-glow');
    robotWrap.style.zIndex = 110;
    isFlying = false;
  }, 820);
}

// Also allow clicking "See projects" button to use same flight behaviour to projects
document.getElementById('seeProjectsBtn').addEventListener('click', () => {
  // trigger same routine
  const targetId = 'projects';
  transitionOverlay.classList.add('active');
  flyRobotToSection(targetId).then(() => {
    document.getElementById(targetId).scrollIntoView({behavior:'smooth'});
    setTimeout(() => transitionOverlay.classList.remove('active'),700);
  });
});

// keyboard focusability: press 'r' to wave robot (nice easter egg)
document.addEventListener('keydown', (e) => {
  if(e.key.toLowerCase() === 'r'){ 
    robot.classList.add('robot-waving'); 
    setSpeech('Robo-wave activated 🤖'); 
    setTimeout(() => robot.classList.remove('robot-waving'),900); 
  }
});

// Small UX: clicking anywhere hides speech
document.addEventListener('click', (ev) => {
  if(!speech.contains(ev.target)) speech.classList.remove('visible');
});

// Respect reduced motion preference
const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
if(mq && mq.matches){
  // disable long transitions
  transitionOverlay.style.display = 'none';
  robot.classList.remove('robot-idle');
}

// Simple contact form demo feedback
const contactForm = document.getElementById('contactForm');
if(contactForm){
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    setTimeout(() => { 
      btn.textContent = 'Sent ✓'; 
      btn.disabled = false; 
      setTimeout(() => btn.textContent = 'Send message',1200); 
    }, 900);
  });
}

// small polish: animate initial speech bubble on load
setTimeout(() => setSpeech(sectionMessages['home']), 700);

// -------------------- Profile Picture Portal + Frame Effect --------------------
const profilePic = document.getElementById("profilePic");
const portalText = document.getElementById("portalText");
const profileContainer = document.getElementById("profileContainer");

if (profilePic && portalText && profileContainer) {
  profilePic.addEventListener("click", () => {
    // Add active glow + spin
    profilePic.classList.add("spin-portal");
    profileContainer.classList.add("active");

    // Show portal text
    setTimeout(() => {
      portalText.classList.add("visible");
    }, 400);

    // Hide and reset after 2.2s
    setTimeout(() => {
      portalText.classList.remove("visible");
      profilePic.classList.remove("spin-portal");
      profileContainer.classList.remove("active");
    }, 2200);

  });
}


// -------------------- Dashboard Fullscreen View --------------------
document.querySelectorAll('.dash-img').forEach(img => {
  img.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.9)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 9999;

    const fullImg = document.createElement('img');
    fullImg.src = img.src;
    fullImg.style.maxWidth = '90%';
    fullImg.style.maxHeight = '90%';
    fullImg.style.borderRadius = '12px';
    fullImg.style.boxShadow = '0 0 20px rgba(255,255,255,0.3)';

    overlay.appendChild(fullImg);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', () => overlay.remove());
  });
});
