import React, { useState, useEffect } from 'react';
import { Modal } from './ui';
import { formatDate } from '../utils';
import { triagemPreAnestesicaService } from '../services/supabase';
import { useAuth } from './PremiumLogin';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type PreAnestesiaDados = {
  municipio: string;
  unidade_hospitalar: string;
  nome_paciente: string;
  data_nascimento: string;
  idade: string;
  sexo: string;
  procedimento_s: string;
  cirurgiao: string;
  cirurgias_previas: string;
  intercorrencias_anestesicas: string;
  alergias: string;
  tabagismo: string;
  etilismo: string;
  peso_kg: string;
  altura_cm: string;
  imc_kg_m2: string;
  hipertensao_arterial: string;
  precordialgia: string;
  palpitacao: string;
  dispneia: string;
  doenca_renal: string;
  iam_previo: string;
  cateterismo_previo: string;
  avc_previo: string;
  hipotireoidismo: string;
  hipertireoidismo: string;
  diabetes_melitus: string;
  observacoes_outras_comorbidades: string;
  uso_anticoagulante_antiagregante: string;
  medicamentos_uso_continuo: string;
  hb: string;
  ht: string;
  plaq: string;
  na: string;
  k: string;
  ur: string;
  cr: string;
  glicemia: string;
  hba1c: string;
  tap: string;
  inr: string;
  kptt: string;
  outros_exames: string;
  ecg_eco: string;
  risco_cardiologico: string;
  liberado_para_cirurgia: string;
  avaliacao_com_anestesiologista: string;
  avaliacao_exames_complementares: string;
  avaliacoes_exames_complementares_texto: string;
  observacoes_finais: string;
  anestesiologista_assinatura: string;
  data_parecer: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial: Partial<PreAnestesiaDados>;
}

export default function PreAnestesiaModal({ isOpen, onClose, initial }: Props) {
  const { hospitalSelecionado } = useAuth();
  const [dados, setDados] = useState<PreAnestesiaDados>({
    municipio: '',
    unidade_hospitalar: '',
    nome_paciente: '',
    data_nascimento: '',
    idade: '',
    sexo: '',
    procedimento_s: '',
    cirurgiao: '',
    cirurgias_previas: '',
    intercorrencias_anestesicas: 'Não',
    alergias: 'Não',
    tabagismo: 'Não',
    etilismo: 'Não',
    peso_kg: '',
    altura_cm: '',
    imc_kg_m2: '',
    hipertensao_arterial: 'Não',
    precordialgia: 'Não',
    palpitacao: 'Não',
    dispneia: 'Não',
    doenca_renal: 'Não',
    iam_previo: 'Não',
    cateterismo_previo: 'Não',
    avc_previo: 'Não',
    hipotireoidismo: 'Não',
    hipertireoidismo: 'Não',
    diabetes_melitus: 'Não',
    observacoes_outras_comorbidades: '',
    uso_anticoagulante_antiagregante: 'Não',
    medicamentos_uso_continuo: '',
    hb: '',
    ht: '',
    plaq: '',
    na: '',
    k: '',
    ur: '',
    cr: '',
    glicemia: '',
    hba1c: '',
    tap: '',
    inr: '',
    kptt: '',
    outros_exames: '',
    ecg_eco: '',
    risco_cardiologico: 'Não',
    liberado_para_cirurgia: 'Não',
    avaliacao_com_anestesiologista: 'Não',
    avaliacao_exames_complementares: 'Não',
    avaliacoes_exames_complementares_texto: '',
    observacoes_finais: '',
    anestesiologista_assinatura: '',
    data_parecer: ''
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [meds, setMeds] = useState<Array<{ nome: string; m: boolean; t: boolean; n: boolean }>>(
    Array.from({ length: 4 }).map(() => ({ nome: '', m: false, t: false, n: false }))
  );

  useEffect(() => {
    const d: Partial<PreAnestesiaDados> = { ...initial };
    if (d.data_nascimento) d.data_nascimento = formatDate(String(d.data_nascimento));
    if (d.idade && !String(d.idade).includes('anos')) d.idade = `${d.idade} anos`;
    const filtered: Partial<PreAnestesiaDados> = {};
    Object.entries(d).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        (filtered as any)[k] = v;
      }
    });
    setDados(prev => ({ ...prev, ...filtered }));
    if (filtered.medicamentos_uso_continuo) {
      const arr = String(filtered.medicamentos_uso_continuo).split('\n').slice(0, 4);
      const parsed = Array.from({ length: 4 }).map((_, i) => {
        const line = arr[i] || '';
        const [nome, m, t, n] = line.split('|');
        return {
          nome: nome || '',
          m: m === '1',
          t: t === '1',
          n: n === '1'
        };
      });
      setMeds(parsed);
    }
  }, [initial]);
  const syncMedsToDados = (mm: Array<{ nome: string; m: boolean; t: boolean; n: boolean }>) => {
    const joined = mm.map(m => `${m.nome}|${m.m ? 1 : 0}|${m.t ? 1 : 0}|${m.n ? 1 : 0}`).join('\n');
    setDados(prev => ({ ...prev, medicamentos_uso_continuo: joined }));
  };

  useEffect(() => {
    if (hospitalSelecionado?.nome) {
      setDados(prev => ({
        ...prev,
        unidade_hospitalar: hospitalSelecionado.nome
      }));
    }
  }, [hospitalSelecionado]);

  const gerarPDF = async () => {
    setGerandoPDF(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 10;
      const startX = margin;
      let y = margin + 6;
      const bottomMargin = 10;
      const colW = pageW - margin * 2;
      const imageToBase64 = (url: string): Promise<{ data: string; width: number; height: number }> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve({ data: canvas.toDataURL('image/png'), width: img.width, height: img.height });
            } else {
              reject(new Error('Canvas context error'));
            }
          };
          img.onerror = reject;
          img.src = url;
        });
      };
      let logoInfo: { data: string; width: number; height: number } | null = null;
      try {
        logoInfo = await imageToBase64('/CIS_marca-1.png');
      } catch {}
      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - bottomMargin) {
          doc.addPage();
          y = margin + 6;
          doc.setTextColor(72, 128, 87);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16);
          const titleText = 'Triagem Pré Anestésica';
          const titleX = startX + (colW - doc.getTextWidth(titleText)) / 2;
          if (logoInfo) {
            const lw = 40;
            const lh = lw * (logoInfo.height / logoInfo.width);
            doc.addImage(logoInfo.data, 'PNG', startX, y - 18, lw, lh, undefined, 'FAST');
          }
          doc.text(titleText, titleX, y + 2);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          y += 10;
          const hospNomeBreak = dados.unidade_hospitalar || hospitalSelecionado?.nome || '';
          doc.setTextColor(72, 128, 87);
          const unidadeLabelBreak = 'Unidade:';
          const unidadeLabelWBreak = doc.getTextWidth(unidadeLabelBreak);
          const unidadeValueWBreak = doc.getTextWidth(hospNomeBreak ? ` ${hospNomeBreak}` : ' ___________________________');
          const unidadeXBreak = startX + (colW - (unidadeLabelWBreak + unidadeValueWBreak)) / 2;
          doc.text(unidadeLabelBreak, unidadeXBreak, y);
          doc.setTextColor(0, 0, 0);
          doc.text(hospNomeBreak ? ` ${hospNomeBreak}` : ' ___________________________', unidadeXBreak + unidadeLabelWBreak, y);
          y += 12;
        }
      };
      const fitText = (t: string, maxW: number) => {
        if (!t) return '';
        let s = String(t);
        while (doc.getTextWidth(s) > maxW && s.length > 1) {
          s = s.slice(0, -1);
        }
        if (s.length < String(t).length) {
          if (s.length > 3) s = s.slice(0, -3) + '...';
        }
        return s;
      };
      const print = (val: string | undefined | null, x: number, y: number, maxW: number) => {
        if (!val) return;
        const s = fitText(String(val), maxW);
        if (s) doc.text(s, x, y);
      };
      const drawLabeledBox = (x: number, yy: number, w: number, h: number, label: string, value?: string) => {
        doc.rect(x, yy, w, h);
        const oldSize = 10;
        doc.setFontSize(8);
        doc.text(label, x + 2, yy + 3);
        doc.setFontSize(oldSize);
        const vy = yy + h / 2 + 3;
        print(value || '', x + 2, vy, w - 4);
      };
      const drawCheck = (xx: number, yy: number, checked: boolean, size = 3) => {
        doc.rect(xx, yy, size, size);
        if (checked) {
          doc.line(xx + 0.7, yy + 1.6, xx + 1.5, yy + 2.4);
          doc.line(xx + 1.5, yy + 2.4, xx + 2.6, yy + 0.6);
        }
      };
      doc.setTextColor(72, 128, 87);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      const titleText = 'Triagem Pré Anestésica';
      const titleX = startX + (colW - doc.getTextWidth(titleText)) / 2;
      if (logoInfo) {
        const lw = 40;
        const lh = lw * (logoInfo.height / logoInfo.width);
        doc.addImage(logoInfo.data, 'PNG', startX, y - 18, lw, lh, undefined, 'FAST');
      }
      doc.text(titleText, titleX, y + 2);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      y += 10;
      const hospNome = dados.unidade_hospitalar || hospitalSelecionado?.nome || '';
      doc.setTextColor(72, 128, 87);
      const unidadeLabel = 'Unidade:';
      const unidadeLabelW = doc.getTextWidth(unidadeLabel);
      const unidadeValueW = doc.getTextWidth(hospNome ? ` ${hospNome}` : ' ___________________________');
      const unidadeX = startX + (colW - (unidadeLabelW + unidadeValueW)) / 2;
      doc.text(unidadeLabel, unidadeX, y);
      doc.setTextColor(0, 0, 0);
      doc.text(hospNome ? ` ${hospNome}` : ' ___________________________', unidadeX + unidadeLabelW, y);
      y += 12;
      const rowH = 8;
      const gap = 4;
      const halfW = (colW - gap) / 2;
      const c1 = colW * 0.55;
      const c2 = colW * 0.25;
      const c3 = colW * 0.2;
      drawLabeledBox(startX, y, c1, rowH, 'Nome', dados.nome_paciente);
      drawLabeledBox(startX + c1, y, c2, rowH, 'Data de nascimento', dados.data_nascimento);
      drawLabeledBox(startX + c1 + c2, y, c3, rowH, 'Idade', dados.idade);
      y += rowH + 2;
      const sexoW = 50;
      drawLabeledBox(startX, y, colW - sexoW, rowH, 'Procedimento(s)', dados.procedimento_s);
      doc.rect(startX + colW - sexoW, y, sexoW, rowH);
      const sexoLabel = 'Sexo';
      doc.text(sexoLabel, startX + colW - sexoW + 2, y + rowH / 2 + 1);
      const sexoLabelW = doc.getTextWidth(sexoLabel);
      let sexoX = startX + colW - sexoW + 2 + sexoLabelW + 6;
      drawCheck(sexoX, y + (rowH - 3) / 2, dados.sexo === 'F', 3);
      doc.text('F', sexoX + 3 + 2, y + rowH / 2 + 1);
      sexoX = sexoX + 3 + 2 + doc.getTextWidth('F') + 8;
      drawCheck(sexoX, y + (rowH - 3) / 2, dados.sexo === 'M', 3);
      doc.text('M', sexoX + 3 + 2, y + rowH / 2 + 1);
      y += rowH + 2;
      drawLabeledBox(startX, y, colW, rowH, 'Cirurgião', dados.cirurgiao);
      y += rowH + 2;
      drawLabeledBox(startX, y, halfW, rowH, 'Cirurgias prévias', dados.cirurgias_previas);
      doc.rect(startX + halfW + gap, y, halfW, rowH);
      const interLabel = 'Intercorrências anestésicas';
      doc.text(interLabel, startX + halfW + gap + 2, y + rowH / 2 + 1);
      const interLabelW = doc.getTextWidth(interLabel);
      const interBoxesX = startX + halfW + gap + 2 + interLabelW + 6;
      const cbSizeSimNao = 3;
      drawCheck(interBoxesX, y + (rowH - cbSizeSimNao) / 2, dados.intercorrencias_anestesicas === 'Sim', cbSizeSimNao);
      doc.text('Sim', interBoxesX + cbSizeSimNao + 2, y + rowH / 2 + 1);
      const naoX = interBoxesX + cbSizeSimNao + 2 + doc.getTextWidth('Sim') + 8;
      drawCheck(naoX, y + (rowH - cbSizeSimNao) / 2, false, cbSizeSimNao);
      doc.text('Não', naoX + cbSizeSimNao + 2, y + rowH / 2 + 1);
      y += rowH + 2;
      doc.rect(startX, y, halfW, rowH);
      const alergLabel = 'Alergias';
      doc.text(alergLabel, startX + 2, y + rowH / 2 + 1);
      const alergLabelW = doc.getTextWidth(alergLabel);
      const alergBoxesX = startX + 2 + alergLabelW + 6;
      drawCheck(alergBoxesX, y + (rowH - cbSizeSimNao) / 2, dados.alergias === 'Sim', cbSizeSimNao);
      doc.text('Sim', alergBoxesX + cbSizeSimNao + 2, y + rowH / 2 + 1);
      const alergNaoX = alergBoxesX + cbSizeSimNao + 2 + doc.getTextWidth('Sim') + 8;
      drawCheck(alergNaoX, y + (rowH - cbSizeSimNao) / 2, false, cbSizeSimNao);
      doc.text('Não', alergNaoX + cbSizeSimNao + 2, y + rowH / 2 + 1);
      doc.rect(startX + halfW + gap, y, halfW, rowH);
      const tabLabel = 'Tabagismo';
      doc.text(tabLabel, startX + halfW + gap + 2, y + rowH / 2 + 1);
      const tabLabelW = doc.getTextWidth(tabLabel);
      let tabX = startX + halfW + gap + 2 + tabLabelW + 6;
      drawCheck(tabX, y + (rowH - cbSizeSimNao) / 2, dados.tabagismo === 'Sim', cbSizeSimNao);
      doc.text('Sim', tabX + cbSizeSimNao + 2, y + rowH / 2 + 1);
      tabX = tabX + cbSizeSimNao + 2 + doc.getTextWidth('Sim') + 8;
      drawCheck(tabX, y + (rowH - cbSizeSimNao) / 2, dados.tabagismo === 'Não', cbSizeSimNao);
      doc.text('Não', tabX + cbSizeSimNao + 2, y + rowH / 2 + 1);
      tabX = tabX + cbSizeSimNao + 2 + doc.getTextWidth('Não') + 8;
      drawCheck(tabX, y + (rowH - cbSizeSimNao) / 2, dados.tabagismo === 'Ex-tabagista', cbSizeSimNao);
      doc.text('Ex-tabagista', tabX + cbSizeSimNao + 2, y + rowH / 2 + 1);
      y += rowH + 2;
      doc.rect(startX, y, halfW, rowH);
      const etilLabel = 'Etilismo';
      doc.text(etilLabel, startX + 2, y + rowH / 2 + 1);
      const etilLabelW = doc.getTextWidth(etilLabel);
      let etilX = startX + 2 + etilLabelW + 6;
      drawCheck(etilX, y + (rowH - cbSizeSimNao) / 2, dados.etilismo === 'Sim', cbSizeSimNao);
      doc.text('Sim', etilX + cbSizeSimNao + 2, y + rowH / 2 + 1);
      etilX = etilX + cbSizeSimNao + 2 + doc.getTextWidth('Sim') + 8;
      drawCheck(etilX, y + (rowH - cbSizeSimNao) / 2, dados.etilismo === 'Não', cbSizeSimNao);
      doc.text('Não', etilX + cbSizeSimNao + 2, y + rowH / 2 + 1);
      etilX = etilX + cbSizeSimNao + 2 + doc.getTextWidth('Não') + 8;
      drawCheck(etilX, y + (rowH - cbSizeSimNao) / 2, dados.etilismo === 'Ex-etilista', cbSizeSimNao);
      doc.text('Ex-etilista', etilX + cbSizeSimNao + 2, y + rowH / 2 + 1);
      const smallGap = 3;
      const smallW = (halfW - 2 * smallGap) / 3;
      const rightStart = startX + halfW + gap;
      doc.rect(rightStart, y, smallW, rowH);
      doc.text('Peso (kg)', rightStart + 2, y + 3);
      print(dados.peso_kg, rightStart + 2, y + rowH / 2 + 3, smallW - 4);
      doc.rect(rightStart + smallW + smallGap, y, smallW, rowH);
      doc.text('Altura (cm)', rightStart + smallW + smallGap + 2, y + 3);
      print(dados.altura_cm, rightStart + smallW + smallGap + 2, y + rowH / 2 + 3, smallW - 4);
      doc.rect(rightStart + (smallW + smallGap) * 2, y, smallW, rowH);
      doc.text('IMC (kg/m²)', rightStart + (smallW + smallGap) * 2 + 2, y + 3);
      print(dados.imc_kg_m2, rightStart + (smallW + smallGap) * 2 + 2, y + rowH / 2 + 3, smallW - 4);
      y += rowH + 4;
      ensureSpace(8 + (rowH + 2) * 4 + rowH * 2.5 + 18);
      doc.setFillColor(240, 240, 240);
      doc.setDrawColor(72, 128, 87);
      doc.rect(startX, y, colW, 6, 'FD');
      doc.setTextColor(72, 128, 87);
      doc.setFont('helvetica', 'bold');
      doc.text('COMORBIDADES', startX + 2, y + 4);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      y += 8;
      const itemW = (colW - gap) / 2;
      const renderComorb = (label: string, value: string, ix: number, iy: number) => {
        const x = startX + ix * (itemW + gap);
        const yy = y + iy * (rowH + 2);
        doc.rect(x, yy, itemW, rowH);
        const checksAreaW = 44;
        const lbl = fitText(label, itemW - checksAreaW - 8);
        doc.text(lbl, x + 2, yy + rowH / 2 + 1);
        const checksStartX = x + itemW - checksAreaW + 2;
        const simBoxX = checksStartX;
        drawCheck(simBoxX, yy + (rowH - cbSizeSimNao) / 2, value === 'Sim', cbSizeSimNao);
        doc.text('Sim', simBoxX + cbSizeSimNao + 2, yy + rowH / 2 + 1);
        const naoBoxX = checksStartX + 22;
        drawCheck(naoBoxX, yy + (rowH - cbSizeSimNao) / 2, value === 'Não', cbSizeSimNao);
        doc.text('Não', naoBoxX + cbSizeSimNao + 2, yy + rowH / 2 + 1);
      };
      const comorbList: Array<[string, string]> = [
        ['Hipertensão arterial', dados.hipertensao_arterial],
        ['Precordialgia', dados.precordialgia],
        ['Palpitação', dados.palpitacao],
        ['Dispneia', dados.dispneia],
        ['Doença renal', dados.doenca_renal],
        ['IAM prévio', dados.iam_previo],
        ['Cateterismo prévio', dados.cateterismo_previo],
        ['AVC prévio', dados.avc_previo],
        ['Hipotireoidismo', dados.hipotireoidismo],
        ['Hipertireoidismo', dados.hipertireoidismo],
        ['Diabetes melitus', dados.diabetes_melitus],
        ['Uso anticoagulante/antiagregante', dados.uso_anticoagulante_antiagregante],
      ];
      let ci = 0;
      comorbList.forEach((c, idx) => {
        renderComorb(c[0], c[1], idx % 2, Math.floor(idx / 2));
        ci = Math.floor(idx / 2);
      });
      const obsY = y + (ci + 1) * (rowH + 2) + 2;
      doc.rect(startX, obsY, colW, rowH * 3);
      doc.text('Observações/Outras comorbidades', startX + 2, obsY + 4);
      if (dados.observacoes_outras_comorbidades) {
        const s = fitText(dados.observacoes_outras_comorbidades, colW - 6);
        doc.text(s, startX + 2, obsY + 8);
      }
      y = obsY + rowH * 3 + 6;
      ensureSpace(8 + (rowH + 2) * 4 + 12);
      doc.setFillColor(240, 240, 240);
      doc.setDrawColor(72, 128, 87);
      doc.rect(startX, y, colW, 6, 'FD');
      doc.setTextColor(72, 128, 87);
      doc.setFont('helvetica', 'bold');
      doc.text('MEDICAMENTOS DE USO CONTÍNUO', startX + 2, y + 4);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      y += 8;
      const medsRows = 4;
      const parsedMeds = (dados.medicamentos_uso_continuo || '')
        .split('\n')
        .slice(0, medsRows)
        .map(line => {
          const [nome, m, t, n] = line.split('|');
          return { nome: nome || '', m: m === '1', t: t === '1', n: n === '1' };
        });
      for (let i = 0; i < medsRows; i++) {
        const yy = y + i * (rowH + 2);
        const item = parsedMeds[i] || { nome: '', m: false, t: false, n: false };
        const medsRightW = 50;
        const medsLeftW = colW - medsRightW;
        doc.rect(startX, yy, medsLeftW, rowH);
        doc.text(item.nome || '', startX + 2, yy + rowH / 2 + 1);
        doc.rect(startX + medsLeftW, yy, medsRightW, rowH);
        const baseX = startX + medsLeftW + 2;
        drawCheck(baseX, yy + (rowH - 3) / 2, item.m, 3);
        doc.text('M', baseX + 3 + 2, yy + rowH / 2 + 1);
        const baseX2 = baseX + 3 + 2 + doc.getTextWidth('M') + 8;
        drawCheck(baseX2, yy + (rowH - 3) / 2, item.t, 3);
        doc.text('T', baseX2 + 3 + 2, yy + rowH / 2 + 1);
        const baseX3 = baseX2 + 3 + 2 + doc.getTextWidth('T') + 8;
        drawCheck(baseX3, yy + (rowH - 3) / 2, item.n, 3);
        doc.text('N', baseX3 + 3 + 2, yy + rowH / 2 + 1);
      }
      y += medsRows * (rowH + 2) + 6;
      ensureSpace(8 + (rowH + 2) * 3 + 18);
      doc.setFillColor(240, 240, 240);
      doc.setDrawColor(72, 128, 87);
      doc.rect(startX, y, colW, 6, 'FD');
      doc.setTextColor(72, 128, 87);
      doc.setFont('helvetica', 'bold');
      doc.text('EXAMES', startX + 2, y + 4);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      y += 8;
      const exGap = 3;
      // Linha 1: 9 campos simétricos
      const cellW9 = (colW - exGap * 8) / 9;
      let exX = startX;
      const exLabels1 = ['Hb','Ht','Plaq','Na','K','Ur','Cr','Glic.','HbA1c'];
      const exValues1 = [dados.hb,dados.ht,dados.plaq,dados.na,dados.k,dados.ur,dados.cr,dados.glicemia,dados.hba1c];
      exLabels1.forEach((lab, i) => {
        doc.rect(exX, y, cellW9, rowH);
        doc.text(lab, exX + 2, y + rowH / 2 + 1);
        const v = exValues1[i] || '';
        if (v) {
          const s = fitText(v, cellW9 - 6);
          doc.text(s, exX + cellW9 - 2, y + rowH / 2 + 1, { align: 'right' });
        }
        exX += cellW9 + exGap;
      });
      y += rowH + 2;
      // Linha 2: 3 campos pequenos + "Outros" ocupando o restante
      exX = startX;
      const smallWEx = cellW9; // manter mesma largura dos pequenos
      const labelsSmall = ['TAP','INR','KPTT'];
      const valuesSmall = [dados.tap,dados.inr,dados.kptt];
      labelsSmall.forEach((lab, i) => {
        doc.rect(exX, y, smallWEx, rowH);
        doc.text(lab, exX + 2, y + rowH / 2 + 1);
        const v = valuesSmall[i] || '';
        if (v) {
          const s = fitText(v, smallWEx - 6);
          doc.text(s, exX + smallWEx - 2, y + rowH / 2 + 1, { align: 'right' });
        }
        exX += smallWEx + exGap;
      });
      const outrosW = colW - (smallWEx * 3 + exGap * 3);
      doc.rect(exX, y, outrosW, rowH);
      doc.text('Outros', exX + 2, y + rowH / 2 + 1);
      if (dados.outros_exames) {
        const s = fitText(dados.outros_exames, outrosW - 6);
        doc.text(s, exX + outrosW - 2, y + rowH / 2 + 1, { align: 'right' });
      }
      y += rowH + 2;
      // Linha 3: ECG/ECO + Risco cardiológico, com gap (mais espaço para risco)
      const rightW = Math.round(colW * 0.35);
      const leftW = colW - rightW - exGap;
      doc.rect(startX, y, leftW, rowH);
      const ecgLabel = 'ECG/ECO';
      doc.text(ecgLabel, startX + 2, y + rowH / 2 + 1);
      const ecgLabelW = doc.getTextWidth(ecgLabel);
      const ecgValueX = startX + 2 + ecgLabelW + 6;
      print(dados.ecg_eco, ecgValueX, y + rowH / 2 + 1, leftW - (ecgValueX - startX) - 2);
      doc.rect(startX + leftW + exGap, y, rightW, rowH);
      doc.text('Risco cardiológico  [  ] Sim  [  ] Não', startX + leftW + exGap + 2, y + rowH / 2 + 1);
      y += rowH + 6;
      ensureSpace(8 + rowH * 2.5 + (rowH + 2) * 3 + 24);
      doc.setFillColor(240, 240, 240);
      doc.setDrawColor(72, 128, 87);
      doc.rect(startX, y, colW, 6, 'FD');
      doc.setTextColor(72, 128, 87);
      doc.setFont('helvetica', 'bold');
      doc.text('PARECER ANESTÉSICO', startX + 2, y + 4);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      y += 8;
      const leftBoxW = colW * 0.35 - 2;
      const cbSize = 3;
      const drawCheckbox = (xx: number, yy: number, checked: boolean) => {
        doc.rect(xx, yy, cbSize, cbSize);
        if (checked) {
          doc.line(xx + 0.7, yy + 1.6, xx + 1.5, yy + 2.4);
          doc.line(xx + 1.5, yy + 2.4, xx + 2.6, yy + 0.6);
        }
      };
      doc.rect(startX, y, leftBoxW, rowH);
      doc.text('Liberado para cirurgia', startX + 2, y + rowH / 2 + 1);
      drawCheckbox(startX + leftBoxW - cbSize - 2, y + (rowH - cbSize) / 2, dados.liberado_para_cirurgia === 'Sim');
      doc.rect(startX + colW * 0.35, y, colW * 0.65 - 2, rowH * 2.5);
      doc.text('Avaliações/Exames complementares', startX + colW * 0.35 + 2, y + 3);
      if (dados.avaliacoes_exames_complementares_texto) {
        const s = fitText(dados.avaliacoes_exames_complementares_texto, colW * 0.65 - 8);
        doc.text(s, startX + colW * 0.35 + 2, y + 14);
      }
      y += rowH + 2;
      doc.rect(startX, y, leftBoxW, rowH);
      doc.text('Avaliação com anestesiologista', startX + 2, y + rowH / 2 + 1);
      drawCheckbox(startX + leftBoxW - cbSize - 2, y + (rowH - cbSize) / 2, dados.avaliacao_com_anestesiologista === 'Sim');
      y += rowH + 2;
      doc.rect(startX, y, leftBoxW, rowH);
      doc.text('Avaliação/Exames complementares', startX + 2, y + rowH / 2 + 1);
      drawCheckbox(startX + leftBoxW - cbSize - 2, y + (rowH - cbSize) / 2, dados.avaliacao_exames_complementares === 'Sim');
      y += rowH + 2;
      doc.rect(startX, y, colW, rowH * 2.5);
      doc.text('Observações', startX + 2, y + 3);
      if (dados.observacoes_finais) {
        const s = fitText(dados.observacoes_finais, colW - 8);
        doc.text(s, startX + 2, y + 14);
      }
      y += rowH * 2.5 + 6;
      doc.text('Anestesiologista', startX, y);
      doc.text('Carimbo e assinatura', startX, y + 4);
      doc.text('Data: ____/____/______', pageW - margin - 50, y + 2);
      const pageCount = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i}/${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
      }
      const nomePaciente = (dados.nome_paciente || 'Paciente').replace(/\s+/g, '_');
      doc.save(`Triagem_Pre_Anestesica_${nomePaciente}.pdf`);
    } finally {
      setGerandoPDF(false);
    }
  };

  const setField = (k: keyof PreAnestesiaDados, v: string) => {
    setDados(prev => ({ ...prev, [k]: v }));
  };

  const save = async () => {
    setErro(null);
    setSalvando(true);
    try {
      await triagemPreAnestesicaService.saveOrUpdate(dados as any);
      onClose();
    } catch (e: any) {
      setErro(e.message || 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Triagem Pré Anestésica"
      size="fullscreen"
      titleClassName="text-red-700"
      headerActions={
        <button
          onClick={gerarPDF}
          disabled={gerandoPDF}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg border border-gray-300 transition-colors text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
          title={gerandoPDF ? 'Gerando PDF...' : 'Gerar PDF da Triagem'}
        >
          {gerandoPDF ? 'Gerando PDF...' : 'Gerar PDF'}
        </button>
      }
    >
      <div className="h-full w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="w-full h-full bg-transparent border-0 shadow-none">
          <div className="px-6 pt-6">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2">Identificação</div>
              <div className="p-4 grid grid-cols-12 gap-3 bg-white">
                <div className="col-span-4">
                  <label className="text-xs text-slate-600">Município</label>
                  <input className="w-full px-2 py-1 text-sm border rounded" value={dados.municipio} onChange={e => setField('municipio', e.target.value)} />
                </div>
                <div className="col-span-4">
                  <label className="text-xs text-slate-600">Unidade</label>
                  <input className="w-full px-2 py-1 text-sm border rounded bg-slate-100" value={dados.unidade_hospitalar} readOnly />
                </div>
                <div className="col-span-4">
                  <label className="text-xs text-slate-600">Data de nascimento</label>
                  <input className="w-full px-2 py-1 text-sm border rounded" value={dados.data_nascimento} onChange={e => setField('data_nascimento', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-600">Idade</label>
                  <input className="w-full px-2 py-1 text-sm border rounded" value={dados.idade} onChange={e => setField('idade', e.target.value)} />
                </div>
                <div className="col-span-6">
                  <label className="text-xs text-slate-600">Nome</label>
                  <input className="w-full px-2 py-1 text-sm border rounded" value={dados.nome_paciente} onChange={e => setField('nome_paciente', e.target.value)} />
                </div>
                <div className="col-span-4">
                  <label className="text-xs text-slate-600">Procedimento(s)</label>
                  <input className="w-full px-2 py-1 text-sm border rounded" value={dados.procedimento_s} onChange={e => setField('procedimento_s', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-600">Sexo</label>
                  <div className="flex items-center gap-3 px-2 py-1 border rounded">
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="sexo" checked={dados.sexo === 'F'} onChange={() => setField('sexo', 'F')} />F</label>
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="sexo" checked={dados.sexo === 'M'} onChange={() => setField('sexo', 'M')} />M</label>
                  </div>
                </div>
                <div className="col-span-12">
                  <label className="text-xs text-slate-600">Cirurgião</label>
                  <input className="w-full px-2 py-1 text-sm border rounded" value={dados.cirurgiao} onChange={e => setField('cirurgiao', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 mt-4 relative z-10">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2">Informações Prévias</div>
              <div className="p-4 grid grid-cols-12 gap-3 bg-white">
                <div className="col-span-6">
                  <label className="text-xs text-slate-600">Cirurgias prévias</label>
                  <input className="w-full px-2 py-1 text-sm border rounded" value={dados.cirurgias_previas} onChange={e => setField('cirurgias_previas', e.target.value)} />
                </div>
                <div className="col-span-6">
                  <label className="text-xs text-slate-600">Intercorrências anestésicas</label>
                  <div className="flex items-center gap-4 px-2 py-1 border rounded">
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="interc" checked={dados.intercorrencias_anestesicas === 'Sim'} onChange={() => setField('intercorrencias_anestesicas', 'Sim')} />Sim</label>
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="interc" checked={dados.intercorrencias_anestesicas === 'Não'} onChange={() => setField('intercorrencias_anestesicas', 'Não')} />Não</label>
                  </div>
                </div>
                <div className="col-span-6">
                  <label className="text-xs text-slate-600">Alergias</label>
                  <div className="flex items-center gap-4 px-2 py-1 border rounded">
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="alergias" checked={dados.alergias === 'Sim'} onChange={() => setField('alergias', 'Sim')} />Sim</label>
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="alergias" checked={dados.alergias === 'Não'} onChange={() => setField('alergias', 'Não')} />Não</label>
                  </div>
                </div>
                <div className="col-span-6">
                  <label className="text-xs text-slate-600">Tabagismo</label>
                  <div className="flex items-center gap-4 px-2 py-1 border rounded">
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="tabagismo" checked={dados.tabagismo === 'Sim'} onChange={() => setField('tabagismo', 'Sim')} />Sim</label>
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="tabagismo" checked={dados.tabagismo === 'Não'} onChange={() => setField('tabagismo', 'Não')} />Não</label>
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="tabagismo" checked={dados.tabagismo === 'Ex-tabagista'} onChange={() => setField('tabagismo', 'Ex-tabagista')} />Ex-tabagista</label>
                  </div>
                </div>
                <div className="col-span-6">
                  <label className="text-xs text-slate-600">Etilismo</label>
                  <div className="flex items-center gap-4 px-2 py-1 border rounded">
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="etilismo" checked={dados.etilismo === 'Sim'} onChange={() => setField('etilismo', 'Sim')} />Sim</label>
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="etilismo" checked={dados.etilismo === 'Não'} onChange={() => setField('etilismo', 'Não')} />Não</label>
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="etilismo" checked={dados.etilismo === 'Ex-etilista'} onChange={() => setField('etilismo', 'Ex-etilista')} />Ex-etilista</label>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-600">Peso (kg)</label>
                  <input className="w-full px-2 py-1 text-sm border rounded" value={dados.peso_kg} onChange={e => setField('peso_kg', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-600">Altura (cm)</label>
                  <input className="w-full px-2 py-1 text-sm border rounded" value={dados.altura_cm} onChange={e => setField('altura_cm', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-600">IMC (kg/m²)</label>
                  <input className="w-full px-2 py-1 text-sm border rounded" value={dados.imc_kg_m2} onChange={e => setField('imc_kg_m2', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 mt-4">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2">Comorbidades</div>
              <div className="p-4 grid grid-cols-12 gap-3 bg-white">
              {(() => {
                const itens = [
                  ['Hipertensão arterial','hipertensao_arterial'],
                  ['Precordialgia','precordialgia'],
                  ['Palpitação','palpitacao'],
                  ['Dispneia','dispneia'],
                  ['Doença renal','doenca_renal'],
                  ['IAM prévio','iam_previo'],
                  ['Cateterismo prévio','cateterismo_previo'],
                  ['AVC prévio','avc_previo'],
                  ['Hipotireoidismo','hipotireoidismo'],
                  ['Hipertireoidismo','hipertireoidismo'],
                  ['Diabetes melitus','diabetes_melitus'],
                  ['Uso anticoagulante/antiagregante','uso_anticoagulante_antiagregante'],
                ] as const;
                return itens.map(([label,key]) => (
                  <div key={key} className="col-span-6">
                    <div className="text-xs text-slate-700">{label}</div>
                    <div className="flex items-center gap-4 px-2 py-1 border rounded">
                      <label className="flex items-center gap-1 text-sm"><input type="radio" name={String(key)} checked={(dados as any)[key] === 'Sim'} onChange={() => setField(key as keyof PreAnestesiaDados, 'Sim')} />Sim</label>
                      <label className="flex items-center gap-1 text-sm"><input type="radio" name={String(key)} checked={(dados as any)[key] === 'Não'} onChange={() => setField(key as keyof PreAnestesiaDados, 'Não')} />Não</label>
                    </div>
                  </div>
                ));
              })()}
              <div className="col-span-6">
                <div className="text-xs text-slate-700">Observações/Outras comorbidades</div>
                <textarea className="w-full px-2 py-1 text-sm border rounded h-20" value={dados.observacoes_outras_comorbidades} onChange={e => setField('observacoes_outras_comorbidades', e.target.value)} />
              </div>
              <div className="col-span-6">
                <div className="text-xs text-slate-700">Medicamentos de uso contínuo</div>
                <div className="space-y-2">
                  {meds.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        className="flex-1 px-2 py-1 text-sm border rounded"
                        placeholder={`Medicamento ${idx + 1}`}
                        value={m.nome}
                        onChange={e => {
                          const mm = meds.slice();
                          mm[idx] = { ...mm[idx], nome: e.target.value };
                          setMeds(mm);
                          syncMedsToDados(mm);
                        }}
                      />
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={m.m}
                          onChange={e => {
                            const mm = meds.slice();
                            mm[idx] = { ...mm[idx], m: e.target.checked };
                            setMeds(mm);
                            syncMedsToDados(mm);
                          }}
                        />
                        M
                      </label>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={m.t}
                          onChange={e => {
                            const mm = meds.slice();
                            mm[idx] = { ...mm[idx], t: e.target.checked };
                            setMeds(mm);
                            syncMedsToDados(mm);
                          }}
                        />
                        T
                      </label>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={m.n}
                          onChange={e => {
                            const mm = meds.slice();
                            mm[idx] = { ...mm[idx], n: e.target.checked };
                            setMeds(mm);
                            syncMedsToDados(mm);
                          }}
                        />
                        N
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>

          <div className="px-6 mt-4">
            <div className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-t-lg px-3 py-2">Exames</div>
            <div className="border border-slate-200 border-t-0 p-4 grid grid-cols-12 gap-3 items-end">
              {['hb','ht','plaq','na','k','ur','cr','glicemia','hba1c','tap','inr','kptt'].map((k) => (
                <div key={k} className="col-span-2">
                  <label className="text-xs text-slate-600 uppercase">{k}</label>
                  <input className="w-full px-2 py-1 text-sm border rounded" value={(dados as any)[k]} onChange={e => setField(k as keyof PreAnestesiaDados, e.target.value)} />
                </div>
              ))}
              <div className="col-span-12">
                <label className="text-xs text-slate-600">Outros</label>
                <input className="w-full px-2 py-1 text-sm border rounded" value={dados.outros_exames} onChange={e => setField('outros_exames', e.target.value)} />
              </div>
              <div className="col-span-10">
                <label className="text-xs text-slate-600">ECG/ECO</label>
                <input className="w-full px-2 py-1 text-sm border rounded" value={dados.ecg_eco} onChange={e => setField('ecg_eco', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-600">Risco cardiológico</label>
                <div className="flex items-center gap-3 px-2 py-1 border rounded">
                  <label className="flex items-center gap-1 text-sm"><input type="radio" name="risco" checked={dados.risco_cardiologico === 'Sim'} onChange={() => setField('risco_cardiologico', 'Sim')} />Sim</label>
                  <label className="flex items-center gap-1 text-sm"><input type="radio" name="risco" checked={dados.risco_cardiologico === 'Não'} onChange={() => setField('risco_cardiologico', 'Não')} />Não</label>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 mt-4">
            <div className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-t-lg px-3 py-2">Parecer Anestésico</div>
            <div className="border border-slate-200 border-t-0 p-4 grid grid-cols-12 gap-3">
              <div className="col-span-12 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dados.liberado_para_cirurgia === 'Sim'} onChange={(e) => setField('liberado_para_cirurgia', e.target.checked ? 'Sim' : 'Não')} />Liberado para cirurgia</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dados.avaliacao_com_anestesiologista === 'Sim'} onChange={(e) => setField('avaliacao_com_anestesiologista', e.target.checked ? 'Sim' : 'Não')} />Avaliação com anestesiologista</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dados.avaliacao_exames_complementares === 'Sim'} onChange={(e) => setField('avaliacao_exames_complementares', e.target.checked ? 'Sim' : 'Não')} />Avaliação/Exames complementares</label>
              </div>
              <div className="col-span-6">
                <label className="text-xs text-slate-600">Avaliações/Exames complementares</label>
                <textarea className="w-full px-2 py-1 text-sm border rounded h-24" value={dados.avaliacoes_exames_complementares_texto} onChange={e => setField('avaliacoes_exames_complementares_texto', e.target.value)} />
              </div>
              <div className="col-span-6">
                <label className="text-xs text-slate-600">Observações</label>
                <textarea className="w-full px-2 py-1 text-sm border rounded h-24" value={dados.observacoes_finais} onChange={e => setField('observacoes_finais', e.target.value)} />
              </div>
              <div className="col-span-8">
                <label className="text-xs text-slate-600">Anestesiologista (assinatura)</label>
                <input className="w-full px-2 py-1 text-sm border rounded" value={dados.anestesiologista_assinatura} onChange={e => setField('anestesiologista_assinatura', e.target.value)} />
              </div>
              <div className="col-span-4">
                <label className="text-xs text-slate-600">Data</label>
                <input className="w-full px-2 py-1 text-sm border rounded" value={dados.data_parecer} onChange={e => setField('data_parecer', e.target.value)} />
              </div>
            </div>
          </div>

          {erro && <div className="px-6 py-2 text-sm text-red-600">{erro}</div>}

          <div className="px-6 py-4 mt-4 flex justify-end gap-2 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
            <button onClick={save} disabled={salvando} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
