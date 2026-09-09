import { HIGHEST_NUMBER } from '@/lib/bingo';

/**
 * Everything taken so far, newest first.
 *
 * Ordered newest-first because the number that just went is the one people are
 * checking their board against.
 */
export function SelectedNumbers({ selected }: { selected: readonly number[] }) {
  const newestFirst = [...selected].reverse();

  return (
    <div className="border-ink-1 rounded-card border-2 p-4">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h2 className="text-ink-1 text-lg font-medium">Taken</h2>
        <span className="text-ink-3 text-sm">
          {selected.length} of {HIGHEST_NUMBER}
        </span>
      </div>
      {newestFirst.length === 0 ? (
        <p className="text-ink-3 text-sm">Nothing taken yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {newestFirst.map((value, index) => (
            <li
              key={value}
              className={
                index === 0
                  ? 'bg-yellow border-ink-1 text-ink-1 min-w-[38px] rounded-[14px] border-2 px-2.5 py-2 text-center text-sm font-medium'
                  : 'bg-peach border-ink-1 text-ink-2 min-w-[38px] rounded-[14px] border-2 px-2.5 py-2 text-center text-sm font-medium'
              }
            >
              {value}
              {index === 0 ? <span className="sr-only"> (most recent)</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
