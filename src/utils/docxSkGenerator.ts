import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Packer,
  AlignmentType,
  WidthType,
  BorderStyle,
  PageBreak
} from 'docx';
import { SkSaktiDraft, UserSaktiRecord } from '../types';

/**
 * Generates official editable .docx (Microsoft Word) for SK Penetapan User SAKTI
 * Strictly follows the official template "Format SK Penetapan User SAKTI - Satker.docx"
 */
export async function generateSkSaktiDocx(
  draft: SkSaktiDraft,
  allUsers: UserSaktiRecord[]
): Promise<Blob> {
  const selectedUsers = allUsers.filter(u => draft.selectedUserIds.includes(u.id));

  // Format date indonesian
  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const day = parseInt(parts[2], 10);
        const month = months[parseInt(parts[1], 10) - 1] || parts[1];
        const year = parts[0];
        return `${day} ${month} ${year}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const formattedDate = formatIndoDate(draft.tanggalSk);

  // Common font family
  const FONT_FAMILY = 'Arial';

  // -------------------------------------------------------------
  // PAGE 1: Kop, Judul, Menimbang, Mengingat
  // -------------------------------------------------------------
  const page1Children: (Paragraph | Table)[] = [];

  // Kop Surat Instansi
  if (draft.kopSurat.kementerian) {
    page1Children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: draft.kopSurat.kementerian.toUpperCase(),
            bold: true,
            font: FONT_FAMILY,
            size: 24 // 12pt
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 }
      })
    );
  }

  if (draft.kopSurat.eselon1) {
    page1Children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: draft.kopSurat.eselon1.toUpperCase(),
            bold: true,
            font: FONT_FAMILY,
            size: 24
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 }
      })
    );
  }

  page1Children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: (draft.kopSurat.satkerUnit || draft.namaSatker).toUpperCase(),
          bold: true,
          font: FONT_FAMILY,
          size: 26 // 13pt
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 }
    })
  );

  if (draft.kopSurat.alamatKontak) {
    page1Children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: draft.kopSurat.alamatKontak,
            font: FONT_FAMILY,
            size: 18 // 9pt
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );
  }

  // Divider line under Kop
  page1Children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '_______________________________________________________________________________',
          font: FONT_FAMILY,
          size: 18
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 }
    })
  );

  // Judul SK
  page1Children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `KEPUTUSAN ${draft.pejabat.jabatan.toUpperCase() || 'KUASA PENGGUNA ANGGARAN'} ${draft.namaSatker.toUpperCase()}`,
          bold: true,
          font: FONT_FAMILY,
          size: 24
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `NOMOR ${draft.nomorSk || 'KEP-    /    /    /2026'}`,
          bold: true,
          font: FONT_FAMILY,
          size: 24
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'TENTANG',
          bold: true,
          font: FONT_FAMILY,
          size: 24
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: draft.tentang.toUpperCase(),
          bold: true,
          font: FONT_FAMILY,
          size: 24
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${draft.pejabat.jabatan.toUpperCase() || 'KUASA PENGGUNA ANGGARAN'} ${draft.namaSatker.toUpperCase()},`,
          bold: true,
          font: FONT_FAMILY,
          size: 24
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  // Bagian Menimbang
  page1Children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Menimbang :',
          bold: true,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      spacing: { after: 80 }
    })
  );

  draft.menimbang.forEach((item, index) => {
    const huruf = item.huruf || String.fromCharCode(97 + index);
    page1Children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${huruf}.  `,
            bold: true,
            font: FONT_FAMILY,
            size: 22
          }),
          new TextRun({
            text: item.text,
            font: FONT_FAMILY,
            size: 22
          })
        ],
        indent: { left: 720, hanging: 360 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 100, line: 276 }
      })
    );
  });

  // Bagian Mengingat
  page1Children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Mengingat   :',
          bold: true,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      spacing: { before: 120, after: 80 }
    })
  );

  draft.mengingat.forEach((item, index) => {
    const num = item.nomor || index + 1;
    page1Children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${num}.  `,
            bold: true,
            font: FONT_FAMILY,
            size: 22
          }),
          new TextRun({
            text: item.text,
            font: FONT_FAMILY,
            size: 22
          })
        ],
        indent: { left: 720, hanging: 360 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 100, line: 276 }
      })
    );
  });

  // Page break to Page 2
  page1Children.push(
    new Paragraph({
      children: [new PageBreak()]
    })
  );

  // -------------------------------------------------------------
  // PAGE 2: MEMUTUSKAN, Diktum PERTAMA - KEEMPAT, Tanda Tangan KPA
  // -------------------------------------------------------------
  const page2Children: (Paragraph | Table)[] = [];

  page2Children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'MEMUTUSKAN:',
          bold: true,
          font: FONT_FAMILY,
          size: 24
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Menetapkan :',
          bold: true,
          font: FONT_FAMILY,
          size: 22
        }),
        new TextRun({
          text: `  ${draft.menetapkan}`,
          bold: true,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160, line: 276 }
    })
  );

  // Diktum Pertama s/d Keempat
  draft.diktum.forEach(dik => {
    page2Children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${dik.label} : `,
            bold: true,
            font: FONT_FAMILY,
            size: 22
          }),
          new TextRun({
            text: dik.text,
            font: FONT_FAMILY,
            size: 22
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 720, hanging: 720 },
        spacing: { after: 140, line: 276 }
      })
    );
  });

  // Tanda Tangan KPA (Right Aligned block)
  page2Children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Ditetapkan di ${draft.tempatPenetapan || 'Semarang'}`,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 280, after: 40 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `pada tanggal ${formattedDate || '                   '}`,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${(draft.pejabat.jabatan || 'Kuasa Pengguna Anggaran').toUpperCase()} ${draft.namaSatker.toUpperCase()},`,
          bold: true,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 700 } // Spasi tanda tangan
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: draft.pejabat.namaPejabat || '( .................................................... )',
          bold: true,
          underline: {},
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 40 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `NIP ${draft.pejabat.nipPejabat || '....................................'}`,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 120 }
    })
  );

  // Page break to Page 3 (Lampiran)
  page2Children.push(
    new Paragraph({
      children: [new PageBreak()]
    })
  );

  // -------------------------------------------------------------
  // PAGE 3: LAMPIRAN (Tabel Pengguna SAKTI Tingkat Satuan Kerja)
  // -------------------------------------------------------------
  const page3Children: (Paragraph | Table)[] = [];

  page3Children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `LAMPIRAN KEPUTUSAN ${(draft.pejabat.jabatan || 'KUASA PENGGUNA ANGGARAN').toUpperCase()} ${draft.namaSatker.toUpperCase()}`,
          bold: true,
          font: FONT_FAMILY,
          size: 20
        })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `NOMOR     : ${draft.nomorSk}`,
          bold: true,
          font: FONT_FAMILY,
          size: 20
        })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `TANGGAL : ${formattedDate}`,
          bold: true,
          font: FONT_FAMILY,
          size: 20
        })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 180 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'DAFTAR PEJABAT, OPERATOR, DAN ADMINISTRATOR PENGGUNA SISTEM SAKTI',
          bold: true,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'TINGKAT SATUAN KERJA',
          bold: true,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `PADA ${draft.namaSatker.toUpperCase()} (${draft.kodeSatker})`,
          bold: true,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `TAHUN ANGGARAN ${draft.tahunAnggaran}`,
          bold: true,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  // Tabel Pengguna SAKTI
  // Kolom: NO, NAMA / NIP / PANGKAT / GOLONGAN, JABATAN, PERAN JABATAN, JABATAN PERBENDAHARAAN
  const tableRows: TableRow[] = [];

  // Header Row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 600, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'NO', bold: true, font: FONT_FAMILY, size: 20 })],
              alignment: AlignmentType.CENTER
            })
          ],
          verticalAlign: 'center',
          shading: { fill: 'F3F4F6' }
        }),
        new TableCell({
          width: { size: 3600, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'NAMA / NIP /\nPANGKAT / GOLONGAN',
                  bold: true,
                  font: FONT_FAMILY,
                  size: 20
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          verticalAlign: 'center',
          shading: { fill: 'F3F4F6' }
        }),
        new TableCell({
          width: { size: 2600, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'JABATAN', bold: true, font: FONT_FAMILY, size: 20 })],
              alignment: AlignmentType.CENTER
            })
          ],
          verticalAlign: 'center',
          shading: { fill: 'F3F4F6' }
        }),
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'PERAN JABATAN', bold: true, font: FONT_FAMILY, size: 20 })],
              alignment: AlignmentType.CENTER
            })
          ],
          verticalAlign: 'center',
          shading: { fill: 'F3F4F6' }
        }),
        new TableCell({
          width: { size: 2400, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'JABATAN PERBENDAHARAAN', bold: true, font: FONT_FAMILY, size: 20 })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          verticalAlign: 'center',
          shading: { fill: 'F3F4F6' }
        })
      ]
    })
  );

  // Data Rows
  selectedUsers.forEach((user, idx) => {
    tableRows.push(
      new TableRow({
        children: [
          // 1. NO
          new TableCell({
            width: { size: 600, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: String(idx + 1), font: FONT_FAMILY, size: 20 })],
                alignment: AlignmentType.CENTER
              })
            ]
          }),
          // 2. NAMA / NIP / PANGKAT / GOLONGAN
          new TableCell({
            width: { size: 3600, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: user.namaLengkap || '-',
                    bold: true,
                    font: FONT_FAMILY,
                    size: 20
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `NIP. ${user.nip || '-'}`,
                    font: FONT_FAMILY,
                    size: 19
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: user.pangkatGolongan || 'Penata / III/c',
                    font: FONT_FAMILY,
                    size: 19
                  })
                ]
              })
            ]
          }),
          // 3. JABATAN KEDINASAN
          new TableCell({
            width: { size: 2600, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: user.jabatan || 'Pengelola Keuangan / Pelaksana',
                    font: FONT_FAMILY,
                    size: 20
                  })
                ]
              })
            ]
          }),
          // 4. PERAN JABATAN (Approval / Validator / Operator / Admin)
          new TableCell({
            width: { size: 1800, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: user.peranJabatan || 'Operator',
                    bold: true,
                    font: FONT_FAMILY,
                    size: 20
                  })
                ],
                alignment: AlignmentType.CENTER
              })
            ]
          }),
          // 5. JABATAN PERBENDAHARAAN
          new TableCell({
            width: { size: 2400, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: user.jabatanPerbendaharaan || 'Operator Anggaran',
                    font: FONT_FAMILY,
                    size: 20
                  })
                ]
              })
            ]
          })
        ]
      })
    );
  });

  const userTable = new Table({
    width: { size: 11000, type: WidthType.DXA },
    rows: tableRows
  });

  page3Children.push(userTable);

  // Tanda Tangan Lampiran KPA
  page3Children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Ditetapkan di ${draft.tempatPenetapan || 'Semarang'}`,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 240, after: 40 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `pada tanggal ${formattedDate || '                   '}`,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 80 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${(draft.pejabat.jabatan || 'Kuasa Pengguna Anggaran').toUpperCase()} ${draft.namaSatker.toUpperCase()},`,
          bold: true,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 600 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: draft.pejabat.namaPejabat || '( .................................................... )',
          bold: true,
          underline: {},
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 40 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `NIP ${draft.pejabat.nipPejabat || '....................................'}`,
          font: FONT_FAMILY,
          size: 22
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 120 }
    })
  );

  // -------------------------------------------------------------
  // PAGE 4 (OPSIONAL): PETUNJUK PENGISIAN
  // -------------------------------------------------------------
  const page4Children: (Paragraph | Table)[] = [];
  if (!draft.hideInstructionPage) {
    page3Children.push(
      new Paragraph({
        children: [new PageBreak()]
      })
    );

    page4Children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PETUNJUK PENGISIAN FORMAT SK PENETAPAN USER SAKTI',
            bold: true,
            font: FONT_FAMILY,
            size: 24
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '1. Format Keputusan ini merupakan format baku penetapan user pengguna Aplikasi SAKTI tingkat satuan kerja sesuai pedoman Kementerian Keuangan.',
            font: FONT_FAMILY,
            size: 20
          })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '2. Kolom NAMA / NIP / PANGKAT / GOLONGAN diisi nama lengkap pegawai sesuai data kepegawaian resmi (BKN), NIP 18 digit tanpa spasi/titik, serta pangkat/golongan ruang terakhir.',
            font: FONT_FAMILY,
            size: 20
          })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '3. Kolom JABATAN diisi jabatan kedinasan definitif pegawai pada satuan kerja (misal: Kepala Seksi, Pelaksana, Pranata Komputer).',
            font: FONT_FAMILY,
            size: 20
          })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '4. Kolom PERAN JABATAN wajib dipilih salah satu dari 4 (empat) peran kewenangan resmi SAKTI:',
            bold: true,
            font: FONT_FAMILY,
            size: 20
          })
        ],
        spacing: { after: 60 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '    • Approval: Pejabat yang berwenang menyetujui transaksi anggaran/komitmen (KPA, PPK).',
            font: FONT_FAMILY,
            size: 20
          })
        ],
        spacing: { after: 40 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '    • Validator: Pejabat yang bertugas menguji dan memvalidasi kebenaran dokumen perintah pembayaran (PPSPM).',
            font: FONT_FAMILY,
            size: 20
          })
        ],
        spacing: { after: 40 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '    • Operator: Pelaksana teknis perekaman data modul (Anggaran, Komitmen, Pembayaran, Bendahara, Aset, Persediaan, GLP).',
            font: FONT_FAMILY,
            size: 20
          })
        ],
        spacing: { after: 40 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '    • Admin: Pengelola administrasi pengguna, pembagian kewenangan user, dan pemeliharaan teknis di tingkat Satker.',
            font: FONT_FAMILY,
            size: 20
          })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '5. Kolom JABATAN PERBENDAHARAAN mencantumkan peran keuangan negara (KPA, PPK, PPSPM, Bendahara Pengeluaran/Penerimaan, Operator Komitmen, dsb).',
            font: FONT_FAMILY,
            size: 20
          })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '6. Asas Pemisahan Kewenangan (Segregation of Duties) wajib dipenuhi. Dilarang merangkap jabatan perbendaharaan yang bertentangan (misal: PPK merangkap PPSPM atau Bendahara merangkap PPK/PPSPM).',
            font: FONT_FAMILY,
            size: 20
          })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '7. Surat Keputusan yang telah ditandatangani KPA dan dibubuhi cap dinas diunggah melalui formulir elektronik pendaftaran user SAKTI pada aplikasi ANGKASA KPPN Semarang I.',
            font: FONT_FAMILY,
            size: 20
          })
        ],
        spacing: { after: 100 }
      })
    );
  }

  // Combine into single Document with A4 margins
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips (2.54 cm)
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: [
          ...page1Children,
          ...page2Children,
          ...page3Children,
          ...page4Children
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

/**
 * Triggers browser download for generated .docx file
 */
export function downloadBlobAsFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
