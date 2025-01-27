'use client'

import React, { useState, useEffect, KeyboardEvent } from 'react'
import { Input } from './input'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TagInput({
  value = [],
  onChange,
  placeholder,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newValue = inputValue.trim()
      if (newValue) {
        // Pass the new value to be added to existing tags
        onChange(newValue)
        setInputValue('')
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove the last tag when backspace is pressed and input is empty
      const newTags = [...value]
      newTags.pop()
      onChange(newTags.join(','))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (newValue.includes(',')) {
      // Split by comma and handle each value
      const values = newValue.split(',')
      const lastValue = values.pop() || ''
      
      // Process all complete values except the last one
      values.forEach(val => {
        const trimmed = val.trim()
        if (trimmed) {
          onChange(trimmed)
        }
      })
      
      // Keep the last value in the input if it's not empty
      setInputValue(lastValue)
    } else {
      setInputValue(newValue)
    }
  }

  const removeTag = (indexToRemove: number) => {
    const newTags = value.filter((_, index) => index !== indexToRemove)
    onChange(newTags.join(','))
  }

  return (
    <div className={cn('flex flex-wrap gap-2 p-1 border rounded-md bg-background', className)}>
      {value.map((tag, index) => (
        <span
          key={index}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-secondary text-secondary-foreground rounded-md"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="text-secondary-foreground/50 hover:text-secondary-foreground transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
      />
    </div>
  )
}
