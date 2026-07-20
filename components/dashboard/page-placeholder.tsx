type PagePlaceholderProps = {
  title: string
  description?: string
}

export function PagePlaceholder({
  title,
  description = "Content coming soon.",
}: PagePlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
