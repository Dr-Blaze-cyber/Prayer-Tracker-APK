// =========================================
// Prayer Tracker
// Version 1
// =========================================

let calendarYear;
let calendarMonth;

// =========================================
// Persian Date & Settings
// =========================================

function gregorianToJalali(date) {
  return jalaali.toJalaali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

function jalaliToGregorian(jy, jm, jd) {
  const g = jalaali.toGregorian(jy, jm, jd);

  return new Date(g.gy, g.gm - 1, g.gd);
}

const SETTINGS_KEY = "prayerTrackerSettings";

let settings = {
  challengeDays: 40,
};

function loadSettings() {
  const saved = localStorage.getItem(SETTINGS_KEY);

  if (saved) {
    settings = JSON.parse(saved);
  }
}

function saveSettings() {
  localStorage.setItem(
    SETTINGS_KEY,

    JSON.stringify(settings),
  );
}

function updatePrayerAchievement() {
  const box = document.getElementById("prayerAchievement");

  if (!box) return;

  box.innerHTML = "";

  const names = {
    fajr: "صبح",
    dhuhr: "ظهر",
    asr: "عصر",
    maghrib: "مغرب",
    isha: "عشاء",
  };

  prayers.forEach((prayer) => {
    let done = 0;
    let missed = 0;
    let pending = 0;

    Object.values(database).forEach((day) => {
      const value = day[prayer];

      if (value === 1) done++;
      else if (value === 2) missed++;
      else pending++;
    });

    const total = done + missed + pending;

    const percent = (value) => {
      if (total === 0) return 0;

      return Math.round((value / total) * 100);
    };

    box.innerHTML += `

    <div class="achievementRow">

      <h3>${names[prayer]}</h3>


      <div class="achievementCard done">
        <b>${done}</b>
        <span>خوانده شده</span>
        <small>${percent(done)}%</small>
      </div>


      <div class="achievementCard missed">
        <b>${missed}</b>
        <span>قضا خوانده شده</span>
        <small>${percent(missed)}%</small>
      </div>


      <div class="achievementCard pending">
        <b>${pending}</b>
        <span>نخوانده</span>
        <small>${percent(pending)}%</small>
      </div>


    </div>

    `;
  });
}

// =========================================
// Date Helpers
// =========================================

function formatPersianDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString(
    "fa-IR",

    {
      year: "numeric",

      month: "long",

      day: "numeric",
    },
  );
}

function showModal(text, icon = "✅") {
  document.getElementById("modalText").textContent = text;
  document.getElementById("modalIcon").textContent = icon;

  const confirmBtn = document.getElementById("modalConfirm");
  const cancelBtn = document.getElementById("modalCancel");

  cancelBtn.classList.add("hidden");

  confirmBtn.onclick = () => {
    closeModal();
  };

  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function getSafeDate(dateString) {
  const parts = dateString.split("-");

  return new Date(
    Number(parts[0]),

    Number(parts[1]) - 1,

    Number(parts[2]),
  );
}

function confirmModal(text, callback) {
  document.getElementById("modalText").textContent = text;
  document.getElementById("modalIcon").textContent = "⚠️";

  const confirmBtn = document.getElementById("modalConfirm");
  const cancelBtn = document.getElementById("modalCancel");

  cancelBtn.classList.remove("hidden");

  confirmBtn.onclick = () => {
    closeModal();
    callback();
  };

  cancelBtn.onclick = () => {
    closeModal();
  };

  document.getElementById("modal").classList.remove("hidden");
}

function getDateString(date) {
  let y = date.getFullYear();

  let m = String(date.getMonth() + 1).padStart(2, "0");

  let d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

// =========================================
// Fixed Day Navigation
// =========================================

function changeDate(days) {
  const date = getSafeDate(currentDate);
  date.setDate(date.getDate() + days);

  const newDate = getDateString(date);

  const firstDay = Object.keys(database).sort()[0];

  if (firstDay && newDate < firstDay) {
    return;
  }

  // جلوگیری از رفتن بعد از پایان
  const startDate = firstDay ? getSafeDate(firstDay) : getSafeDate(currentDate);

  const maxDate = new Date(startDate);
  maxDate.setDate(maxDate.getDate() + settings.challengeDays - 1);

  if (date > maxDate) {
    return;
  }

  currentDate = newDate;
  render();
}

// =========================================
// Persian Date Render
// =========================================

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");

  grid.innerHTML = "";

  const today = gregorianToJalali(new Date());

  const jy = calendarYear;
  const jm = calendarMonth;
  const monthNames = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];

  document.getElementById("calendarTitle").textContent =
    `${monthNames[jm - 1]} ${jy}`;

  const monthLength = jalaali.jalaaliMonthLength(jy, jm);

  const firstDay = Object.keys(database).sort()[0];

  for (let jd = 1; jd <= monthLength; jd++) {
    const g = jalaliToGregorian(jy, jm, jd);

    const key = getDateString(g);

    const div = document.createElement("div");

    div.className = "calendarDay " + getDayStatus(key);

    div.textContent = jd;

    const startDate = firstDay ? getSafeDate(firstDay) : new Date();

    const maxDate = new Date(startDate);
    maxDate.setDate(maxDate.getDate() + settings.challengeDays - 1);

    if ((firstDay && key < firstDay) || g > maxDate) {
      div.classList.add("disabled");
    } else {
      div.onclick = () => {
        currentDate = key;

        render();

        showPage("mainPage");
      };
    }

    grid.appendChild(div);
  }
}

const STORAGE_KEY = "prayerTrackerData";

const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

// 0 = خوانده نشده
// 1 = خوانده شد
// 2 = قضا خوانده شده

const statusNames = ["خوانده نشده", "خوانده شد", "قضا خوانده شده"];

const statusClasses = ["pending", "done", "missed"];

let database = {};

let currentDate = getTodayString();

//==========================================
// تاریخ
//==========================================

function getTodayString() {
  return getDateString(new Date());
}

function goToday() {
  currentDate = getTodayString();

  render();
}

//==========================================
// ذخیره
//==========================================

function load() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    database = JSON.parse(saved);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(database));

  updateSaveTime();
}

//==========================================
// ایجاد روز
//==========================================

function ensureDay(date) {
  if (database[date]) return;

  database[date] = {};

  prayers.forEach((p) => {
    database[date][p] = 0;
  });
}

//==========================================
// تغییر وضعیت
//==========================================

function togglePrayer(prayer) {
  ensureDay(currentDate);

  database[currentDate][prayer]++;

  if (database[currentDate][prayer] > 2) {
    database[currentDate][prayer] = 0;
  }

  save();

  render();
}

//==========================================
// رندر نمازها
//==========================================

function renderPrayers() {
  ensureDay(currentDate);

  document.querySelectorAll(".prayerCard").forEach((card) => {
    const prayer = card.dataset.prayer;

    const button = card.querySelector(".status");

    const state = database[currentDate][prayer];

    button.textContent = statusNames[state];

    button.className = "status";

    button.classList.add(statusClasses[state]);
  });
}

// =========================================
// نمایش تاریخ فعلی
// =========================================

function renderDate() {
  const dateElement = document.getElementById("currentDate");

  if (!dateElement) return;

  const gDate = getSafeDate(currentDate);

  const jDate = gregorianToJalali(gDate);

  dateElement.textContent = `${jDate.jd} ${
    [
      "فروردین",
      "اردیبهشت",
      "خرداد",
      "تیر",
      "مرداد",
      "شهریور",
      "مهر",
      "آبان",
      "آذر",
      "دی",
      "بهمن",
      "اسفند",
    ][jDate.jm - 1]
  } ${jDate.jy}`;
}

//==========================================
// رندر کلی
//==========================================

function render() {
  renderDate();
  renderPrayers();

  updateScore();
  updateStats();
  updateChallenge();
  updatePrayerAchievement();
}

//==========================================
// Event
//==========================================

document

  .querySelectorAll(".prayerCard")

  .forEach((card) => {
    card.onclick = () => {
      togglePrayer(card.dataset.prayer);
    };
  });

document.getElementById("prevDay").onclick = () => changeDate(-1);

document.getElementById("nextDay").onclick = () => changeDate(1);

document.getElementById("prevMonth").onclick = () => {
  calendarMonth--;

  if (calendarMonth < 1) {
    calendarMonth = 12;
    calendarYear--;
  }

  renderCalendar();
};

document.getElementById("nextMonth").onclick = () => {
  calendarMonth++;

  if (calendarMonth > 12) {
    calendarMonth = 1;
    calendarYear++;
  }

  renderCalendar();
};

document.getElementById("currentMonth").onclick = () => {
  const today = gregorianToJalali(new Date());

  calendarYear = today.jy;
  calendarMonth = today.jm;

  renderCalendar();
};

// =========================================
// Pages
// =========================================

function showPage(page) {
  document.getElementById("mainPage").classList.add("hidden");
  document.getElementById("calendarPage").classList.add("hidden");
  document.getElementById("settingsPage").classList.add("hidden");

  document.getElementById(page).classList.remove("hidden");
}

document.getElementById("calendarButton").onclick = function () {
  showPage("calendarPage");

  renderCalendar();
};

document.getElementById("settingButton").onclick = function () {
  showPage("settingsPage");

  document.getElementById("challengeInput").value = settings.challengeDays;
};

document.getElementById("todayButton").onclick = function () {
  showPage("mainPage");

  currentDate = getTodayString();

  render();
};

document.getElementById("saveSettings").onclick = function () {
  const value = Number(document.getElementById("challengeInput").value);

  if (value > 0) {
    settings.challengeDays = value;

    saveSettings();

    render();

    showModal("تنظیمات با موفقیت ذخیره شد");
  }
};

//==========================================
// گرفتن تمام نمازها
//==========================================

function getAllPrayers() {
  let result = [];

  Object.keys(database).forEach((day) => {
    prayers.forEach((p) => {
      result.push(database[day][p]);
    });
  });

  return result;
}

//==========================================
// آمار کلی
//==========================================

function calculateStats() {
  const all = getAllPrayers();

  let done = 0;

  let missed = 0;

  all.forEach((status) => {
    if (status === 1) done++;

    if (status === 2) missed++;
  });

  const total = all.length;

  let percent = 0;

  if (total > 0) {
    percent = Math.round((done / total) * 100);
  }

  return {
    done,

    missed,

    total,

    percent,
  };
}

//==========================================
// امتیاز امروز
//==========================================

function calculateTodayScore() {
  ensureDay(currentDate);

  let score = 0;

  prayers.forEach((p) => {
    if (database[currentDate][p] === 1) {
      score += 20;
    }
  });

  return score;
}

//==========================================
// بروزرسانی امتیاز
//==========================================

function updateScore() {
  const score = calculateTodayScore();

  document.getElementById("score").textContent = score;

  const circle = document.getElementById("progressCircle");

  const circumference = 471;

  circle.style.strokeDashoffset = circumference - (circumference * score) / 100;

  const message = document.getElementById("scoreMessage");

  if (score === 100) {
    message.textContent = "🌟 روزت کامل شد";
  } else if (score === 80) {
    message.textContent = "داری عالی جلو میری";
  } else if (score === 60) {
    message.textContent = "خوب جلو رفتی";
  } else if (score === 40) {
    message.textContent = "هنوز قبول نیست";
  } else if (score === 20) {
    message.textContent = "تازه یه نماز خوندی";
  } else {
    message.textContent = "هنوز نماز نخوندی، شروع کن.";
  }
}

//==========================================
// بروزرسانی آمار
//==========================================

function updateStats() {
  const stats = calculateStats();

  document.getElementById("doneCount").textContent = stats.done;

  document.getElementById("missedCount").textContent = stats.missed;

  document.getElementById("totalCount").textContent = stats.total;

  document.getElementById("percent").textContent = stats.percent + "%";
}

//==========================================
// چالش 40 روزه
//==========================================

function updateChallenge() {
  const days = Object.keys(database)

    .sort();

  if (days.length === 0) return;

  const start = getSafeDate(days[0]);

  const today = getSafeDate(currentDate);

  let diff = Math.floor((today - start) / 86400000) + 1;

  if (diff < 1) diff = 1;

  const max = settings.challengeDays;

  if (diff > max) diff = max;

  document.getElementById("challengeDay").textContent = `روز ${diff} از ${max}`;

  document.getElementById("challengeProgress").style.width =
    (diff / max) * 100 + "%";
}

//==========================================
// زمان آخرین ذخیره
//==========================================

function updateSaveTime() {
  const now = new Date();

  const time = now.toLocaleTimeString("fa-IR");

  document.getElementById("lastSave").textContent = "آخرین ذخیره: " + time;
}

//==========================================
// تغییر خودکار روز
//==========================================

function autoDayChange() {
  const today = getTodayString();

  if (currentDate !== today) {
    currentDate = today;

    render();
  }
}

setInterval(
  autoDayChange,

  60000,
);

window.addEventListener("load", () => {
  loadSettings();
  load();

  const today = gregorianToJalali(new Date());

  calendarYear = today.jy;
  calendarMonth = today.jm;

  render();
});

//==========================================
// وضعیت یک روز
//==========================================

function getDayStatus(day) {
  if (!database[day]) return "empty";

  let hasMissed = false;

  let allDone = true;

  prayers.forEach((p) => {
    const value = database[day][p];

    if (value === 2) hasMissed = true;

    if (value !== 1) allDone = false;
  });

  if (allDone) return "perfect";

  if (hasMissed) return "bad";

  return "normal";
}

//==========================================
// رفتن به روز انتخاب شده
//==========================================

function openCalendarDay(day) {
  currentDate = day;

  render();

  window.scrollTo({
    top: 0,

    behavior: "smooth",
  });
}

//==========================================
// ریستارت
//==========================================

//==========================================
// ریستارت
//==========================================

document.getElementById("resetAll").onclick = function () {
  confirmModal("تمام اطلاعات پاک بشه؟", () => {
    // حذف اطلاعات
    database = {};

    // بازگردانی تنظیمات
    settings = {
      challengeDays: 40,
    };

    // پاک کردن حافظه
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SETTINGS_KEY);

    // برگشت به امروز
    currentDate = getTodayString();

    // ذخیره تنظیمات پیش‌فرض
    saveSettings();

    // بروزرسانی صفحه
    render();
    renderCalendar();

    // نمایش پیام موفقیت

    showModal("برنامه به حالت اولیه برگشت", "🔄");
  });
};
