import { Flame } from 'lucide-react'

export function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="w-full border-t border-fenix-border bg-fenix-surface"
      role="contentinfo"
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-steel">

          {/* Marca */}
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber flex-shrink-0" aria-hidden="true" />
            <p>
              &copy; {year}{' '}
              <span className="text-steel-light font-medium">Projeto Fênix</span>
              {' '}— Engenharia &amp; Soldagem
            </p>
          </div>

          {/* Crédito */}
          <p className="text-steel hover:text-steel-light transition-colors duration-200">
            Desenvolvido por{' '}
            <a
              href="https://github.com/alberto2santos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber hover:text-amber-light underline-offset-2 hover:underline transition-colors duration-200"
              aria-label="Perfil GitHub de Alberto Luiz (abre em nova aba)"
            >
              Alberto Luiz
            </a>
          </p>

        </div>
      </div>
    </footer>
  )
}