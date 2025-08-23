import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeInTheDocument()
  })

  it('has basic structure', () => {
    render(<App />)
    // Basic test to ensure the app renders
    expect(document.querySelector('div')).toBeTruthy()
  })
})
