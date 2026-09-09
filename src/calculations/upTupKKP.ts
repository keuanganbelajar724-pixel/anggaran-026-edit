import { UPTUPKKPInput } from '../models/ikpa';
import { round2, average } from './rounding';

export const KKP_MONTHLY_TARGETS: Record<string, number> = {
  '01': 0.01,
  '02': 0.01,
  '03': 0.01,
  '04': 0.05,
  '05': 0.05,
  '06': 0.05,
  '07': 0.09,
  '08': 0.09,
  '09': 0.09,
  '10': 0.125,
  '11': 0.125,
  '12': 0.125
};

export interface UPTUPKKPResult {
  rawValue: number;
  processedMonths: any[];
  totalPenggunaan: number;
}

export function calculateUPTUPKKP(inputs: UPTUPKKPInput[]): UPTUPKKPResult {
  if (!inputs || inputs.length === 0) {
    return {
      rawValue: 0,
      processedMonths: [],
      totalPenggunaan: 0
    };
  }

  let totalPenggunaan = 0;
  const processed = inputs.map(item => {
    const upSetahun = item.upKKPPerBulan * 12;
    const targetPct = KKP_MONTHLY_TARGETS[item.periode] ?? 0.125;
    const nominalTarget = upSetahun * targetPct;

    totalPenggunaan += item.penggunaanKKP;

    // Monthly score I:
    let scoreI = 0;
    if (item.penggunaanKKP === 0) {
      scoreI = 0;
    } else if (item.penggunaanKKP >= nominalTarget) {
      scoreI = 110;
    } else {
      scoreI = 100;
    }

    return {
      ...item,
      upSetahun,
      targetPct,
      nominalTarget,
      scoreI,
      scoreJ: 0
    };
  });

  // Calculate J column exact pattern:
  // J01 = I01
  // J02 = I02
  // J03 = I03
  // J04 = AVERAGE(I03, I04)
  // J05 = AVERAGE(I03, I05)
  // J06 = AVERAGE(I03, I06)
  // J07 = AVERAGE(I03, I06, I07)
  // J08 = AVERAGE(I03, I06, I08)
  // J09 = AVERAGE(I03, I06, I09)
  // J10 = AVERAGE(I03, I06, I09, I10)
  // J11 = AVERAGE(I03, I06, I09, I11)
  // J12 = AVERAGE(I03, I06, I09, I12)
  const iList = processed.map(x => x.scoreI);
  const i3 = iList[2] ?? iList[iList.length - 1] ?? 0;
  const i6 = iList[5] ?? iList[iList.length - 1] ?? 0;
  const i9 = iList[8] ?? iList[iList.length - 1] ?? 0;

  for (let idx = 0; idx < processed.length; idx++) {
    let jVal: number;
    if (idx < 3) {
      jVal = round2(iList[idx]);
    } else if (idx < 6) {
      jVal = round2(average([i3, iList[idx]]));
    } else if (idx < 9) {
      jVal = round2(average([i3, i6, iList[idx]]));
    } else {
      jVal = round2(average([i3, i6, i9, iList[idx]]));
    }
    processed[idx].scoreJ = jVal;
  }

  const lastMonth = processed[processed.length - 1];
  const rawValue = lastMonth ? lastMonth.scoreJ : 0;

  return {
    rawValue,
    processedMonths: processed,
    totalPenggunaan
  };
}
