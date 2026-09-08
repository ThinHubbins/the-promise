// components/OutletFinder.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAddresses, createAddress, setDefaultAddress } from '../lib/addresses';
import type { Address } from '../lib/types';
import {
  findNearestOutlets,
  formatDistance,
  directionsUrl,
  type OutletWithDistance,
} from '../lib/outlets';
import { geocodeAddress, suggestAddresses, type AddressSuggestion } from '../lib/geocodeClient';

/* ---------------- Icons ---------------- */

function SearchIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function PinIcon({ size = 22 }: { size?: number }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" style={{ width: size, height: size }}>
      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}

function DirectionsIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
      <path d="M12 9v4M12 17h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="icon finder-spinner" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

/* ---------------- Types ---------------- */

type FinderStatus = 'idle' | 'loading' | 'result' | 'error';

type SaveFormState = {
  fullName: string;
  phone: string;
  city: string;
  state: string;
};

const EMPTY_SAVE_FORM: SaveFormState = { fullName: '', phone: '', city: '', state: '' };
const SUGGEST_DEBOUNCE_MS = 300;
const SUGGEST_MIN_CHARS = 3;

/* ---------------- Component ---------------- */

export default function OutletFinder() {
  const { user, loading: authLoading } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [usingSavedAddress, setUsingSavedAddress] = useState<Address | null>(null);
  const [manualMode, setManualMode] = useState(false);

  const [addressInput, setAddressInput] = useState('');
  const [status, setStatus] = useState<FinderStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nearest, setNearest] = useState<OutletWithDistance[] | null>(null);
  const [resolvedLabel, setResolvedLabel] = useState<string>('');

  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveForm, setSaveForm] = useState<SaveFormState>(EMPTY_SAVE_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ---- Autocomplete state ----
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Exact coordinates from a picked suggestion. Cleared the moment the
  // user edits the text again, so a stale selection can never silently
  // stand in for what's actually in the box.
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const skipNextFetchRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);

  // Load the logged-in user's saved addresses once auth resolves.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAddressesLoaded(true);
      return;
    }
    (async () => {
      try {
        const list = await fetchAddresses();
        setAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0] ?? null;
        if (def) {
          setUsingSavedAddress(def);
        } else {
          setManualMode(true);
        }
      } catch (err) {
        console.error('Failed to load saved addresses', err);
        setManualMode(true);
      } finally {
        setAddressesLoaded(true);
      }
    })();
  }, [authLoading, user]);

  // Automatically run the finder once we know which saved address to use.
  useEffect(() => {
    if (!usingSavedAddress) return;
    const full = `${usingSavedAddress.addressLine}, ${usingSavedAddress.city}, ${usingSavedAddress.state}`;
    runFinder(full, full);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingSavedAddress]);

  // Debounced address-suggestion lookup as the user types.
  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    setSelectedCoords(null); // typing invalidates any previously picked suggestion

    const trimmed = addressInput.trim();
    if (trimmed.length < SUGGEST_MIN_CHARS) {
      setSuggestions([]);
      setSuggestOpen(false);
      setSuggestLoading(false);
      return;
    }

    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSuggestLoading(true);
      try {
        const results = await suggestAddresses(trimmed, controller.signal);
        setSuggestions(results);
        setSuggestOpen(results.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          setSuggestions([]);
          setSuggestOpen(false);
        }
      } finally {
        setSuggestLoading(false);
      }
    }, SUGGEST_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [addressInput]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (inputWrapRef.current && !inputWrapRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function runFinder(queryAddress: string, label: string) {
  setStatus('loading');
  setErrorMsg(null);
  try {
    const geo = await geocodeAddress(queryAddress);
    const results = findNearestOutlets(geo.lat, geo.lng);
    setNearest(results);
    setResolvedLabel(geo.matchedQuery ?? label);
    setStatus('result');
  } catch (err) {
    setStatus('error');
    setNearest(null);
    setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
  }
}

  // Used when we already have exact coordinates (a picked suggestion or a
  // saved address geocode) — no text parsing involved.
  function runFinderFromCoords(lat: number, lng: number, label: string) {
    setErrorMsg(null);
    const results = findNearestOutlets(lat, lng);
    setNearest(results);
    setResolvedLabel(label);
    setStatus('result');
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = addressInput.trim();
    if (trimmed.length < 5) {
      setStatus('error');
      setErrorMsg('Please enter a fuller address — street, area, and city help most.');
      return;
    }
    // If the text still matches a picked suggestion, use its exact
    // coordinates instead of re-parsing what's on screen.
    if (selectedCoords) {
      runFinderFromCoords(selectedCoords.lat, selectedCoords.lng, trimmed);
      return;
    }
    runFinder(trimmed, trimmed);
  }

  function handleSelectSuggestion(s: AddressSuggestion) {
    skipNextFetchRef.current = true;
    setAddressInput(s.label);
    setSelectedCoords({ lat: s.lat, lng: s.lng });
    setSuggestions([]);
    setSuggestOpen(false);
    setActiveIndex(-1);
    runFinderFromCoords(s.lat, s.lng, s.label);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setSuggestOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleUseAnotherAddress() {
    setUsingSavedAddress(null);
    setManualMode(true);
    setStatus('idle');
    setNearest(null);
    setErrorMsg(null);
    setSaved(false);
    setShowSaveForm(false);
    setSuggestions([]);
    setSuggestOpen(false);
    setSelectedCoords(null);
  }

  function handlePickSavedAddress(addr: Address) {
    setManualMode(false);
    setUsingSavedAddress(addr);
    setSaved(false);
    setShowSaveForm(false);
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!saveForm.fullName || !saveForm.phone || !saveForm.city || !saveForm.state) return;

    setSaving(true);
    try {
      const created = await createAddress(user.id, {
        label: 'Home',
        fullName: saveForm.fullName,
        phone: saveForm.phone,
        addressLine: addressInput.trim(),
        city: saveForm.city,
        state: saveForm.state,
        isDefault: addresses.length === 0,
      });
      setAddresses((prev) => [...prev, created]);
      if (addresses.length === 0) {
        await setDefaultAddress(user.id, created.id);
      }
      setSaved(true);
      setShowSaveForm(false);
    } catch (err) {
      console.error('Failed to save address', err);
    } finally {
      setSaving(false);
    }
  }

  const nearestOutlet = nearest?.[0] ?? null;
  const otherAddresses = useMemo(
    () => addresses.filter((a) => a.id !== usingSavedAddress?.id),
    [addresses, usingSavedAddress]
  );

  const showManualForm = !authLoading && addressesLoaded && (!user || manualMode) && !usingSavedAddress;

  return (
    <div className="finder-card">
      <div className="finder-head">
        <span className="section-tag">Step 1</span>
        <h2>Find your nearest outlet</h2>
        <p>Enter your address and we&apos;ll match you with the closest The Promise kitchen.</p>
      </div>

      {(authLoading || !addressesLoaded) && (
        <div className="finder-skeleton">
          <SpinnerIcon />
          <span>Checking your account…</span>
        </div>
      )}

      {!authLoading && addressesLoaded && usingSavedAddress && (
        <div className="finder-saved-address">
          <div className="finder-saved-address-info">
            <PinIcon size={18} />
            <div>
              <span className="finder-saved-label">
                Using your saved address{usingSavedAddress.label ? ` (${usingSavedAddress.label})` : ''}
              </span>
              <span className="finder-saved-value">
                {usingSavedAddress.addressLine}, {usingSavedAddress.city}, {usingSavedAddress.state}
              </span>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleUseAnotherAddress}>
            Change location
          </button>
        </div>
      )}

      {!authLoading && manualMode && otherAddresses.length > 0 && (
        <div className="finder-saved-switch">
          <span className="finder-saved-switch-label">Or use a saved address:</span>
          <div className="finder-saved-switch-list">
            {otherAddresses.map((a) => (
              <button key={a.id} type="button" className="chip" onClick={() => handlePickSavedAddress(a)}>
                {a.label} — {a.city}
              </button>
            ))}
          </div>
        </div>
      )}

      {showManualForm && (
        <form className="finder-form" onSubmit={handleManualSubmit}>
          <div className="field finder-field">
            <label htmlFor="outlet-address">{user ? 'Enter an address' : 'Your address'}</label>
            <div className="finder-input-row">
              <div className="finder-input-wrap" ref={inputWrapRef}>
                <input
                  id="outlet-address"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setSuggestOpen(true);
                  }}
                  placeholder="e.g. 12 Aba Road, Port Harcourt"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={suggestOpen}
                  aria-autocomplete="list"
                  aria-controls="outlet-address-listbox"
                />
                {suggestLoading && (
                  <span className="finder-input-spinner">
                    <SpinnerIcon />
                  </span>
                )}
                {suggestOpen && suggestions.length > 0 && (
                  <ul className="finder-suggestions" id="outlet-address-listbox" role="listbox">
                    {suggestions.map((s, i) => (
                      <li
                        key={s.id}
                        role="option"
                        aria-selected={i === activeIndex}
                        className={`finder-suggestion${i === activeIndex ? ' active' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion(s);
                        }}
                        onMouseEnter={() => setActiveIndex(i)}
                      >
                        <PinIcon size={14} />
                        <span>{s.label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? (
                  <>
                    <SpinnerIcon />
                    Searching
                  </>
                ) : (
                  <>
                    <SearchIcon />
                    Find Nearest Outlet
                  </>
                )}
              </button>
            </div>
            {!user && (
              <span className="field-hint">
                We only use this to find the nearest outlet — it isn&apos;t saved anywhere.
              </span>
            )}
          </div>
        </form>
      )}

      {status === 'error' && errorMsg && (
        <div className="finder-alert">
          <AlertIcon />
          <p>{errorMsg}</p>
        </div>
      )}

      {status === 'result' && nearestOutlet && (
        <div className="finder-result">
          <span className="finder-result-tag">Nearest to {resolvedLabel.split(',')[0]}</span>
          <div className="finder-result-card">
            <div className="finder-result-icon">
              <PinIcon size={26} />
            </div>
            <div className="finder-result-body">
              <h3>{nearestOutlet.name}</h3>
              <p>
                {nearestOutlet.address}, {nearestOutlet.city}, {nearestOutlet.state}
              </p>
              <span className="finder-result-distance">{formatDistance(nearestOutlet.distanceKm)}</span>
            </div>
            <a className="btn btn-primary" href={directionsUrl(nearestOutlet)} target="_blank" rel="noopener noreferrer">
              <DirectionsIcon />
              Get Directions
            </a>
          </div>

          {user && !usingSavedAddress && !saved && (
            <div className="finder-save-row">
              {!showSaveForm ? (
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowSaveForm(true)}>
                  Save this address to my account
                </button>
              ) : (
                <form className="finder-save-form" onSubmit={handleSaveAddress}>
                  <div className="dash-form-row">
                    <div className="field">
                      <label htmlFor="save-name">Full name</label>
                      <input
                        id="save-name"
                        value={saveForm.fullName}
                        onChange={(e) => setSaveForm({ ...saveForm, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="save-phone">Phone number</label>
                      <input
                        id="save-phone"
                        value={saveForm.phone}
                        onChange={(e) => setSaveForm({ ...saveForm, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="dash-form-row">
                    <div className="field">
                      <label htmlFor="save-city">City</label>
                      <input
                        id="save-city"
                        value={saveForm.city}
                        onChange={(e) => setSaveForm({ ...saveForm, city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="save-state">State</label>
                      <input
                        id="save-state"
                        value={saveForm.state}
                        onChange={(e) => setSaveForm({ ...saveForm, state: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="dash-form-actions">
                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                      {saving ? 'Saving…' : 'Save address'}
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowSaveForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {saved && <p className="finder-saved-confirm">Address saved to your account.</p>}

          <button type="button" className="finder-search-again" onClick={handleUseAnotherAddress}>
            Search a different address
          </button>
        </div>
      )}
    </div>
  );
}