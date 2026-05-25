// Baixa Modal — confirma valor real, data, observação, comprovante
// Exposes: window.BaixaModal

(function () {
  const { useState, useEffect, useRef } = React;

  function BaixaModal({ entry, today, onClose, onSave }) {
    const [amount, setAmount] = useState(formatInput(entry.amount));
    const [date, setDate] = useState(toInputDate(entry.date < today ? entry.date : today));
    const [note, setNote] = useState(entry.note || '');
    const [attachment, setAttachment] = useState(entry.attachment || null);
    const inputRef = useRef(null);
    const fileRef = useRef(null);

    useEffect(() => {
      setTimeout(() => inputRef.current && inputRef.current.select(), 50);
      function esc(e) { if (e.key === 'Escape') onClose(); }
      window.addEventListener('keydown', esc);
      return () => window.removeEventListener('keydown', esc);
    }, []);

    function save() {
      const paid = PPx.parseAmountInput(amount);
      const [y, m, d] = date.split('-').map(Number);
      onSave({
        paid,
        paidDate: new Date(y, m - 1, d),
        note: note.trim(),
        attachment,
      });
    }

    function pickFile(e) {
      const file = e.target.files && e.target.files[0];
      if (file) {
        setAttachment({ name: file.name, size: file.size, type: file.type });
      }
    }

    const cat = PPx.categoryById(entry.category, entry.kind);
    const isIncome = entry.kind === 'income';
    const diff = PPx.parseAmountInput(amount) - entry.amount;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="cat-dot" style={{ background: cat.color, width: 10, height: 10 }}></span>
              <div className="modal-title">
                {isIncome ? 'Confirmar recebimento' : 'Dar baixa'}
              </div>
            </div>
            <div className="modal-sub">
              {entry.description} · previsto {PPx.formatBRL(entry.amount)} em {PPx.formatDateFull(entry.date)}
            </div>
          </div>

          <div className="modal-body">
            <div className="field-row">
              <div className="field">
                <label>{isIncome ? 'Valor recebido' : 'Valor pago'}</label>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 16,
                    fontWeight: 600,
                    color: isIncome ? 'var(--income-fg)' : 'var(--expense-fg)',
                  }}
                />
                {Math.abs(diff) > 0.005 && (
                  <div style={{
                    fontSize: 11,
                    color: diff > 0 ? (isIncome ? 'var(--income-fg)' : 'var(--expense-fg)') : (isIncome ? 'var(--expense-fg)' : 'var(--income-fg)'),
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {diff > 0 ? '+' : ''}{PPx.formatBRL(diff)} vs. previsto
                  </div>
                )}
                <div className="amount-suggest">
                  <button onClick={() => setAmount(formatInput(entry.amount))}>= previsto</button>
                  <button onClick={() => setAmount(formatInput(Math.round(entry.amount)))}>arredondar</button>
                </div>
              </div>
              <div className="field">
                <label>Data efetiva</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>Observação <span style={{ color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
              <textarea
                placeholder={isIncome ? 'ex: holerite com hora extra' : 'ex: vinho extra no mercado'}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            <div className="field">
              <label>{isIncome ? 'Holerite / comprovante' : 'Comprovante'} <span style={{ color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={pickFile}
              />
              {attachment ? (
                <div className="attach-zone has-file">
                  <Icon name="receipt" size={16} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{attachment.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--paid)', opacity: 0.7 }}>{Math.round((attachment.size || 0) / 1024)} kB</div>
                  </div>
                  <button className="icon-btn" onClick={() => setAttachment(null)}>
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ) : (
                <div className="attach-zone" onClick={() => fileRef.current && fileRef.current.click()}>
                  <Icon name="paperclip" size={14} /> &nbsp;arraste ou clique para anexar
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn ghost" onClick={onClose}>Cancelar</button>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn primary" onClick={save}>
                {isIncome ? 'Confirmar recebimento' : 'Confirmar pagamento'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function formatInput(n) {
    if (n === null || n === undefined) return '';
    return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function toInputDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  window.BaixaModal = BaixaModal;
})();
