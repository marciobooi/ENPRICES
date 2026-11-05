interface FieldLabelProps {
  id: string
  /** `id` of the control the label belongs to. */
  htmlFor: string
  label: string
  required?: boolean
  /** Translated "(required)" text. */
  requiredText: string
  /** Hide the label on screen but keep it for screen readers. */
  hidden?: boolean
}

/** ECL form label: `ecl-form-label-wrapper` with the label text and the "(required)" marker. */
export function FieldLabel({ id, htmlFor, label, required, requiredText, hidden }: FieldLabelProps) {
  return (
    <label id={id} htmlFor={htmlFor} className={`ecl-form-label-wrapper${hidden ? ' ecl-u-sr-only' : ''}`}>
      <span className="ecl-form-label">{label}</span>
      {required && <span className="ecl-form-label__required">{requiredText}</span>}
    </label>
  )
}
