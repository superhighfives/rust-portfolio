import { type ElementType } from 'react'

interface AnimatedTextProps {
  text: string
  as?: ElementType
  className?: string
}

export default function AnimatedText({ text, as: Tag = 'span', className }: AnimatedTextProps) {
  const words = text.split(' ')

  return (
    <Tag className={`animated-text ${className ?? ''}`} data-animated>
      {words.map((word, i) => (
        <span
          key={i}
          className="word"
          data-word-index={i}
          style={{ opacity: 0, transform: 'translateY(20px)', display: 'inline-block' }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </Tag>
  )
}
