// Output:
export const formatTime = (dateTimeStr) => {
  if (!dateTimeStr) return "-";
  return new Date(dateTimeStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Output: HH:MM:SS
export const formatTimeForInput = (datetime) => {
  if (!datetime) return "";
  const d = new Date(datetime);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
};

// Output: 30 Desember 2025
export const formatDateIndo = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// Output:
export const isCrossDay = (shiftDate, dateTimeStr) => {
  if (!shiftDate || !dateTimeStr) return false;
  const shift = new Date(shiftDate);
  const time = new Date(dateTimeStr);
  return time.getDate() !== shift.getDate();
};

// Output:
export const getLocalDateString = (dateInput) => {
  if (!dateInput) return null;
  return new Date(dateInput).toLocaleDateString("en-CA");
};

// Output: 31/12/2025
export const formatTanggalPendek = (dateString) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

// Output: Rabu, 31 Desember 2025
export const formatTanggalLengkap = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// Output: YYYY-MM-DDTHH:mm
export const formatToDatetimeLocal = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Output: YYYY-MM-DDTHH:mm:ss
export const formatToDatetimeLocalComplete = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const formatTanggalWaktuLengkap = () => {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
};


// Variasi A: Format Angka Penuh (Contoh: 30/11/2025 17:01:16)
export const formatTanggalWaktuMundur = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);

  // Menggunakan helper padStart agar angka satuan tetap memiliki 2 digit (misal: 05)
  const pad = (num) => String(num).padStart(2, "0");

  const tanggal = pad(date.getDate());
  const bulan = pad(date.getMonth() + 1); // Bulan dimulai dari 0
  const tahun = date.getFullYear();

  const jam = pad(date.getHours());
  const menit = pad(date.getMinutes());
  const detik = pad(date.getSeconds());

  return `${tanggal}/${bulan}/${tahun} ${jam}:${menit}:${detik}`;
};

// Variasi B: Format Nama Bulan Bahasa Indonesia (Contoh: 30 November 2025 17:01:16)
export const formatTanggalWaktuIndonesia = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);

  const bulanIndo = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const pad = (num) => String(num).padStart(2, "0");

  const tanggal = date.getDate();
  const bulan = bulanIndo[date.getMonth()];
  const tahun = date.getFullYear();

  const jam = pad(date.getHours());
  const menit = pad(date.getMinutes());
  const detik = pad(date.getSeconds());

  return `${tanggal} ${bulan} ${tahun} ${jam}:${menit}:${detik}`;
};