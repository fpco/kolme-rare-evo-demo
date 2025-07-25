import type React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  id?: string
}

const Card = ({ children, className, id }: CardProps) => {
  return (
    <div id={id} className={`p-4 ${className}`}>
      {children}
    </div>
  )
}

export default Card
