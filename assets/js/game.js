import {
  api,
  state,
  guest,
  saveGuest,
  shuffle,
  refreshProfile,
} from "./core.js?v=2.2.0";

export class Match {
  constructor(options) {
    this.options = options;
    this.online = !!state.user;
    this.feedback = null;
    this.result = null;
  }
  async start() {
    if (this.online) {
      this.current = await api(
        this.options.mode === "challenge" ? "join-challenge" : "start-match",
        this.options,
      );
      return this.current;
    }
    if (this.options.mode === "challenge")
      throw new Error("Entre na sua conta para participar do desafio.");
    const { default: bank } = await import("./practice-bank.js?v=2.2.0");
    const { mode, map = "all", exam = "" } = this.options;
    let pool = bank.filter(
      (q) =>
        q.answer !== null &&
        (exam ? q.exam === exam : mode === "review" || q.kind === "original"),
    );
    if (map !== "all")
      pool = pool.filter((q) => q.area === map || q.specialties.includes(map));
    if (mode === "review")
      pool = pool.filter((q) => guest.wrong.includes(q.id));
    if (!pool.length)
      throw new Error(
        mode === "review"
          ? "Você não tem erros pendentes nesta seleção."
          : "Ainda não há questões disponíveis nesta seleção.",
      );
    if (mode === "exam" && !exam)
      throw new Error("Escolha um caderno oficial.");
    const count = { duel: 7, competitive: 9, cup: 15, exam: 100 }[mode] || 10;
    if (["duel", "competitive", "cup"].includes(mode) && pool.length < count)
      throw new Error(
        `Esse modo precisa de ${count} questões diferentes. Escolha uma área maior.`,
      );
    if (mode === "exam") pool.sort((a, b) => a.number - b.number);
    else pool = shuffle(pool);
    this.items = pool.slice(0, count).map((q) => {
      const order =
        q.kind === "original"
          ? shuffle(q.options.map((_, i) => i))
          : q.options.map((_, i) => i);
      return {
        raw: q,
        order,
        question: {
          ...q,
          answer: undefined,
          explanation: undefined,
          options: order.map((i) => q.options[i]),
        },
      };
    });
    this.current = {
      id: crypto.randomUUID(),
      mode,
      map,
      index: 0,
      total: this.items.length,
      score: 0,
      botScore: 0,
      correct: 0,
      roundsWon: 0,
      roundsLost: 0,
      stage: 0,
      timeLimit: ["duel", "competitive", "cup"].includes(mode) ? 60 : 0,
      question: this.items[0].question,
    };
    this.stageMe = 0;
    this.stageBot = 0;
    this.started = performance.now();
    this.issued = performance.now();
    return this.current;
  }
  async answer(choice) {
    if (this.feedback) throw new Error("Essa questão já foi respondida.");
    if (this.online) {
      this.feedback = await api("answer", {
        match: this.current.id,
        question: this.current.question.id,
        choice,
      });
      this.result = this.feedback.result;
      return this.feedback;
    }
    const c = this.current,
      item = this.items[c.index],
      q = item.raw;
    const elapsed = (performance.now() - this.issued) / 1000;
    if (c.timeLimit && elapsed > 65) choice = -1;
    const correct = choice >= 0 && item.order[choice] === q.answer;
    const points = correct
      ? 100 +
        (c.timeLimit ? Math.max(0, 50 - Math.round((elapsed * 50) / 60)) : 0)
      : 0;
    const botPoints =
      c.timeLimit && Math.random() < 0.6
        ? 105 + Math.floor(Math.random() * 41)
        : 0;
    c.score += points;
    c.botScore += botPoints;
    c.correct += +correct;
    c.index++;
    if (c.mode === "competitive") {
      const team =
        Array.from({ length: 4 }, () => +(Math.random() < 0.5)).reduce(
          (a, b) => a + b,
          0,
        ) + (correct ? 2 : 0);
      const enemies = Array.from(
        { length: 5 },
        () => +(Math.random() < 0.5),
      ).reduce((a, b) => a + b, 0);
      if (team > enemies || (team === enemies && correct)) c.roundsWon++;
      else c.roundsLost++;
    }
    if (c.mode === "cup") {
      this.stageMe += points;
      this.stageBot += botPoints;
      if (c.index % 5 === 0) {
        if (this.stageMe <= this.stageBot) this.eliminated = true;
        this.stageMe = 0;
        this.stageBot = 0;
      }
    }
    guest.answered++;
    guest.correct += +correct;
    guest.stats[q.area] ??= { answered: 0, correct: 0 };
    guest.stats[q.area].answered++;
    guest.stats[q.area].correct += +correct;
    guest.wrong = guest.wrong.filter((id) => id !== q.id);
    if (!correct) guest.wrong.push(q.id);
    const finished =
      c.index >= c.total ||
      this.eliminated ||
      c.roundsWon >= 5 ||
      c.roundsLost >= 5;
    if (finished) {
      const ranked = ["duel", "competitive", "cup"].includes(c.mode);
      const win =
        c.mode === "competitive"
          ? c.roundsWon > c.roundsLost
          : c.mode === "cup"
            ? !this.eliminated && c.index === c.total
            : c.score > c.botScore;
      const delta = ranked ? (win ? 20 : -12) : 0,
        xp = c.correct * 20 + (ranked && win ? 80 : 10);
      this.result = {
        win,
        ranked,
        ratingDelta: delta,
        xp,
        score: c.score,
        botScore: c.botScore,
        correct: c.correct,
        answered: c.index,
        total: c.total,
        roundsWon: c.roundsWon,
        roundsLost: c.roundsLost,
        eliminated: !!this.eliminated,
      };
      guest.xp += xp;
      guest.points += c.score;
      guest.rating = Math.max(0, guest.rating + delta);
      guest.played++;
      guest.wins += +(ranked && win);
      guest.history.unshift({
        mode: c.mode,
        map_id: c.map,
        score: c.score,
        correct: c.correct,
        finished_at: Math.floor(Date.now() / 1000),
        result_json: JSON.stringify(this.result),
      });
      guest.history = guest.history.slice(0, 20);
    }
    saveGuest();
    this.feedback = {
      correct,
      answer: item.order.indexOf(q.answer),
      explanation: q.explanation,
      points,
      botPoints,
      headshot: correct && c.timeLimit > 0 && elapsed < 18,
      state: { ...c, question: undefined },
      result: this.result,
    };
    return this.feedback;
  }
  async next() {
    if (this.result) {
      if (this.online) await refreshProfile();
      return null;
    }
    if (this.online)
      this.current = await api("next-question", { match: this.current.id });
    else {
      this.current.question = this.items[this.current.index].question;
      this.current.stage = Math.min(2, Math.floor(this.current.index / 5));
      this.issued = performance.now();
    }
    this.feedback = null;
    return this.current;
  }
  async abort() {
    if (this.online) await api("abort-match", { match: this.current.id });
  }
}
