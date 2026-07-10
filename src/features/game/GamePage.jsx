import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OP_META } from "../../lib/constants.js";
import { uid } from "../../lib/id.js";
import { formatSeconds, randInt } from "../../lib/number.js";
import { enabledOps, generateProblem, problemText } from "../../lib/problems.js";

export function GamePage({ preset, onFinish }) {
  const opsPool = useMemo(() => enabledOps(preset), [preset]);
  const [timeLeft, setTimeLeft] = useState(preset.duration);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [problem, setProblem] = useState(() => generateProblem(opsPool[0], preset.operations[opsPool[0]]));
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const startedAtRef = useRef(Date.now());
  const deadlineRef = useRef(startedAtRef.current + preset.duration * 1000);
  const problemStartRef = useRef(Date.now());
  const attemptsRef = useRef([]);
  const scoreRef = useRef(0);
  const inputRef = useRef(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, [problem]);

  const nextProblem = useCallback(() => {
    const op = opsPool[randInt(0, opsPool.length - 1)];
    setProblem(generateProblem(op, preset.operations[op]));
    setInput("");
    problemStartRef.current = Date.now();
  }, [opsPool, preset]);

  const finish = useCallback(
    (finalAttempts, finalScore) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish({
        id: uid("session"),
        presetId: preset.id,
        presetName: preset.name,
        duration: preset.duration,
        startedAt: startedAtRef.current,
        endedAt: Date.now(),
        attempts: finalAttempts,
        score: finalScore,
      });
    },
    [onFinish, preset]
  );

  useEffect(() => {
    function tick() {
      const remainingSeconds = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);
      if (remainingSeconds <= 0) {
        finish(attemptsRef.current, scoreRef.current);
      }
    }

    tick();
    const timer = setInterval(tick, 200);
    return () => clearInterval(timer);
  }, [finish]);

  function submit(raw) {
    if (!problem || finishedRef.current) return;
    const userAnswer = raw === "" ? NaN : Number(raw);
    const correct = userAnswer === problem.answer;
    const responseTimeMs = Date.now() - problemStartRef.current;
    const attempt = {
      id: uid("a"),
      operation: problem.operation,
      a: problem.a,
      b: problem.b,
      answer: problem.answer,
      regrouping: problem.regrouping,
      userAnswer,
      correct,
      responseTimeMs,
      timestamp: Date.now(),
    };
    attemptsRef.current = [...attemptsRef.current, attempt];
    scoreRef.current = correct ? scoreRef.current + 1 : scoreRef.current;
    setAttempts(attemptsRef.current);
    setScore(scoreRef.current);
    setFeedback(correct ? "correct" : "incorrect");
    setTimeout(() => setFeedback(null), 240);
    nextProblem();
  }

  function handleChange(event) {
    const value = event.target.value.replace(/[^0-9]/g, "");
    setInput(value);
    if (value !== "" && Number(value) === problem.answer) {
      submit(value);
    }
  }

  const timePct = timeLeft / preset.duration;
  const timerColor = timePct > 0.5 ? "#45E0B0" : timePct > 0.2 ? "#F2A93B" : "#F2555A";

  return (
    <div className="mm-page mm-game-page">
      <div className="mm-hud">
        <div className="mm-hud-stat">
          <span className="mm-hud-label">Score</span>
          <span className="mm-hud-value">{score}</span>
        </div>
        <div className="mm-hud-stat mm-hud-stat-center">
          <span className="mm-hud-label">Time</span>
          <span className="mm-hud-value" style={{ color: timerColor }}>
            {formatSeconds(timeLeft)}
          </span>
        </div>
      </div>

      <div className="mm-timerbar-track">
        <div className="mm-timerbar-fill" style={{ width: `${timePct * 100}%`, background: timerColor }} />
      </div>

      <div className={`mm-problem-card${feedback ? ` mm-flash-${feedback}` : ""}`}>
        <div className="mm-problem-op-tag" style={{ color: OP_META[problem.operation].color }}>
          {OP_META[problem.operation].label}
        </div>
        <div className="mm-problem-digits">{problemText(problem)} =</div>
        <input
          ref={inputRef}
          className="mm-answer-input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={input}
          onChange={handleChange}
          placeholder="?"
        />
      </div>

      <div className="mm-game-hint">Type your answer &mdash; it submits automatically when correct.</div>
    </div>
  );
}
