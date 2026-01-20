"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FirstImpression, TimestampNote, ValidationIssue, MIN_LISTEN_SECONDS, MIN_WORDS_PER_SECTION } from "../types";
import { makeClientId, countWords, firstImpressionEnumFromScore } from "../utils";

interface UseReviewFormOptions {
  reviewId: string;
  onDraftSave?: (timestamp: number) => void;
}

export function useReviewForm({ reviewId, onDraftSave }: UseReviewFormOptions) {
  const draftKey = `review_draft_${reviewId}`;

  // Form state
  const [listenTime, setListenTime] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);
  const [firstImpression, setFirstImpression] = useState<FirstImpression | null>(null);
  const [firstImpressionScore, setFirstImpressionScore] = useState<number>(3);
  const [firstImpressionTouched, setFirstImpressionTouched] = useState(false);
  const [productionScore, setProductionScore] = useState<number>(0);
  const [vocalScore, setVocalScore] = useState<number>(0);
  const [originalityScore, setOriginalityScore] = useState<number>(0);
  const [wouldListenAgain, setWouldListenAgain] = useState<boolean | null>(null);
  const [wouldAddToPlaylist, setWouldAddToPlaylist] = useState<boolean | null>(null);
  const [wouldShare, setWouldShare] = useState<boolean | null>(null);
  const [wouldFollow, setWouldFollow] = useState<boolean | null>(null);
  const [perceivedGenre, setPerceivedGenre] = useState("");
  const [similarArtists, setSimilarArtists] = useState("");
  const [bestPart, setBestPart] = useState("");
  const [weakestPart, setWeakestPart] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [nextActions, setNextActions] = useState("");
  const [timestampNotes, setTimestampNotes] = useState<TimestampNote[]>([]);
  const [playerSeconds, setPlayerSeconds] = useState(0);
  const [pendingTimestampFocusId, setPendingTimestampFocusId] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [draftReady, setDraftReady] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  // Section refs for scroll-to functionality
  const firstImpressionRef = useRef<HTMLDivElement>(null);
  const scoresRef = useRef<HTMLDivElement>(null);
  const wouldListenAgainRef = useRef<HTMLDivElement>(null);
  const bestPartRef = useRef<HTMLDivElement>(null);
  const weakestPartRef = useRef<HTMLDivElement>(null);
  const timestampNotesRef = useRef<HTMLDivElement>(null);
  const timestampInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Computed values
  const bestPartWords = countWords(bestPart);
  const weakestPartWords = countWords(weakestPart);
  const meetsTextMinimum = bestPartWords >= MIN_WORDS_PER_SECTION && weakestPartWords >= MIN_WORDS_PER_SECTION;

  const isDirty =
    Boolean(firstImpression) ||
    productionScore > 0 ||
    vocalScore > 0 ||
    originalityScore > 0 ||
    wouldListenAgain !== null ||
    wouldAddToPlaylist !== null ||
    wouldShare !== null ||
    wouldFollow !== null ||
    perceivedGenre.trim().length > 0 ||
    similarArtists.trim().length > 0 ||
    bestPart.trim().length > 0 ||
    weakestPart.trim().length > 0 ||
    additionalNotes.trim().length > 0 ||
    timestampNotes.some((t) => t.note.trim().length > 0);

  // Scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      firstImpression: firstImpressionRef,
      scores: scoresRef,
      wouldListenAgain: wouldListenAgainRef,
      bestPart: bestPartRef,
      weakestPart: weakestPartRef,
      timestamps: timestampNotesRef,
    };
    const ref = refs[sectionId];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Add timestamp note
  const addTimestampNote = useCallback((seconds: number) => {
    const id = makeClientId();
    setTimestampNotes((prev) => {
      const next = [...prev, { id, seconds: Math.max(0, Math.floor(seconds)), note: "" }];
      next.sort((a, b) => (a.seconds - b.seconds) || a.id.localeCompare(b.id));
      return next;
    });
    setPendingTimestampFocusId(id);
    setTimeout(() => scrollToSection("timestamps"), 0);
  }, [scrollToSection]);

  // Remove timestamp note
  const removeTimestampNote = useCallback((id: string) => {
    setTimestampNotes((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Update timestamp note
  const updateTimestampNote = useCallback((id: string, note: string) => {
    setTimestampNotes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, note } : p))
    );
  }, []);

  // Set first impression with score
  const handleFirstImpressionChange = useCallback((score: number) => {
    setFirstImpressionScore(score);
    setFirstImpressionTouched(true);
    setFirstImpression(firstImpressionEnumFromScore(score));
  }, []);

  // Validate form
  const validate = useCallback((): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    if (!firstImpressionTouched) {
      issues.push({
        id: "firstImpression",
        message: "Please rate your first impression",
        section: "firstImpression",
      });
    }

    if (productionScore === 0) {
      issues.push({
        id: "productionScore",
        message: "Please rate production quality",
        section: "scores",
      });
    }

    if (originalityScore === 0) {
      issues.push({
        id: "originalityScore",
        message: "Please rate originality",
        section: "scores",
      });
    }

    if (wouldListenAgain === null) {
      issues.push({
        id: "wouldListenAgain",
        message: "Please answer if you would listen again",
        section: "wouldListenAgain",
      });
    }

    if (bestPartWords < MIN_WORDS_PER_SECTION) {
      issues.push({
        id: "bestPart",
        message: `Best part needs ${MIN_WORDS_PER_SECTION - bestPartWords} more words`,
        section: "bestPart",
      });
    }

    if (weakestPartWords < MIN_WORDS_PER_SECTION) {
      issues.push({
        id: "weakestPart",
        message: `Areas for improvement needs ${MIN_WORDS_PER_SECTION - weakestPartWords} more words`,
        section: "weakestPart",
      });
    }

    setValidationIssues(issues);
    return issues;
  }, [firstImpressionTouched, productionScore, originalityScore, wouldListenAgain, bestPartWords, weakestPartWords]);

  // Get form data for submission
  const getFormData = useCallback(() => {
    return {
      firstImpression,
      productionScore,
      vocalScore: vocalScore || null,
      originalityScore,
      wouldListenAgain,
      wouldAddToPlaylist,
      wouldShare,
      wouldFollow,
      perceivedGenre: perceivedGenre.trim() || null,
      similarArtists: similarArtists.trim() || null,
      bestPart: bestPart.trim(),
      weakestPart: weakestPart.trim(),
      additionalNotes: additionalNotes.trim() || null,
      nextActions: nextActions.trim() || null,
      timestamps: timestampNotes
        .filter((t) => t.note.trim())
        .map((t) => ({ seconds: t.seconds, note: t.note.trim() })),
    };
  }, [
    firstImpression,
    productionScore,
    vocalScore,
    originalityScore,
    wouldListenAgain,
    wouldAddToPlaylist,
    wouldShare,
    wouldFollow,
    perceivedGenre,
    similarArtists,
    bestPart,
    weakestPart,
    additionalNotes,
    nextActions,
    timestampNotes,
  ]);

  // Load draft from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.firstImpressionScore !== undefined) {
          setFirstImpressionScore(draft.firstImpressionScore);
          setFirstImpressionTouched(true);
          setFirstImpression(firstImpressionEnumFromScore(draft.firstImpressionScore));
        }
        if (draft.productionScore) setProductionScore(draft.productionScore);
        if (draft.vocalScore) setVocalScore(draft.vocalScore);
        if (draft.originalityScore) setOriginalityScore(draft.originalityScore);
        if (draft.wouldListenAgain !== undefined) setWouldListenAgain(draft.wouldListenAgain);
        if (draft.wouldAddToPlaylist !== undefined) setWouldAddToPlaylist(draft.wouldAddToPlaylist);
        if (draft.wouldShare !== undefined) setWouldShare(draft.wouldShare);
        if (draft.wouldFollow !== undefined) setWouldFollow(draft.wouldFollow);
        if (draft.perceivedGenre) setPerceivedGenre(draft.perceivedGenre);
        if (draft.similarArtists) setSimilarArtists(draft.similarArtists);
        if (draft.bestPart) setBestPart(draft.bestPart);
        if (draft.weakestPart) setWeakestPart(draft.weakestPart);
        if (draft.additionalNotes) setAdditionalNotes(draft.additionalNotes);
        if (draft.nextActions) setNextActions(draft.nextActions);
        if (Array.isArray(draft.timestampNotes)) setTimestampNotes(draft.timestampNotes);
      }
    } catch {
      // Ignore localStorage errors
    }
    setDraftReady(true);
  }, [draftKey]);

  // Save draft to localStorage
  useEffect(() => {
    if (!draftReady) return;
    if (!isDirty) return;

    const draft = {
      firstImpressionScore: firstImpressionTouched ? firstImpressionScore : undefined,
      productionScore: productionScore || undefined,
      vocalScore: vocalScore || undefined,
      originalityScore: originalityScore || undefined,
      wouldListenAgain,
      wouldAddToPlaylist,
      wouldShare,
      wouldFollow,
      perceivedGenre: perceivedGenre || undefined,
      similarArtists: similarArtists || undefined,
      bestPart: bestPart || undefined,
      weakestPart: weakestPart || undefined,
      additionalNotes: additionalNotes || undefined,
      nextActions: nextActions || undefined,
      timestampNotes: timestampNotes.length > 0 ? timestampNotes : undefined,
    };

    try {
      localStorage.setItem(draftKey, JSON.stringify(draft));
      const now = Date.now();
      setDraftSavedAt(now);
      onDraftSave?.(now);
    } catch {
      // Ignore localStorage errors
    }
  }, [
    draftReady,
    isDirty,
    draftKey,
    firstImpressionTouched,
    firstImpressionScore,
    productionScore,
    vocalScore,
    originalityScore,
    wouldListenAgain,
    wouldAddToPlaylist,
    wouldShare,
    wouldFollow,
    perceivedGenre,
    similarArtists,
    bestPart,
    weakestPart,
    additionalNotes,
    nextActions,
    timestampNotes,
    onDraftSave,
  ]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // Ignore localStorage errors
    }
  }, [draftKey]);

  // Confirm leave
  const confirmLeave = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm("You have unsaved changes. Leave this review?");
  }, [isDirty]);

  return {
    // State
    listenTime,
    setListenTime,
    canSubmit,
    setCanSubmit,
    firstImpression,
    firstImpressionScore,
    firstImpressionTouched,
    productionScore,
    setProductionScore,
    vocalScore,
    setVocalScore,
    originalityScore,
    setOriginalityScore,
    wouldListenAgain,
    setWouldListenAgain,
    wouldAddToPlaylist,
    setWouldAddToPlaylist,
    wouldShare,
    setWouldShare,
    wouldFollow,
    setWouldFollow,
    perceivedGenre,
    setPerceivedGenre,
    similarArtists,
    setSimilarArtists,
    bestPart,
    setBestPart,
    weakestPart,
    setWeakestPart,
    additionalNotes,
    setAdditionalNotes,
    nextActions,
    setNextActions,
    timestampNotes,
    playerSeconds,
    setPlayerSeconds,
    pendingTimestampFocusId,
    setPendingTimestampFocusId,
    validationIssues,
    draftSavedAt,

    // Computed
    bestPartWords,
    weakestPartWords,
    meetsTextMinimum,
    isDirty,

    // Refs
    firstImpressionRef,
    scoresRef,
    wouldListenAgainRef,
    bestPartRef,
    weakestPartRef,
    timestampNotesRef,
    timestampInputRefs,

    // Actions
    scrollToSection,
    addTimestampNote,
    removeTimestampNote,
    updateTimestampNote,
    handleFirstImpressionChange,
    validate,
    getFormData,
    clearDraft,
    confirmLeave,
  };
}
