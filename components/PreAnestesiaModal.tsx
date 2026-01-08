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

  useEffect(() => {
    const d: Partial<PreAnestesiaDados> = { ...initial };
    if (d.data_nascimento) d.data_nascimento = formatDate(String(d.data_nascimento));
    if (d.idade && !String(d.idade).includes('anos')) d.idade = `${d.idade} anos`;
    setDados(prev => ({ ...prev, ...d }));
  }, [initial]);

  useEffect(() => {
    if (hospitalSelecionado?.nome) {
      setDados(prev => ({
        ...prev,
        unidade_hospitalar: prev.unidade_hospitalar || hospitalSelecionado.nome
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
      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - bottomMargin) {
          doc.addPage();
          y = margin + 6;
          doc.setTextColor(200, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16);
          doc.text('Triagem Pré Anestésica', startX, y);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          y += 6;
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
      doc.setTextColor(200, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Triagem Pré Anestésica', startX, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const municipioW = 65;
      doc.text('Município', pageW - margin - municipioW + 2, y - 4);
      doc.setDrawColor(180, 180, 180);
      doc.rect(pageW - margin - municipioW, y - 8, municipioW, 8);
      print(dados.municipio, pageW - margin - municipioW + 20, y - 2, municipioW - 22);
      y += 8;
      const hospNome = dados.unidade_hospitalar || hospitalSelecionado?.nome || '';
      doc.setTextColor(200, 0, 0);
      doc.text('Unidade:', startX, y);
      doc.setTextColor(0, 0, 0);
      doc.text(hospNome ? ` ${hospNome}` : ' ___________________________', startX + 16, y);
      y += 6;
      const rowH = 8;
      const colW = (pageW - margin * 2);
      const c1 = colW * 0.55;
      const c2 = colW * 0.25;
      const c3 = colW * 0.2;
      doc.rect(startX, y, c1, rowH);
      doc.text('Nome', startX + 2, y + 3);
      print(dados.nome_paciente, startX + 30, y + 3, c1 - 34);
      doc.rect(startX + c1, y, c2, rowH);
      doc.text('Data de nascimento', startX + c1 + 2, y + 3);
      print(dados.data_nascimento, startX + c1 + 40, y + 3, c2 - 44);
      doc.rect(startX + c1 + c2, y, c3, rowH);
      doc.text('Idade', startX + c1 + c2 + 2, y + 3);
      print(dados.idade, startX + c1 + c2 + 17, y + 3, c3 - 20);
      y += rowH + 2;
      const sexoW = 26;
      const cirW = 60;
      doc.rect(startX, y, colW - sexoW - cirW, rowH);
      doc.text('Procedimento(s)', startX + 2, y + 3);
      print(dados.procedimento_s, startX + 40, y + 3, colW - sexoW - cirW - 44);
      doc.rect(startX + colW - sexoW - cirW, y, sexoW, rowH);
      doc.text('Sexo: F / M', startX + colW - sexoW - cirW + 2, y + 3);
      doc.rect(startX + colW - cirW, y, cirW, rowH);
      doc.text('Cirurgião', startX + colW - cirW + 2, y + 3);
      print(dados.cirurgiao, startX + colW - cirW + 22, y + 3, cirW - 24);
      y += rowH + 2;
      doc.rect(startX, y, colW * 0.5 - 2, rowH);
      doc.text('Cirurgias prévias', startX + 2, y + 3);
      print(dados.cirurgias_previas, startX + 40, y + 3, colW * 0.5 - 46);
      doc.rect(startX + colW * 0.5, y, colW * 0.5 - 2, rowH);
      doc.text('Intercorrências anestésicas  [  ] Sim  [  ] Não', startX + colW * 0.5 + 2, y + 3);
      y += rowH + 2;
      doc.rect(startX, y, colW * 0.5 - 2, rowH);
      doc.text('Alergias  [  ] Sim  [  ] Não', startX + 2, y + 3);
      doc.rect(startX + colW * 0.5, y, colW * 0.5 - 2, rowH);
      doc.text('Tabagismo  [  ] Sim  [  ] Não  [  ] Ex-tabagista', startX + colW * 0.5 + 2, y + 3);
      y += rowH + 2;
      doc.rect(startX, y, colW * 0.5 - 2, rowH);
      doc.text('Etilismo  [  ] Sim  [  ] Não  [  ] Ex-etilista', startX + 2, y + 3);
      const smallW = (colW * 0.5 - 2) / 3;
      doc.rect(startX + colW * 0.5, y, smallW, rowH);
      doc.text('Peso (kg)', startX + colW * 0.5 + 2, y + 3);
      print(dados.peso_kg, startX + colW * 0.5 + 22, y + 3, smallW - 24);
      doc.rect(startX + colW * 0.5 + smallW, y, smallW, rowH);
      doc.text('Altura (cm)', startX + colW * 0.5 + smallW + 2, y + 3);
      print(dados.altura_cm, startX + colW * 0.5 + smallW + 25, y + 3, smallW - 27);
      doc.rect(startX + colW * 0.5 + smallW * 2, y, smallW, rowH);
      doc.text('IMC (kg/m²)', startX + colW * 0.5 + smallW * 2 + 2, y + 3);
      print(dados.imc_kg_m2, startX + colW * 0.5 + smallW * 2 + 26, y + 3, smallW - 28);
      y += rowH + 4;
      ensureSpace(8 + (rowH + 2) * 4 + rowH * 2.5 + 18);
      doc.setFillColor(240, 240, 240);
      doc.setDrawColor(200, 0, 0);
      doc.rect(startX, y, colW, 6, 'FD');
      doc.setTextColor(200, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('COMORBIDADES', startX + 2, y + 4);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      y += 8;
      const itemW = colW / 3 - 3;
      const renderComorb = (label: string, value: string, ix: number, iy: number) => {
        const x = startX + ix * (itemW + 3);
        const yy = y + iy * (rowH + 2);
        doc.rect(x, yy, itemW, rowH);
        const lbl = fitText(label, itemW - 46);
        doc.text(`${lbl}   [  ] Sim   [  ] Não`, x + 2, yy + 3);
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
        renderComorb(c[0], c[1], idx % 3, Math.floor(idx / 3));
        ci = Math.floor(idx / 3);
      });
      const obsY = y + (ci + 1) * (rowH + 2) + 2;
      doc.rect(startX, obsY, itemW * 1.5 + 1.5, rowH * 2.5);
      doc.text('Observações/Outras comorbidades', startX + 2, obsY + 4);
      if (dados.observacoes_outras_comorbidades) {
        const s = fitText(dados.observacoes_outras_comorbidades, itemW * 1.5 - 6);
        doc.text(s, startX + 2, obsY + 8);
      }
      doc.rect(startX + itemW * 1.5 + 3, obsY, itemW * 1.5 + 1.5, rowH * 2.5);
      doc.text('Medicamentos de uso contínuo', startX + itemW * 1.5 + 5, obsY + 4);
      if (dados.medicamentos_uso_continuo) {
        const s = fitText(dados.medicamentos_uso_continuo, itemW * 1.5 - 10);
        doc.text(s, startX + itemW * 1.5 + 5, obsY + 8);
      }
      y = obsY + rowH * 2.5 + 6;
      ensureSpace(8 + (rowH + 2) * 3 + 18);
      doc.setFillColor(240, 240, 240);
      doc.setDrawColor(200, 0, 0);
      doc.rect(startX, y, colW, 6, 'FD');
      doc.setTextColor(200, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('EXAMES', startX + 2, y + 4);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      y += 8;
      const exRow = (labels: string[], values: string[], yy: number) => {
        let x = startX;
        labels.forEach((lab, i) => {
          doc.rect(x, yy, 18, rowH);
          doc.text(lab, x + 2, yy + 3);
          const v = values[i] || '';
          if (v) {
            const s = fitText(v, 14);
            doc.text(s, x + 16, yy + 3, { align: 'right' });
          }
          x += 20;
        });
      };
      exRow(['Hb','Ht','Plaq','Na','K','Ur','Cr','Glicemia','HbA1c'], [dados.hb,dados.ht,dados.plaq,dados.na,dados.k,dados.ur,dados.cr,dados.glicemia,dados.hba1c], y);
      y += rowH + 2;
      exRow(['TAP','INR','KPTT','Outros'], [dados.tap,dados.inr,dados.kptt,dados.outros_exames], y);
      y += rowH + 2;
      doc.rect(startX, y, colW * 0.7 - 2, rowH);
      doc.text('ECG/ECO', startX + 2, y + 3);
      print(dados.ecg_eco, startX + 28, y + 3, colW * 0.7 - 32);
      doc.rect(startX + colW * 0.7, y, colW * 0.3 - 2, rowH);
      doc.text('Risco cardiológico  [  ] Sim  [  ] Não', startX + colW * 0.7 + 2, y + 3);
      y += rowH + 6;
      ensureSpace(8 + rowH * 2.5 + (rowH + 2) * 3 + 24);
      doc.setFillColor(240, 240, 240);
      doc.setDrawColor(200, 0, 0);
      doc.rect(startX, y, colW, 6, 'FD');
      doc.setTextColor(200, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('PARECER ANESTÉSICO', startX + 2, y + 4);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      y += 8;
      doc.rect(startX, y, colW * 0.35 - 2, rowH);
      doc.text('Liberado para cirurgia', startX + 2, y + 3);
      print(dados.liberado_para_cirurgia, startX + 45, y + 3, colW * 0.35 - 50);
      doc.rect(startX + colW * 0.35, y, colW * 0.65 - 2, rowH * 2.5);
      doc.text('Avaliações/Exames complementares', startX + colW * 0.35 + 2, y + 3);
      if (dados.avaliacoes_exames_complementares_texto) {
        const s = fitText(dados.avaliacoes_exames_complementares_texto, colW * 0.65 - 8);
        doc.text(s, startX + colW * 0.35 + 2, y + 7);
      }
      y += rowH + 2;
      doc.rect(startX, y, colW * 0.35 - 2, rowH);
      doc.text('Avaliação com anestesiologista', startX + 2, y + 3);
      print(dados.avaliacao_com_anestesiologista, startX + 60, y + 3, colW * 0.35 - 64);
      y += rowH + 2;
      doc.rect(startX, y, colW * 0.35 - 2, rowH);
      doc.text('Avaliação/Exames complementares', startX + 2, y + 3);
      print(dados.avaliacao_exames_complementares, startX + 70, y + 3, colW * 0.35 - 74);
      y += rowH + 2;
      doc.rect(startX, y, colW, rowH * 2.5);
      doc.text('Observações', startX + 2, y + 3);
      if (dados.observacoes_finais) {
        const s = fitText(dados.observacoes_finais, colW - 8);
        doc.text(s, startX + 2, y + 7);
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
      await triagemPreAnestesicaService.create(dados);
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
        <div className="w-full h-full bg-white/95 backdrop-blur-sm border border-slate-200 rounded-none shadow-xl">
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Município</span>
                <input className="px-2 py-1 text-sm border rounded w-40" value={dados.municipio} onChange={e => setField('municipio', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3 mt-4">
              <div className="col-span-6">
                <label className="text-xs text-slate-600">Unidade</label>
                <input className="w-full px-2 py-1 text-sm border rounded" value={dados.unidade_hospitalar} onChange={e => setField('unidade_hospitalar', e.target.value)} />
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
              <div className="col-span-6">
                <label className="text-xs text-slate-600">Cirurgião</label>
                <input className="w-full px-2 py-1 text-sm border rounded" value={dados.cirurgiao} onChange={e => setField('cirurgiao', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200" />

          <div className="px-6 py-4 grid grid-cols-12 gap-3">
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

          <div className="px-6">
            <div className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-t-lg px-3 py-2">Comorbidades</div>
            <div className="border border-slate-200 border-t-0 p-4 grid grid-cols-12 gap-3">
              {[
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
              ].map(([label,key]) => (
                <div key={key} className="col-span-4">
                  <div className="text-xs text-slate-700">{label}</div>
                  <div className="flex items-center gap-4 px-2 py-1 border rounded">
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name={String(key)} checked={(dados as any)[key] === 'Sim'} onChange={() => setField(key as keyof PreAnestesiaDados, 'Sim')} />Sim</label>
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name={String(key)} checked={(dados as any)[key] === 'Não'} onChange={() => setField(key as keyof PreAnestesiaDados, 'Não')} />Não</label>
                  </div>
                </div>
              ))}
              <div className="col-span-6">
                <div className="text-xs text-slate-700">Observações/Outras comorbidades</div>
                <textarea className="w-full px-2 py-1 text-sm border rounded h-20" value={dados.observacoes_outras_comorbidades} onChange={e => setField('observacoes_outras_comorbidades', e.target.value)} />
              </div>
              <div className="col-span-6">
                <div className="text-xs text-slate-700">Medicamentos de uso contínuo</div>
                <textarea className="w-full px-2 py-1 text-sm border rounded h-20" value={dados.medicamentos_uso_continuo} onChange={e => setField('medicamentos_uso_continuo', e.target.value)} />
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

          <div className="px-6 py-4 flex justify-end gap-2 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
            <button onClick={save} disabled={salvando} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
