// Utility to export attendance data to Excel
import * as XLSX from 'xlsx';

export function exportAttendanceToExcel(records, section, subject) {
  const filtered = records.filter(r => r.section === section && r.subject === subject);
  const data = filtered.map(r => {
    let dateObj;
    let formatted = '-';
    const raw = r.recordedAt || r.timestamp;
    if (raw && !isNaN(Date.parse(raw))) {
      dateObj = new Date(raw);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      let hour = dateObj.getHours();
      const min = String(dateObj.getMinutes()).padStart(2, '0');
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      if (hour === 0) hour = 12;
      formatted = `${day}/${month}/${year} ${hour}:${min}${ampm}`;
    } else if (typeof raw === 'string') {
      formatted = raw;
    }
    return {
      'Student Name': r.name,
      'Student ID': r.studentId,
      'Section': r.section,
      'Subject': r.subject,
      'Status': r.status,
      'Time & Date': formatted,
    };
  });
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  XLSX.writeFile(workbook, `Attendance_${section}_${subject}.xlsx`);
}
