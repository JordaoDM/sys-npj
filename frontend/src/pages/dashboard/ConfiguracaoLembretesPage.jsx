import React, { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { configuracaoLembreteService } from '@/api/services';
import { toastService } from '@/services/toastService';
import Button from '@/components/common/Button';
import Loader from '@/components/layout/Loader';
import ConfirmDialog from '@/components/common/ConfirmDialog';

const MULTIPLICADORES = { minutos: 1, horas: 60, dias: 1440 };

function horarioParaFormulario(horario) {
  return String(horario || '08:00').slice(0, 5);
}

function decomporAntecedencia(minutos) {
  const total = Number(minutos) || 60;
  if (total % 1440 === 0) return { valor: total / 1440, unidade: 'dias' };
  if (total % 60 === 0) return { valor: total / 60, unidade: 'horas' };
  return { valor: total, unidade: 'minutos' };
}

function Switch({ name, checked, onChange, label, description }) {
  return (
    <label
      htmlFor={name}
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        cursor: 'pointer',
      }}
    >
      <input
        id={name}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ width: 20, height: 20, marginTop: 2, accentColor: '#0066cc' }}
      />
      <span>
        <span style={{ display: 'block', color: '#212529', fontWeight: 600 }}>{label}</span>
        <span style={{ display: 'block', color: '#6c757d', fontSize: 13, marginTop: 3 }}>{description}</span>
      </span>
    </label>
  );
}

export default function ConfiguracaoLembretesPage() {
  const { token } = useAuthContext();
  const [configuracao, setConfiguracao] = useState(null);
  const [original, setOriginal] = useState(null);
  const [antecedencia, setAntecedencia] = useState({ valor: 1, unidade: 'horas' });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmarRestauracao, setConfirmarRestauracao] = useState(false);

  const aplicarResposta = (dados) => {
    const normalizada = {
      ...dados,
      horario_lembrete_dia: horarioParaFormulario(dados.horario_lembrete_dia),
    };
    setConfiguracao(normalizada);
    setOriginal(normalizada);
    setAntecedencia(decomporAntecedencia(dados.antecedencia_minutos));
  };

  const carregar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const response = await configuracaoLembreteService.obter(token);
      aplicarResposta(response.data);
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar as configurações.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [token]);

  const antecedenciaMinutos = useMemo(
    () => Number(antecedencia.valor) * MULTIPLICADORES[antecedencia.unidade],
    [antecedencia],
  );

  const alterado = useMemo(() => {
    if (!configuracao || !original) return false;
    return JSON.stringify({ ...configuracao, antecedencia_minutos: antecedenciaMinutos }) !==
      JSON.stringify(original);
  }, [configuracao, original, antecedenciaMinutos]);

  const validar = () => {
    if (!Number.isInteger(antecedenciaMinutos) || antecedenciaMinutos < 1 || antecedenciaMinutos > 10080) {
      return 'A antecedência deve estar entre 1 minuto e 7 dias.';
    }
    if (configuracao.lembrete_24h_ativo && configuracao.lembrete_antecipado_ativo && antecedenciaMinutos === 1440) {
      return 'O lembrete antecipado não pode repetir o lembrete de 24 horas.';
    }
    return '';
  };

  const salvar = async (event) => {
    event.preventDefault();
    const mensagem = validar();
    if (mensagem) {
      setErro(mensagem);
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      const response = await configuracaoLembreteService.atualizar(token, {
        lembrete_24h_ativo: configuracao.lembrete_24h_ativo,
        lembrete_dia_ativo: configuracao.lembrete_dia_ativo,
        horario_lembrete_dia: configuracao.horario_lembrete_dia,
        lembrete_antecipado_ativo: configuracao.lembrete_antecipado_ativo,
        antecedencia_minutos: antecedenciaMinutos,
        fuso_horario: configuracao.fuso_horario,
      });
      aplicarResposta(response.data);
      toastService.success('Configurações de lembretes salvas com sucesso!');
    } catch (error) {
      setErro(error.message || 'Não foi possível salvar as configurações.');
    } finally {
      setSalvando(false);
    }
  };

  const restaurar = async () => {
    setConfirmarRestauracao(false);
    setSalvando(true);
    setErro('');
    try {
      const response = await configuracaoLembreteService.restaurarPadrao(token);
      aplicarResposta(response.data);
      toastService.success('Configurações padrão restauradas!');
    } catch (error) {
      setErro(error.message || 'Não foi possível restaurar as configurações.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <Loader message="Carregando configurações de lembretes" />;

  if (!configuracao) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div role="alert" style={{ padding: 18, borderRadius: 8, background: '#f8d7da', color: '#842029' }}>{erro}</div>
        <Button onClick={carregar} style={{ marginTop: 16 }}>Tentar novamente</Button>
      </div>
    );
  }

  const inputStyle = {
    height: 42,
    padding: '0 12px',
    border: '1px solid #ced4da',
    borderRadius: 6,
    background: '#fff',
    color: '#212529',
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#212529', fontSize: 26 }}>Configurações de lembretes</h1>
        <p style={{ margin: '8px 0 0', color: '#6c757d' }}>
          Defina quando o sistema deverá avisar os participantes dos agendamentos.
        </p>
      </div>

      {erro && (
        <div role="alert" style={{ marginBottom: 18, padding: 14, border: '1px solid #f1aeb5', borderRadius: 8, background: '#f8d7da', color: '#842029' }}>
          {erro}
        </div>
      )}

      <form onSubmit={salvar}>
        <section style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: 10, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <h2 style={{ margin: '0 0 22px', fontSize: 18, color: '#343a40' }}>Momentos de envio</h2>

          <div style={{ paddingBottom: 20, borderBottom: '1px solid #e9ecef' }}>
            <Switch
              name="lembrete_24h_ativo"
              checked={configuracao.lembrete_24h_ativo}
              onChange={(e) => setConfiguracao({ ...configuracao, lembrete_24h_ativo: e.target.checked })}
              label="24 horas antes"
              description="Envia um aviso quando faltarem até 24 horas para o agendamento."
            />
          </div>

          <div style={{ padding: '20px 0', borderBottom: '1px solid #e9ecef' }}>
            <Switch
              name="lembrete_dia_ativo"
              checked={configuracao.lembrete_dia_ativo}
              onChange={(e) => setConfiguracao({ ...configuracao, lembrete_dia_ativo: e.target.checked })}
              label="No dia do agendamento"
              description="Envia um aviso pela manhã, no horário definido abaixo."
            />
            <div style={{ margin: '16px 0 0 34px' }}>
              <label htmlFor="horario_lembrete_dia" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Horário</label>
              <input
                id="horario_lembrete_dia"
                name="horario_lembrete_dia"
                type="time"
                value={configuracao.horario_lembrete_dia}
                disabled={!configuracao.lembrete_dia_ativo || salvando}
                onChange={(e) => setConfiguracao({ ...configuracao, horario_lembrete_dia: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div style={{ paddingTop: 20 }}>
            <Switch
              name="lembrete_antecipado_ativo"
              checked={configuracao.lembrete_antecipado_ativo}
              onChange={(e) => setConfiguracao({ ...configuracao, lembrete_antecipado_ativo: e.target.checked })}
              label="Lembrete antecipado"
              description="Define uma antecedência adicional para o aviso."
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '16px 0 0 34px' }}>
              <div>
                <label htmlFor="antecedencia_valor" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Antecedência</label>
                <input
                  id="antecedencia_valor"
                  name="antecedencia_valor"
                  type="number"
                  min="1"
                  step="1"
                  value={antecedencia.valor}
                  disabled={!configuracao.lembrete_antecipado_ativo || salvando}
                  onChange={(e) => setAntecedencia({ ...antecedencia, valor: e.target.value })}
                  style={{ ...inputStyle, width: 120 }}
                  required
                />
              </div>
              <div>
                <label htmlFor="antecedencia_unidade" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Unidade</label>
                <select
                  id="antecedencia_unidade"
                  name="antecedencia_unidade"
                  value={antecedencia.unidade}
                  disabled={!configuracao.lembrete_antecipado_ativo || salvando}
                  onChange={(e) => setAntecedencia({ ...antecedencia, unidade: e.target.value })}
                  style={{ ...inputStyle, minWidth: 130 }}
                >
                  <option value="minutos">minutos</option>
                  <option value="horas">horas</option>
                  <option value="dias">dias</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 18, padding: 20, background: '#e7f1ff', border: '1px solid #b6d4fe', borderRadius: 10 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16, color: '#084298' }}>Destinatários</h2>
          <p style={{ margin: 0, color: '#495057', lineHeight: 1.55, fontSize: 14 }}>
            Os lembretes são enviados ao criador, ao e-mail de lembrete informado e aos convidados que aceitaram. Endereços repetidos são enviados apenas uma vez.
          </p>
          <p style={{ margin: '10px 0 0', color: '#495057', fontSize: 14 }}>
            <strong>Fuso horário:</strong> Brasília ({configuracao.fuso_horario})
          </p>
        </section>

        <section style={{ marginTop: 18, padding: 18, background: '#fff', border: '1px solid #dee2e6', borderRadius: 10, color: '#6c757d', fontSize: 13 }}>
          {configuracao.alteradoPor ? (
            <span>
              Última alteração por <strong style={{ color: '#343a40' }}>{configuracao.alteradoPor.nome}</strong>
              {configuracao.updated_at && ` em ${new Date(configuracao.updated_at).toLocaleString('pt-BR')}`}.
            </span>
          ) : (
            <span>A configuração ainda utiliza os valores iniciais do sistema.</span>
          )}
        </section>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 12, marginTop: 22 }}>
          <Button type="button" variant="outline" disabled={salvando} onClick={() => setConfirmarRestauracao(true)}>
            Restaurar padrões
          </Button>
          <Button type="submit" disabled={salvando || !alterado}>
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmarRestauracao}
        title="Restaurar configurações?"
        message="Os lembretes voltarão para 24 horas antes, no dia às 08:00 e 1 hora antes."
        onCancel={() => setConfirmarRestauracao(false)}
        onConfirm={restaurar}
      />
    </div>
  );
}
