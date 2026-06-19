// ============================================================
// LOCO 21 PRO — Date & Period Utilities (Lib Layer)
// Pure functions for handling business periods
// ============================================================

export interface BusinessPeriod {
  monthName: string;   // e.g., "Juni"
  monthValue: string;  // e.g., "06"
  year: number;        // e.g., 2026
  startDate: string;   // e.g., "2026-06-05"
  endDate: string;     // e.g., "2026-07-04"
}

/**
 * Menentukan periode bisnis perusahaan berdasarkan tanggal standar (YYYY-MM-DD).
 * Periode X = Tanggal 5 bulan X s/d Tanggal 4 bulan X+1.
 * 
 * Aturan:
 * - Jika tanggal <= 4, ia masuk ke periode bulan sebelumnya.
 * - Jika tanggal >= 5, ia masuk ke periode bulan saat ini.
 */
export function getBusinessPeriod(dateString: string | null | undefined): BusinessPeriod | null {
  if (!dateString) return null;
  const [yStr, mStr, dStr] = dateString.split('-');
  
  if (!yStr || !mStr || !dStr) return null;

  let year = parseInt(yStr, 10);
  let month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  // Jika tanggal 1-4, maka ia masuk ke periode bulan sebelumnya
  if (day <= 4) {
    month = month - 1;
    if (month === 0) {
      month = 12;
      year = year - 1;
    }
  }

  const monthValue = String(month).padStart(2, '0');
  const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthName = monthNames[month];

  // Hitung akhir periode (tanggal 4 bulan berikutnya)
  let endMonth = month + 1;
  let endYear = year;
  if (endMonth === 13) {
    endMonth = 1;
    endYear = year + 1;
  }
  
  return {
    monthName,
    monthValue,
    year,
    startDate: `${year}-${monthValue}-05`,
    endDate: `${endYear}-${String(endMonth).padStart(2, '0')}-04`
  };
}
