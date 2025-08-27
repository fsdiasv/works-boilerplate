declare global {
  // eslint-disable-next-line no-var
  var mockSupabaseClient: { auth: Record<string, unknown> } | undefined
}

export {}
