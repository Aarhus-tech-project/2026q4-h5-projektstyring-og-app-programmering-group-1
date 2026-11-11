package passwordreset

import (
	"sync"
	"time"
)

// rule describes a sliding-window rate limit: at most Limit hits per Window,
// and (optionally) at least Cooldown between two hits.
type rule struct {
	Limit    int
	Window   time.Duration
	Cooldown time.Duration
}

// limiter is a small in-memory sliding-window rate limiter. It applies the same
// rules whether or not an email belongs to an account, so its answers never
// reveal which emails are registered.
//
// State lives in this process only; the database limits in Service still apply
// after a restart.
type limiter struct {
	mu      sync.Mutex
	now     func() time.Time
	entries map[string]*limitEntry
}

type limitEntry struct {
	hits   []time.Time
	window time.Duration
}

const limiterSweepSize = 10_000

func newLimiter(now func() time.Time) *limiter {
	return &limiter{now: now, entries: make(map[string]*limitEntry)}
}

// take records a hit for key if the rule allows it. Otherwise it returns false
// and how long the caller has to wait.
func (l *limiter) take(key string, r rule) (bool, time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()

	if wait := l.waitLocked(key, r); wait > 0 {
		return false, wait
	}
	l.recordLocked(key, r)
	return true, 0
}

// blocked reports whether key has reached the rule's limit, without recording a hit.
func (l *limiter) blocked(key string, r rule) (bool, time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()
	wait := l.waitLocked(key, r)
	return wait > 0, wait
}

// record adds a hit and returns the number of hits now inside the window.
func (l *limiter) record(key string, r rule) int {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.recordLocked(key, r)
}

func (l *limiter) reset(key string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.entries, key)
}

func (l *limiter) waitLocked(key string, r rule) time.Duration {
	e := l.entries[key]
	if e == nil {
		return 0
	}
	now := l.now()
	e.prune(now)
	if len(e.hits) == 0 {
		return 0
	}
	var wait time.Duration
	if r.Cooldown > 0 {
		if w := e.hits[len(e.hits)-1].Add(r.Cooldown).Sub(now); w > wait {
			wait = w
		}
	}
	if len(e.hits) >= r.Limit {
		// Wait until the oldest hit that keeps us at the limit drops out of the window.
		if w := e.hits[len(e.hits)-r.Limit].Add(r.Window).Sub(now); w > wait {
			wait = w
		}
	}
	return wait
}

func (l *limiter) recordLocked(key string, r rule) int {
	now := l.now()
	if len(l.entries) >= limiterSweepSize {
		l.sweepLocked(now)
	}
	e := l.entries[key]
	if e == nil {
		e = &limitEntry{window: r.Window}
		l.entries[key] = e
	}
	e.prune(now)
	e.hits = append(e.hits, now)
	return len(e.hits)
}

// sweepLocked drops keys with no hits left inside their window, so memory stays bounded.
func (l *limiter) sweepLocked(now time.Time) {
	for key, e := range l.entries {
		e.prune(now)
		if len(e.hits) == 0 {
			delete(l.entries, key)
		}
	}
}

func (e *limitEntry) prune(now time.Time) {
	cutoff := now.Add(-e.window)
	i := 0
	for i < len(e.hits) && !e.hits[i].After(cutoff) {
		i++
	}
	e.hits = e.hits[i:]
}
