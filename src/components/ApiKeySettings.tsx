import { ADVISOR_MODELS } from "../lib/advisor";

interface Props {
  apiKey: string;
  onApiKey: (k: string) => void;
  model: string;
  onModel: (m: string) => void;
  remember: boolean;
  onRemember: (b: boolean) => void;
}

export function ApiKeySettings({ apiKey, onApiKey, model, onModel, remember, onRemember }: Props) {
  return (
    <div className="panel">
      <h2>Consultor de IA — sua chave</h2>
      <p className="muted" style={{ marginTop: 0, fontSize: "0.82rem" }}>
        A chave é usada para chamar a Claude API <strong>direto do seu navegador</strong> e fica somente aqui —
        nunca é enviada a nenhum servidor nosso nem ao repositório.
      </p>
      <div className="field">
        <label>Chave da Claude API</label>
        <input type="password" value={apiKey} placeholder="sk-ant-..." onChange={(e) => onApiKey(e.target.value)} />
      </div>
      <div className="row">
        <div className="field">
          <label>Modelo</label>
          <select value={model} onChange={(e) => onModel(e.target.value)}>
            {ADVISOR_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>
      <label style={{ fontSize: "0.82rem", display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" style={{ width: "auto" }} checked={remember} onChange={(e) => onRemember(e.target.checked)} />
        Lembrar a chave neste navegador (localStorage)
      </label>
    </div>
  );
}
