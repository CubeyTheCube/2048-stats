const COLORS = [
  "eee4da",
  "ede0c8",
  "f2b179",
  "f59563",
  "f67c5f",
  "f65e3b",
  "edcf72",
  "edcc61",
  "edc850",
  "edc53f",
  "edc22e",
  "9e29cf",
  "611980",
  "3a0f4c",
  "3c3a32",
];

function getFontSize(tile) {
  return tile < 128
    ? 55
    : tile < 1024
    ? 45
    : tile < 16384
    ? 35
    : tile < 32768
    ? 30
    : 25;
}

window.addEventListener("load", () => {
  for (const input of document.querySelectorAll("input")) {
    input.dataset.y = input.style.top;
    input.style.top = `${parseInt(input.dataset.y, 10) - window.scrollY}px`;
  }
});

window.addEventListener("scroll", () => {
  for (const input of document.querySelectorAll("input")) {
    input.style.top = `${parseInt(input.dataset.y, 10) - window.scrollY}px`;
  }
});

document.getElementById("go").addEventListener("click", calc);

for (const input of document.querySelectorAll("input.tile")) {
  input.style.top = `${81 + Math.floor(input.id / 4) * 58}px`;
  input.style.left = `${16 + (input.id % 4) * 60}px`;
  input.addEventListener("input", (e) => {
    const value = e.target.value.endsWith("k")
      ? 2 ** Math.ceil(Math.log2(parseInt(e.target.value, 10) * 1000))
      : parseInt(e.target.value, 10);

    e.target.style.fontSize = `${getFontSize(value) / 2.14}px`;
    e.target.style.background = `#${
      COLORS[Math.min(COLORS.length - 1, Math.floor(Math.log2(value)) - 1)]
    }`;

    if (value < 8) {
      e.target.style.color = "#776e65";
    } else {
      e.target.style.color = "#f9f6f2";
    }

    if (Number.isNaN(value)) e.target.style.background = "#d0c4b4";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key.startsWith("Arrow")) {
      if (e.key === "ArrowLeft") {
        if (e.target.selectionStart > 0) {
          return;
        }
      }

      if (e.key === "ArrowRight") {
        if (e.target.selectionStart < e.target.value.length) {
          return;
        }
      }

      e.preventDefault();

      const id = Number(input.id);
      const newInput = {
        Right: Math.floor(id / 4) * 4 + ((id + 1) % 4),
        Left: Math.floor(id / 4) * 4 + ((((id - 1) % 4) + 4) % 4),
        Up: id >= 4 ? id - 4 : id + 12,
        Down: (id + 4) % 16,
      }[e.key.replace("Arrow", "")];

      document.getElementById(newInput.toString()).focus();
    }
  });
}

let lastChanged;
for (const input of document.querySelectorAll(".scoreInput.score")) {
  input.addEventListener("input", (e) => {
    lastChanged = e.target.id;
  });
}

function erf(z) {
  const t = 1.0 / (1.0 + 0.5 * Math.abs(z));
  const ans =
    1 -
    t *
      Math.exp(
        -z * z -
          1.26551223 +
          t *
            (1.00002368 +
              t *
                (0.37409196 +
                  t *
                    (0.09678418 +
                      t *
                        (-0.18628806 +
                          t *
                            (0.27886807 +
                              t *
                                (-1.13520398 +
                                  t *
                                    (1.48851587 +
                                      t * (-0.82215223 + t * 0.17087277))))))))
      );

  if (z >= 0) return ans;

  return -ans;
}

function binomial(n, s, p = 0.9) {
  if (s / p > n) return binomial(n, (n + (n - s / p)) * p);
  const u = n * p;
  const o = (u * (1 - p)) ** 0.5;

  return 0.5 * (1 + erf((s - u) / (o * 2 ** 0.5)));
}

function percentile(spawns, rate) {
  if (rate === 0.9) return 50;
  const chance = binomial(spawns, rate * spawns);
  return 100 * (rate > 0.9 ? 1 - chance : chance);
}

function getNumber(input) {
  const value = document.getElementById(input.toString()).value;

  const number = value
    ? value.endsWith("k")
      ? !Number.isNaN(parseFloat(input, 10))
        ? 2 ** Math.ceil(Math.log2(parseFloat(value, 10) * 1000))
        : parseFloat(value, 10) * 1000
      : parseFloat(value, 10)
    : 0;

  return number;
}

function calc() {
  const board = Array.from({ length: 16 }, (_, idx) => getNumber(idx));

  function maxScore(t) {
    return t ? t * (Math.log2(t) - 2) + t : 0;
  }

  let max = 0;
  let total = 0;
  let total4 = 0;
  for (let i = 0; i < 16; i++) {
    max += maxScore(board[i]);
    total += board[i];
    total4 += board[i] ? Math.floor(board[i] / 4) : 0;
  }

  const score =
    lastChanged === "score"
      ? getNumber("score")
      : lastChanged === "moves"
      ? -2 * total + max + 4 * (getNumber("moves") + 2)
      : ((-2 * total * getNumber("fours")) / 100 +
          (max * getNumber("fours")) / 100 +
          max) /
        (getNumber("fours") / 100 + 1);

  const diff = max - score;
  const fourSpawns = diff / 4;
  const twoSpawns = (total - diff) / 2;
  const spawns = twoSpawns + fourSpawns;
  const moves = spawns - 2;
  const fourPercentage = fourSpawns / spawns;
  const fourMerges = total4 - fourSpawns;
  const seconds =
    getNumber("hours") * 3600 +
    getNumber("minutes") * 60 +
    getNumber("seconds");
  document.getElementById("score").value = score;
  document.getElementById("moves").value = moves;
  document.getElementById("fours").value = fourPercentage * 100;

  const hash = board
    .map((item) => (item ? Math.round(Math.log2(item)).toString(18) : "0"))
    .join("");
  const link = document.createElement("a");
  link.href = `https://2048league.ml/p/${hash}`;
  link.textContent = "Practice link";
  link.target = "_blank";
  document.getElementById("practice").appendChild(link);

  document.getElementById("output").textContent = `
    4 spawns: ${fourSpawns}
    2 spawns: ${twoSpawns}
    Total spawns: ${spawns}
    4 merges: ${fourMerges}
    Score from merging 4s: ${fourMerges * 4}
    Score without merging 4s: ${score - fourMerges * 4}
    Moves per second: ${moves / seconds}
    Moves per minute: ${(moves / seconds) * 60}
    2 spawn rate percentile: ${percentile(spawns, twoSpawns / spawns)}
   `;
}
