import { Component } from 'react'
import { BrandMark } from './BrandMark'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Proforma render error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="crash-page">
          <div className="crash-card">
            <BrandMark size={58} />
            <span className="eyebrow eyebrow--danger">Unexpected error · 500</span>
            <h1>The page hit a stone.</h1>
            <p>
              Something broke while rendering this view. Your cart and account are safe.
              Reload the page, or return to the catalog.
            </p>
            <div className="crash-actions">
              <button type="button" className="btn btn--forest" onClick={() => window.location.reload()}>
                Reload page
              </button>
              <a className="btn btn--ghost" href="/">
                Back to Proforma
              </a>
            </div>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}