import xlsx from 'xlsx';
import * as fs from 'fs';

const { readFile, utils } = xlsx;

const files = fs.readdirSync('.').filter(f => f.endsWith('.xlsx'));
console.log('All Excel files in root:', files);

files.forEach(f => {
  try {
    const wb = xlsx.readFile(f);
    console.log('\n=============================');
    console.log('FILE:', f);
    console.log('SHEETS:', wb.SheetNames);
    wb.SheetNames.forEach(name => {
      const s = wb.Sheets[name];
      const rows = xlsx.utils.sheet_to_json(s, { header: 1 });
      console.log(`-- Sheet: [${name}] Total Rows: ${rows.length}`);
      if (rows.length > 0) {
        console.log('   Row 1:', JSON.stringify(rows[0]));
        if (rows.length > 1) console.log('   Row 2:', JSON.stringify(rows[1]));
        if (rows.length > 2) console.log('   Row 3:', JSON.stringify(rows[2]));
        if (rows.length > 3) console.log('   Row 4:', JSON.stringify(rows[3]));
        if (rows.length > 4) console.log('   Row 5:', JSON.stringify(rows[4]));
      }
    });
  } catch (err) {
    console.error('Error reading', f, err.message);
  }
});
