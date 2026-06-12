import type { unstable_cache as OriginalUnstableCache } from 'next/cache'

// В тестах next/cache не имеет incremental cache, поэтому оборачиваем функцию
// так, чтобы unstable_cache просто возвращал переданный callback.
export const unstable_cache: typeof OriginalUnstableCache = (fn => fn) as unknown as typeof OriginalUnstableCache

export function revalidatePath() {}
export function revalidateTag() {}
