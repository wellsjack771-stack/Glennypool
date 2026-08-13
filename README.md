# Club Championship Pool

Live scoring site for a two-day club championship golf pool.

## Rules

- Four handicap groups. Each entry picks **2 golfers from each group** (8 total).
- Add all eight 36-hole totals, then **void the 2 worst**. Lowest remaining score wins.
- WD or no-show = **100 for that day**.
- Winner takes all. Ties broken by the closest predicted 36-hole score of the Club Championship winner.

Members only need the public leaderboard. You run the desk with a PIN.

## Run it

Needs Node 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page is the live board and refreshes every 15 seconds.

## Tournament workflow

1. **Setup** — club name and admin PIN.
2. **Field & scores** — paste the roster (`Name, 8.2, A`). Assign groups A–D by handicap once the list is final. Post day 1 and day 2 as scores come in.
3. **Entries** — name, 2 picks per group, predicted championship total as the tiebreaker.
4. **Live scores** — paste the Golf Genius results page and connect **Overall - Men's Club Championship**. Import the field, then scores pull every few minutes while people watch the board.
5. **Settings** — after the championship, mark the winner so pool ties can be broken.

Pool data lives in `data/pool.json`.

## Put it on the internet

Step-by-step (GitLab + Railway trial): see [DEPLOY.md](./DEPLOY.md).
