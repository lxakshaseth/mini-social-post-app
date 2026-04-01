import { X } from "lucide-react";

function ActionModal({ modal, onClose }) {
  if (!modal) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-card card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{modal.eyebrow || "Quick Response"}</p>
            <h2>{modal.title}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p className="modal-copy">{modal.description}</p>

        {modal.points?.length ? (
          <div className="modal-points">
            {modal.points.map((point) => (
              <div key={point} className="modal-point">
                {point}
              </div>
            ))}
          </div>
        ) : null}

        {modal.cta ? (
          <button type="button" className="primary-action" onClick={onClose}>
            {modal.cta}
          </button>
        ) : null}
      </section>
    </div>
  );
}

export default ActionModal;
