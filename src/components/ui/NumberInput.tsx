import { useState } from 'react'

interface NumberInputProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  className?: string
  'aria-label'?: string
}

/**
 * Champ numérique que l'on peut vider et retaper librement : la valeur n'est
 * validée (bornée) qu'à la sortie du champ, contrairement à un `|| défaut` à chaque frappe.
 */
export const NumberInput: React.FC<NumberInputProps> = ({ value, min, max, onChange, className, ...rest }) => {
  const [draft, setDraft] = useState<string | null>(null)

  const commit = () => {
    if (draft === null) return
    const n = parseInt(draft, 10)
    onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : value)
    setDraft(null)
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={draft ?? String(value)}
      onChange={(e) => {
        setDraft(e.target.value)
        const n = parseInt(e.target.value, 10)
        if (Number.isFinite(n) && n >= min && n <= max) onChange(n)
      }}
      onBlur={commit}
      className={className}
      aria-label={rest['aria-label']}
    />
  )
}
